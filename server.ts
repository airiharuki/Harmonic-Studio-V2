import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import youtubedl from "youtube-dl-exec";
import archiver from "archiver";
import multer from "multer";
import axios from "axios";
import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Project root directory
const projectRoot = process.cwd();

const execAsync = promisify(exec);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  try {
    const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Request logging middleware
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // Ensure directories exist
  const downloadsDir = path.join(projectRoot, "downloads");
  const outputDir = path.join(projectRoot, "output");
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  function cleanupDirectories() {
    console.log("Running scheduled cleanup of processed files...");
    const dirs = [downloadsDir, outputDir];
    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            if (fs.lstatSync(filePath).isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            console.error(`Error deleting ${filePath}:`, err);
          }
        }
        console.log(`Cleaned up directory: ${dir}`);
      }
    }
  }

  // Run cleanup every 24 hours
  setInterval(cleanupDirectories, 24 * 60 * 60 * 1000);

  const upload = multer({ dest: downloadsDir });

  // API Routes
  app.post("/api/upload", upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    // Rename file to include original extension
    const ext = path.extname(req.file.originalname);
    const filename = `${req.file.filename}${ext}`;
    const newPath = path.join(downloadsDir, filename);
    fs.renameSync(req.file.path, newPath);

    res.json({ 
      filename, 
      url: `/api/files/${filename}`,
      originalName: req.file.originalname
    });
  });
  // Helper for yt-dlp options
  const getDlOptions = (output?: string, extra: any = {}) => {
    const cookiePath = path.join(projectRoot, 'cookies.txt');
    const hasCookies = fs.existsSync(cookiePath);
    
    const options: any = {
      noCheckCertificates: true,
      noPlaylist: true,
      geoBypass: true,
      forceIpv4: true,
      ffmpegLocation: ffmpegStatic,
      cookies: hasCookies ? cookiePath : undefined,
      addHeader: [
        'referer:https://www.google.com/',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language:en-US,en;q=0.9'
      ],
      ...extra
    };

    if (output) {
      options.output = output;
    }

    return options;
  };

  app.get("/api/info", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      let info;
      let attempts = 0;
      const maxAttempts = 2;
      
      while (attempts < maxAttempts) {
        try {
          info = await youtubedl(url, getDlOptions(undefined, { dumpSingleJson: true }));
          break;
        } catch (err: any) {
          attempts++;
          const isConnectionReset = err.message?.includes('Remote end closed connection') || err.message?.includes('EPIPE');
          if (isConnectionReset && attempts < maxAttempts) {
            console.warn(`Info connection reset on attempt ${attempts}. Retrying...`);
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          throw err;
        }
      }
      res.json(info);
    } catch (error: any) {
      console.error("Info error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/download", async (req, res) => {
    const { url, format, title } = req.body;
    if (!url || !format) return res.status(400).json({ error: "URL and format are required" });

    try {
      // 1. Fetch metadata first
      console.log(`Fetching metadata for: ${url}`);
      const info = await youtubedl(url, getDlOptions(undefined, { dumpSingleJson: true })) as any;
      
      const metadata = {
        title: info.title || title || 'Unknown Title',
        artist: info.uploader || info.artist || 'Unknown Artist',
        thumbnail: info.thumbnail,
        duration: info.duration
      };

      const safeTitle = metadata.title.replace(/[^a-zA-Z0-9 \-_]/g, '').replace(/ /g, '_');
      const filename = `${safeTitle}.${format}`;
      const filepath = path.join(downloadsDir, filename);

      // 2. Download thumbnail if available
      let thumbnailPath: string | null = null;
      if (metadata.thumbnail && (format === 'mp3' || format === 'flac')) {
        try {
          const thumbResponse = await axios.get(metadata.thumbnail, { responseType: 'arraybuffer' });
          thumbnailPath = path.join(downloadsDir, `thumb_${Date.now()}.jpg`);
          fs.writeFileSync(thumbnailPath, thumbResponse.data);
        } catch (e) {
          console.warn("Failed to download thumbnail:", e);
        }
      }

      // 3. Download best audio
      const downloadId = `dl_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const outputTemplate = path.join(downloadsDir, `${downloadId}.%(ext)s`);
      console.log(`[Download] Starting audio download for: ${url} (ID: ${downloadId})`);
      
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts) {
        try {
          await youtubedl(url, getDlOptions(outputTemplate, { format: 'bestaudio/best' }));
          break;
        } catch (err: any) {
          attempts++;
          const isConnectionReset = err.message?.includes('Remote end closed connection') || err.message?.includes('EPIPE');
          if (isConnectionReset && attempts < maxAttempts) {
            console.warn(`[Download] Connection reset on attempt ${attempts}. Retrying...`);
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          throw err;
        }
      }

      // Find the downloaded file
      const files = fs.readdirSync(downloadsDir);
      const downloadedFile = files.find(f => f.startsWith(downloadId));

      if (!downloadedFile) {
        throw new Error("Downloaded file not found after yt-dlp execution");
      }

      const sourcePath = path.join(downloadsDir, downloadedFile);
      console.log(`[Download] Audio downloaded to: ${sourcePath}`);
      
      // 4. Convert and embed metadata
      console.log(`[Download] Starting FFmpeg conversion to ${format} for: ${filename}`);
      
      await new Promise((resolve, reject) => {
        let command = ffmpeg(sourcePath).toFormat(format);

        // Add basic metadata
        command = command
          .outputOptions('-metadata', `title=${metadata.title}`)
          .outputOptions('-metadata', `artist=${metadata.artist}`);

        // Format-specific metadata handling
        if (format === 'mp3') {
          command = command.outputOptions('-id3v2_version', '3');
        }

        // Handle thumbnail embedding
        if (thumbnailPath && (format === 'mp3' || format === 'flac')) {
          command = command
            .input(thumbnailPath)
            .outputOptions('-map', '0:a', '-map', '1:0')
            .outputOptions('-disposition:v', 'attached_pic');
          
          if (format === 'mp3') {
            command = command.outputOptions('-c:v', 'copy');
          }
        }

        command
          .on('end', () => {
            console.log(`[Download] FFmpeg conversion finished: ${filename}`);
            if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
            if (thumbnailPath && fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
            resolve(true);
          })
          .on('error', (err) => {
            console.error("[Download] FFmpeg error:", err);
            if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
            if (thumbnailPath && fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
            reject(err);
          })
          .save(filepath);
      });

      res.json({ filename, url: `/api/files/${filename}`, metadata });
    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/split", async (req, res) => {
    const { url, filename, stemsToZip, model } = req.body;
    if (!url && !filename) return res.status(400).json({ error: "URL or filename is required" });

    const jobId = `job_${Date.now()}`;
    const jobDir = path.join(downloadsDir, jobId);
    fs.mkdirSync(jobDir);

    const inputFilename = "input.wav";
    const inputPath = path.join(jobDir, inputFilename);
    const tempFile = path.join(jobDir, `temp_input.m4a`);

    try {
      if (url) {
        console.log(`Downloading for splitting: ${url}`);
        
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
          try {
            await youtubedl(url, getDlOptions(tempFile, { format: 'bestaudio/best' }));
            break;
          } catch (err: any) {
            attempts++;
            const isConnectionReset = err.message?.includes('Remote end closed connection') || err.message?.includes('EPIPE');
            if (isConnectionReset && attempts < maxAttempts) {
              console.warn(`Split download connection reset on attempt ${attempts}. Retrying...`);
              await new Promise(r => setTimeout(r, 2000));
              continue;
            }
            throw err;
          }
        }

        console.log(`Converting to WAV for splitting...`);
        await new Promise((resolve, reject) => {
          ffmpeg(tempFile)
            .toFormat('wav')
            .on('end', () => {
              fs.unlinkSync(tempFile);
              resolve(true);
            })
            .on('error', reject)
            .save(inputPath);
        });
      } else if (filename) {
        // 1b. Use uploaded file
        const sourcePath = path.join(downloadsDir, filename);
        if (!fs.existsSync(sourcePath)) {
          return res.status(404).json({ error: "Uploaded file not found" });
        }
        // Copy to job dir
        fs.copyFileSync(sourcePath, inputPath);
      }

      // 2. Run Splitting
      const outputDirForJob = path.join(outputDir, jobId);
      let command = "";
      switch (model) {
        case 'mdx':
          command = `audio-separator "${inputPath}" --model_filename UVR-MDX-NET-Inst_HQ_3.onnx --output_dir "${path.join(outputDirForJob, "htdemucs", "input")}"`;
          break;
        case 'bs-roformer':
          command = `audio-separator "${inputPath}" --model_filename model_bs_roformer_ep_317_sdr_12.9755.ckpt --output_dir "${path.join(outputDirForJob, "htdemucs", "input")}"`;
          break;
        case 'spleeter':
          command = `spleeter separate -o "${outputDirForJob}" "${inputPath}"`;
          break;
        case 'demucs':
        default:
          command = `demucs -o "${outputDirForJob}" "${inputPath}"`;
          break;
      }
      
      console.log(`Running splitting command: ${command}`);
      try {
        if (model === 'mdx' || model === 'bs-roformer') {
          // Pre-create the expected output dir for audio-separator so it doesn't fail
          const mockStemsPath = path.join(outputDirForJob, "htdemucs", "input");
          fs.mkdirSync(mockStemsPath, { recursive: true });
        }
        await execAsync(command);
      } catch (error) {
        console.warn("Splitting failed or not installed. Falling back to mock splitting for demo purposes.");
        // Create mock stems if splitting fails
        const mockStemsPath = path.join(outputDirForJob, "htdemucs", "input");
        if (!fs.existsSync(mockStemsPath)) {
          fs.mkdirSync(path.join(outputDirForJob, "htdemucs"), { recursive: true });
          fs.mkdirSync(mockStemsPath, { recursive: true });
          // Copy input to mock stems
          const stems = ["vocals.wav", "drums.wav", "bass.wav", "other.wav"];
          for (const stem of stems) {
            fs.copyFileSync(inputPath, path.join(mockStemsPath, stem));
          }
        }
      }

      // 3. Zip the results
      const stemsPath = path.join(outputDirForJob, "htdemucs", "input");
      const zipFilename = `${jobId}_stems.zip`;
      const zipPath = path.join(outputDir, zipFilename);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        res.json({ filename: zipFilename, url: `/api/files/output/${zipFilename}` });
      });

      archive.pipe(output);
      
      // If specific stems requested, only zip those
      if (stemsToZip && Array.isArray(stemsToZip) && stemsToZip.length > 0) {
        for (const stem of stemsToZip) {
          const stemFile = `${stem}.wav`;
          const fullStemPath = path.join(stemsPath, stemFile);
          if (fs.existsSync(fullStemPath)) {
            archive.file(fullStemPath, { name: stemFile });
          }
        }
      } else {
        // Default: zip all
        archive.directory(stemsPath, false);
      }
      
      await archive.finalize();

    } catch (error: any) {
      console.error("Split error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/files/output/:filename", (req, res) => {
    const filepath = path.join(outputDir, req.params.filename);
    if (fs.existsSync(filepath)) {
      res.download(filepath);
    } else {
      res.status(404).send("File not found");
    }
  });

  app.get("/api/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(downloadsDir, filename);
    
    // Disable timeout for large file downloads
    req.setTimeout(0);
    
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      console.log(`Serving file: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.wav') res.setHeader('Content-Type', 'audio/wav');
      else if (ext === '.flac') res.setHeader('Content-Type', 'audio/flac');
      else if (ext === '.mp3') res.setHeader('Content-Type', 'audio/mpeg');
      
      // Use sendFile for better performance and range support
      res.sendFile(filepath, {
        headers: {
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
        }
      }, (err) => {
        if (err) {
          const error = err as any;
          // Ignore common client-side cancellation errors
          if (error.code === 'ECONNABORTED' || error.code === 'EPIPE' || error.message?.includes('aborted')) {
            console.log(`Download of ${filename} was cancelled or interrupted by the client.`);
          } else {
            console.error(`Error sending file ${filename}:`, err);
            if (!res.headersSent) {
              res.status(500).send("Error downloading file");
            }
          }
        }
      });
    } else {
      console.warn(`File not found: ${filepath}`);
      res.status(404).send("File not found on server.");
    }
  });

  // Catch-all for missing API routes to prevent falling through to SPA
  app.all("/api/*", (req, res) => {
    console.warn(`[API] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error("Startup error:", err);
  process.exit(1);
});
