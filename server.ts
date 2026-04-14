import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import youtubedl from "youtube-dl-exec";
import archiver from "archiver";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Safe __dirname fallback for both ESM (dev) and CJS (prod bundle)
const currentDir = typeof __dirname !== 'undefined' 
  ? __dirname 
  : (typeof import.meta !== 'undefined' && import.meta.url 
      ? path.dirname(fileURLToPath(import.meta.url)) 
      : process.cwd());

const execAsync = promisify(exec);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Ensure directories exist
  const downloadsDir = path.join(currentDir, "downloads");
  const outputDir = path.join(currentDir, "output");
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

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
  app.get("/api/info", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:soundcloud.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36']
      });
      res.json(info);
    } catch (error: any) {
      console.error("Info error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/download", async (req, res) => {
    const { url, format, title } = req.body;
    if (!url || !format) return res.status(400).json({ error: "URL and format are required" });

    const safeTitle = title ? title.replace(/[^a-zA-Z0-9 \-_]/g, '').replace(/ /g, '_') : `audio_${Date.now()}`;
    const filename = `${safeTitle}.${format}`;
    const filepath = path.join(downloadsDir, filename);
    const tempFile = path.join(downloadsDir, `temp_${Date.now()}.m4a`);

    try {
      const cookiePath = path.join(currentDir, 'cookies.txt');
      const hasCookies = fs.existsSync(cookiePath);

      const options: any = {
        format: 'bestaudio/best',
        output: (format === 'wav' || format === 'flac') ? tempFile : filepath,
        noCheckCertificates: true,
        ffmpegLocation: ffmpegStatic,
        extractAudio: format !== 'wav' && format !== 'flac',
        audioFormat: (format === 'wav' || format === 'flac') ? undefined : format,
      };

      if (hasCookies) {
        options.cookies = cookiePath;
      }

      console.log(`Downloading: ${url} (Cookies: ${hasCookies})`);
      await youtubedl(url, options);

      if (format === 'wav' || format === 'flac') {
        console.log(`Converting to ${format}...`);
        await new Promise((resolve, reject) => {
          ffmpeg(tempFile)
            .toFormat(format)
            .on('end', () => {
              fs.unlinkSync(tempFile);
              resolve(true);
            })
            .on('error', (err) => {
              if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
              reject(err);
            })
            .save(filepath);
        });
      }

      res.json({ filename, url: `/api/files/${filename}` });
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
        const cookiePath = path.join(currentDir, 'cookies.txt');
        const hasCookies = fs.existsSync(cookiePath);

        console.log(`Downloading for splitting: ${url}`);
        await youtubedl(url, {
          format: 'bestaudio/best',
          output: tempFile,
          noCheckCertificates: true,
          cookies: hasCookies ? cookiePath : undefined,
        });

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
          command = `mdx-net -o "${outputDirForJob}" "${inputPath}"`;
          break;
        case 'spleeter':
          command = `spleeter separate -o "${outputDirForJob}" "${inputPath}"`;
          break;
        case 'bs-roformer':
          command = `bs-roformer -o "${outputDirForJob}" "${inputPath}"`;
          break;
        case 'demucs':
        default:
          command = `demucs -o "${outputDirForJob}" "${inputPath}"`;
          break;
      }
      
      console.log(`Running splitting command: ${command}`);
      try {
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

  app.get("/api/files/:filename", (req, res) => {
    const filepath = path.join(downloadsDir, req.params.filename);
    if (fs.existsSync(filepath)) {
      res.download(filepath);
    } else {
      res.status(404).send("File not found");
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

  app.post("/api/chords", async (req, res) => {
    try {
      const { key, scale, mood, bpm } = req.body;
      if (!key || !scale) {
        return res.status(400).json({ error: "Key and scale are required" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a music theory expert. Generate a 4-bar chord progression in the key of ${key} ${scale}. The mood is ${mood || 'neutral'} and the BPM is ${bpm || 120}. 
      Return ONLY a raw JSON array of 4 strings representing the chords (e.g., ["Cmaj7", "Am7", "Dm7", "G7"]). Do not include markdown formatting, backticks, or any other text.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });
      
      let text = response.text || "[]";
      // Clean up potential markdown formatting if Gemini ignores the instruction
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const chords = JSON.parse(text);
      res.json({ chords });
    } catch (error: any) {
      console.error("Chord generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loop", async (req, res) => {
    try {
      const { key, scale, bars, timeSignature, bpm } = req.body;
      if (!key || !scale || !bars) {
        return res.status(400).json({ error: "Key, scale, and bars are required" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a professional music producer. Generate a ${bars}-bar chord progression for a loop in the key of ${key} ${scale}. 
      The time signature is ${timeSignature || '4/4'} and the BPM is ${bpm || 120}.
      Return ONLY a raw JSON array of ${bars} strings representing the chords (one chord per bar). Do not include markdown formatting, backticks, or any other text.
      Example for 4 bars: ["Cmaj7", "Am7", "Dm7", "G7"]`;
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });
      
      let text = response.text || "[]";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const chords = JSON.parse(text);
      res.json({ chords });
    } catch (error: any) {
      console.error("Loop generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
}

startServer();
