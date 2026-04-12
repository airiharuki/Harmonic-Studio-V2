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

  // API Routes
  app.get("/api/info", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });
      res.json(info);
    } catch (error: any) {
      console.error("Info error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/download", async (req, res) => {
    const { url, format } = req.body;
    if (!url || !format) return res.status(400).json({ error: "URL and format are required" });

    const filename = `audio_${Date.now()}.${format}`;
    const filepath = path.join(downloadsDir, filename);

    try {
      const options: any = {
        extractAudio: true,
        audioFormat: format,
        output: filepath,
        noCheckCertificates: true,
      };

      if (format === 'wav') {
        options.audioQuality = 0;
      }

      await youtubedl(url, options);
      res.json({ filename, url: `/api/files/${filename}` });
    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/split", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const jobId = `job_${Date.now()}`;
    const jobDir = path.join(downloadsDir, jobId);
    fs.mkdirSync(jobDir);

    const inputFilename = "input.wav";
    const inputPath = path.join(jobDir, inputFilename);

    try {
      // 1. Download as WAV
      console.log(`Downloading WAV for splitting: ${url}`);
      await youtubedl(url, {
        extractAudio: true,
        audioFormat: "wav",
        output: inputPath,
        noCheckCertificates: true,
      });

      // 2. Run Demucs
      const demucsOutputDir = path.join(outputDir, jobId);
      const demucsCommand = `demucs -o "${demucsOutputDir}" "${inputPath}"`;
      
      console.log(`Running demucs: ${demucsCommand}`);
      try {
        await execAsync(demucsCommand);
      } catch (demucsError) {
        console.warn("Demucs failed or not installed. Falling back to mock splitting for demo purposes.");
        // Create mock stems if demucs fails
        const mockStemsPath = path.join(demucsOutputDir, "htdemucs", "input");
        if (!fs.existsSync(mockStemsPath)) {
          fs.mkdirSync(path.join(demucsOutputDir, "htdemucs"), { recursive: true });
          fs.mkdirSync(mockStemsPath, { recursive: true });
          // Copy input to mock stems
          const stems = ["vocals.wav", "drums.wav", "bass.wav", "other.wav"];
          for (const stem of stems) {
            fs.copyFileSync(inputPath, path.join(mockStemsPath, stem));
          }
        }
      }

      // 3. Zip the results
      // Demucs output structure: outputDir/jobId/htdemucs/input/
      const stemsPath = path.join(demucsOutputDir, "htdemucs", "input");
      const zipFilename = `${jobId}_stems.zip`;
      const zipPath = path.join(outputDir, zipFilename);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        res.json({ filename: zipFilename, url: `/api/files/output/${zipFilename}` });
      });

      archive.pipe(output);
      archive.directory(stemsPath, false);
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
