import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import crypto from "crypto";
import { exec, execSync, spawn } from "child_process";
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

// yt-dlp's EJS "n challenge" solver only works with Deno 2.3.x-2.6.x.
// Nix's pinned deno package (2.2.x) is reported "unsupported" by yt-dlp, so
// we keep a known-good build in .bin/deno. This check runs once at server
// boot: if the binary is missing or the wrong version, it downloads a fresh
// copy on the fly. Falls back to the "node" JS runtime if that also fails.
function ensureDenoRuntime(): string | null {
  const DENO_VERSION = "2.9.4";
  const binDir = path.join(projectRoot, ".bin");
  const denoBin = path.join(binDir, "deno");

  const getVersion = (): string | null => {
    try {
      const out = execSync(`"${denoBin}" --version`, { encoding: "utf-8" });
      return out.split("\n")[0].split(" ")[1] ?? null;
    } catch {
      return null;
    }
  };

  if (fs.existsSync(denoBin) && getVersion() === DENO_VERSION) {
    return denoBin;
  }

  console.log(`[deno] Compatible Deno (${DENO_VERSION}) not found, downloading...`);
  try {
    fs.mkdirSync(binDir, { recursive: true });
    const url = `https://github.com/denoland/deno/releases/download/v${DENO_VERSION}/deno-x86_64-unknown-linux-gnu.zip`;
    execSync(`curl -fsSL -o "${binDir}/deno.zip" "${url}"`, { stdio: "inherit" });
    execSync(`unzip -o "${binDir}/deno.zip" -d "${binDir}"`, { stdio: "inherit" });
    fs.chmodSync(denoBin, 0o755);
    fs.unlinkSync(path.join(binDir, "deno.zip"));
    if (getVersion() === DENO_VERSION) {
      console.log(`[deno] Installed Deno ${DENO_VERSION} to ${denoBin}`);
      return denoBin;
    }
    console.warn("[deno] Download succeeded but version check failed; falling back to node runtime");
    return null;
  } catch (err: any) {
    console.warn(`[deno] Auto-install failed (${err.message}); falling back to node runtime for yt-dlp`);
    return null;
  }
}

const denoBinPath = ensureDenoRuntime();

async function startServer() {
  try {
    const app = express();
  const PORT = Number(process.env.PORT) || 5000;

  app.set('trust proxy', true);
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Repo URL used in error messages so the frontend / API consumers can point
  // users at the local-install instructions when a stem splitter isn't on PATH.
  const REPO_URL = "https://github.com/airiharuki/Harmonic-Studio-V2";

  // Detect which stem-splitter CLIs are actually installed on this host.
  // Used by the UI to grey out unavailable models and to fail /api/split honestly.
  const splitterCommands: Record<string, string> = {
    demucs: "demucs",
    spleeter: "spleeter",
    mdx: "audio-separator",
    "bs-roformer": "audio-separator",
  };
  async function detectSplitters(): Promise<Record<string, boolean>> {
    const entries = await Promise.all(
      Object.entries(splitterCommands).map(async ([model, bin]) => {
        try {
          await execAsync(`command -v ${bin}`);
          return [model, true] as const;
        } catch {
          return [model, false] as const;
        }
      })
    );
    return Object.fromEntries(entries);
  }

  app.get("/api/splitters", async (_req, res) => {
    try {
      const available = await detectSplitters();
      res.json({ available, repoUrl: REPO_URL });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
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

  // --- Secure file token store ---
  // Each processed file gets a 12-character alphanumeric token (mixed-case +
  // digits = 62 possibilities/char, ~3.2 sextillion combinations). That's
  // short enough to type or share as a code, while still being effectively
  // unbrute-forceable within the file's lifetime. Brute-force protection is
  // layered on top via the rate limiter on the retrieval endpoint below.
  // Files are auto-deleted 4 hours after creation.
  const FILE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
  const TOKEN_LENGTH = 12;
  const TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  interface FileToken {
    filepath: string;
    originalName: string;
    expiresAt: number;
  }
  const fileTokens = new Map<string, FileToken>();

  function generateToken(length: number = TOKEN_LENGTH): string {
    let token = "";
    for (let i = 0; i < length; i++) {
      token += TOKEN_ALPHABET[crypto.randomInt(0, TOKEN_ALPHABET.length)];
    }
    return token;
  }

  function createFileToken(filepath: string, originalName: string): string {
    let token = generateToken();
    // Vanishingly unlikely, but guard against a live collision anyway.
    while (fileTokens.has(token)) token = generateToken();
    fileTokens.set(token, { filepath, originalName, expiresAt: Date.now() + FILE_TTL_MS });
    return token;
  }

  // --- Rate limiting for token retrieval ---
  // Tokens are short enough that we cannot rely on entropy alone against a
  // scripted attacker, so we throttle lookups per-IP: a generous "typo
  // buffer" for legitimate users, a sliding-window cap against bursts, and a
  // temporary lockout after repeated wrong guesses.
  const RATE_WINDOW_MS = 60 * 1000; // 1 minute
  const RATE_MAX_PER_WINDOW = 30;
  const MAX_CONSECUTIVE_FAILS = 10;
  const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

  interface RateEntry {
    windowStart: number;
    count: number;
    consecutiveFails: number;
    lockedUntil: number;
  }
  const rateLimitStore = new Map<string, RateEntry>();

  function checkTokenRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    let entry = rateLimitStore.get(ip);
    if (!entry) {
      entry = { windowStart: now, count: 0, consecutiveFails: 0, lockedUntil: 0 };
      rateLimitStore.set(ip, entry);
    }

    if (entry.lockedUntil > now) {
      return { allowed: false, retryAfterMs: entry.lockedUntil - now };
    }

    if (now - entry.windowStart > RATE_WINDOW_MS) {
      entry.windowStart = now;
      entry.count = 0;
    }
    entry.count++;

    if (entry.count > RATE_MAX_PER_WINDOW) {
      return { allowed: false, retryAfterMs: entry.windowStart + RATE_WINDOW_MS - now };
    }

    return { allowed: true };
  }

  function recordTokenAttempt(ip: string, success: boolean) {
    const entry = rateLimitStore.get(ip);
    if (!entry) return;
    if (success) {
      entry.consecutiveFails = 0;
    } else {
      entry.consecutiveFails++;
      if (entry.consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
        entry.lockedUntil = Date.now() + LOCKOUT_MS;
      }
    }
  }

  // Periodically forget IPs that have been quiet for a while so this map
  // doesn't grow unbounded.
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart > RATE_WINDOW_MS && entry.lockedUntil < now) {
        rateLimitStore.delete(ip);
      }
    }
  }, 10 * 60 * 1000);

  function sweepExpiredFiles() {
    const now = Date.now();
    for (const [token, entry] of fileTokens.entries()) {
      if (now >= entry.expiresAt) {
        try {
          if (fs.existsSync(entry.filepath)) {
            const stat = fs.lstatSync(entry.filepath);
            if (stat.isDirectory()) {
              fs.rmSync(entry.filepath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(entry.filepath);
            }
            console.log(`[cleanup] Deleted expired file: ${entry.filepath}`);
          }
        } catch (err) {
          console.error(`[cleanup] Error deleting ${entry.filepath}:`, err);
        }
        fileTokens.delete(token);
      }
    }
  }

  // Sweep every 30 minutes
  setInterval(sweepExpiredFiles, 30 * 60 * 1000);

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
  const jsRuntime = denoBinPath ? `deno:${denoBinPath}` : 'node';

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
      jsRuntimes: jsRuntime,
      cookies: hasCookies ? cookiePath : undefined,
      addHeader: [
        'referer:https://www.youtube.com/',
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

      // 2. Download + normalize thumbnail.
      //    YouTube thumbnails sometimes come back as WebP, and even when they
      //    are JPEG they can be progressive / 4:4:4 / carry alpha. iOS Music
      //    silently drops cover art that isn't a baseline (non-progressive)
      //    yuv420p JPEG, so we re-encode through ffmpeg before embedding to
      //    guarantee one consistent, iOS-compatible cover format for both
      //    MP3 (ID3v2 APIC) and FLAC (METADATA_BLOCK_PICTURE).
      let thumbnailPath: string | null = null;
      if (metadata.thumbnail && (format === 'mp3' || format === 'flac')) {
        let rawThumbPath: string | null = null;
        try {
          const thumbResponse = await axios.get(metadata.thumbnail, { responseType: 'arraybuffer' });
          rawThumbPath = path.join(downloadsDir, `thumb_raw_${Date.now()}.bin`);
          fs.writeFileSync(rawThumbPath, thumbResponse.data);

          const jpgPath = path.join(downloadsDir, `thumb_${Date.now()}.jpg`);
          await new Promise<void>((resolve, reject) => {
            ffmpeg(rawThumbPath as string)
              .outputOptions('-frames:v', '1')        // single still image
              .outputOptions('-vf', 'format=yuv420p') // baseline, drop alpha
              .outputOptions('-q:v', '2')             // high quality JPEG
              .toFormat('mjpeg')
              .on('end', () => resolve())
              .on('error', reject)
              .save(jpgPath);
          });
          thumbnailPath = jpgPath;
        } catch (e) {
          console.warn("Failed to download/convert thumbnail:", e);
        } finally {
          if (rawThumbPath && fs.existsSync(rawThumbPath)) fs.unlinkSync(rawThumbPath);
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

        // Handle thumbnail embedding.
        // The thumbnail file on disk is already a baseline JPEG (see step 2),
        // so we can `-c:v copy` for both MP3 and FLAC and avoid any re-encode.
        // FLAC's METADATA_BLOCK_PICTURE accepts JPEG natively, which iOS Music
        // and CarPlay parse correctly (PNG covers are flakier on iOS).
        if (thumbnailPath && (format === 'mp3' || format === 'flac')) {
          command = command
            .input(thumbnailPath)
            .outputOptions('-map', '0:a', '-map', '1:0')
            .outputOptions('-c:v', 'copy')
            .outputOptions('-disposition:v', 'attached_pic');
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

      const token = createFileToken(filepath, filename);
      res.json({ filename, url: `/api/files/token/${token}`, expiresIn: FILE_TTL_MS, metadata });
    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/split", async (req, res) => {
    const { url, filename, stemsToZip, model, modelVariant, title } = req.body;
    if (!url && !filename) return res.status(400).json({ error: "URL or filename is required" });

    // --- SSE setup ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (type: string, payload: Record<string, any>) => {
      res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
    };
    const log = (line: string) => send("log", { line });

    const jobId = `job_${Date.now()}`;
    const jobDir = path.join(downloadsDir, jobId);
    fs.mkdirSync(jobDir);

    const inputFilename = "input.wav";
    const inputPath = path.join(jobDir, inputFilename);
    const tempFile = path.join(jobDir, `temp_input.m4a`);

    try {
      if (url) {
        log("Downloading audio from URL...");

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
              log(`Download connection reset — retrying (attempt ${attempts})...`);
              await new Promise(r => setTimeout(r, 2000));
              continue;
            }
            throw err;
          }
        }

        log("Download complete. Converting to WAV...");
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
        log("WAV conversion done.");
      } else if (filename) {
        const sourcePath = path.join(downloadsDir, filename);
        if (!fs.existsSync(sourcePath)) {
          send("error", { message: "Uploaded file not found" });
          res.end();
          return;
        }
        fs.copyFileSync(sourcePath, inputPath);
        log(`Using uploaded file: ${filename}`);
      }

      // 2. Run Splitting
      const outputDirForJob = path.join(outputDir, jobId);

      // Reusable helper — spawns a process and streams stdout/stderr as SSE log lines
      const runProcess = (bin: string, args: string[]) => new Promise<void>((resolve, reject) => {
        const proc = spawn(bin, args);
        const pipe = (data: Buffer) =>
          data.toString().split(/\r?\n/).forEach(l => { const t = l.trim(); if (t) log(t); });
        proc.stdout.on("data", pipe);
        proc.stderr.on("data", pipe);
        proc.on("close", code => code === 0 ? resolve() : reject(new Error(`${bin} exited with code ${code}`)));
        proc.on("error", reject);
      });

      // Backing Vocal Removal — 2-pass pipeline checkpoint config
      // Pass 1: isolate all vocals from the full mix (standard vocal model)
      // Pass 2: split isolated vocals into Lead vs Backing (karaoke fine-tuned checkpoint)
      const BVR_MODELS: Record<string, { pass1: string; pass2: string }> = {
        karaoke_bsr: {
          pass1: "model_bs_roformer_ep_317_sdr_12.9755.ckpt",
          pass2: "model_bs_roformer_karaoke_ep_937_sdr_10.5765.ckpt",
        },
        karaoke_mel: {
          pass1: "model_bs_roformer_ep_317_sdr_12.9755.ckpt",
          pass2: "mel_band_roformer_karaoke_by_becruily_ep_162_sdr_10.0772.ckpt",
        },
        bvr_mdx: {
          pass1: "UVR-MDX-NET-Inst_HQ_3.onnx",
          pass2: "UVR-BVE-BVR_MDX23C.onnx",
        },
      };
      const isBvrMode = Object.keys(BVR_MODELS).includes(modelVariant || "");

      let stemsPath: string;
      let zipAllFromStemsPath = false; // if true, archive zips the whole dir as-is

      if (isBvrMode) {
        // ── BVR 2-pass pipeline ───────────────────────────────────────────────
        const bvrCfg = BVR_MODELS[modelVariant!];
        const pass1Dir = path.join(outputDirForJob, "bvr_pass1");
        const pass2Dir = path.join(outputDirForJob, "bvr_pass2");
        fs.mkdirSync(pass1Dir, { recursive: true });
        fs.mkdirSync(pass2Dir, { recursive: true });

        const available = await detectSplitters();
        if (!available["bs-roformer"] && !available["mdx"]) {
          send("error", {
            message: `audio-separator is not installed on this server. BVR requires it for both passes. ` +
              `Run the project locally — see ${REPO_URL}.`,
            repoUrl: REPO_URL,
          });
          res.end(); return;
        }

        log("BVR — Pass 1: Isolating vocals from full mix...");
        await runProcess("audio-separator", [inputPath, "--model_filename", bvrCfg.pass1, "--output_dir", pass1Dir]);

        // audio-separator names output like "input_(Vocals)_model.ext" — find it
        const pass1Files = fs.readdirSync(pass1Dir);
        const vocalsFile = pass1Files.find(f => /vocal/i.test(f) && !/backing/i.test(f));
        if (!vocalsFile)
          throw new Error("BVR Pass 1 — vocals stem not found in output. " +
            "Ensure the model produces a file with 'vocal' in its name.");
        const vocalsPath = path.join(pass1Dir, vocalsFile);

        log("BVR — Pass 2: Splitting lead vs backing vocals...");
        await runProcess("audio-separator", [vocalsPath, "--model_filename", bvrCfg.pass2, "--output_dir", pass2Dir]);

        stemsPath = pass2Dir;
        zipAllFromStemsPath = true;
        log("BVR — Both passes complete. Packaging stems...");

      } else {
        // ── Standard single-pass separation ──────────────────────────────────
        let args: string[] = [];
        let bin = "demucs";
        const audioSepOutDir = path.join(outputDirForJob, "audio_sep_out");

        switch (model) {
          case "mdx":
            bin = "audio-separator";
            fs.mkdirSync(audioSepOutDir, { recursive: true });
            args = [inputPath, "--model_filename", "UVR-MDX-NET-Inst_HQ_3.onnx", "--output_dir", audioSepOutDir];
            break;
          case "bs-roformer":
            bin = "audio-separator";
            fs.mkdirSync(audioSepOutDir, { recursive: true });
            args = [inputPath, "--model_filename", "model_bs_roformer_ep_317_sdr_12.9755.ckpt", "--output_dir", audioSepOutDir];
            break;
          case "spleeter": {
            const spleeterConfig = (modelVariant && /^\d+stems$/.test(modelVariant)) ? modelVariant : "4stems";
            bin = "spleeter";
            args = ["separate", "-p", `spleeter:${spleeterConfig}`, "-o", outputDirForJob, inputPath];
            break;
          }
          case "demucs":
          default: {
            const demucsModel = (modelVariant && /^htdemucs/.test(modelVariant)) ? modelVariant : "htdemucs";
            bin = "demucs";
            args = ["-n", demucsModel, "-o", outputDirForJob, inputPath];
            break;
          }
        }

        const available = await detectSplitters();
        if (!available[model || "demucs"]) {
          try { fs.rmSync(jobDir, { recursive: true, force: true }); } catch {}
          send("error", {
            message: `Stem splitter "${model}" is not installed on this server. ` +
              `Run the project locally to use this feature — see ${REPO_URL} for install instructions.`,
            repoUrl: REPO_URL,
          });
          res.end();
          return;
        }

        log(`Starting ${(model || "demucs").toUpperCase()} stem separation...`);
        await runProcess(bin, args);
        log("Separation complete. Packaging stems...");

        const isAudioSep = (model === "mdx" || model === "bs-roformer");
        if (isAudioSep) {
          stemsPath = audioSepOutDir;
          zipAllFromStemsPath = true;
        } else if (model === "spleeter") {
          stemsPath = path.join(outputDirForJob, path.basename(inputFilename, path.extname(inputFilename)));
        } else {
          const demucsModel = (modelVariant && /^htdemucs/.test(modelVariant)) ? modelVariant : "htdemucs";
          stemsPath = path.join(outputDirForJob, demucsModel, path.basename(inputFilename, path.extname(inputFilename)));
        }
      }

      const safeTitle = title
        ? title.replace(/[^a-zA-Z0-9 \-_]/g, "").replace(/ +/g, "_").slice(0, 60)
        : jobId;
      const zipFilename = `${safeTitle}_stems.zip`;
      const zipPath = path.join(outputDir, zipFilename);
      const outputStream = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      await new Promise<void>((resolve, reject) => {
        outputStream.on("close", resolve);
        archive.on("error", reject);
        archive.pipe(outputStream);

        if (zipAllFromStemsPath) {
          // BVR 2-pass or audio-separator: output naming is model-defined — zip everything
          archive.directory(stemsPath, false);
        } else if (stemsToZip && Array.isArray(stemsToZip) && stemsToZip.length > 0) {
          for (const stem of stemsToZip) {
              // Spleeter 2stems uses "accompaniment" for what we call "other"
              const spleeterVariant = (modelVariant && /^\d+stems$/.test(modelVariant)) ? modelVariant : '4stems';
              const stemFilename = (model === 'spleeter' && spleeterVariant === '2stems' && stem === 'other')
                ? 'accompaniment.wav'
                : `${stem}.wav`;
              const fullStemPath = path.join(stemsPath, stemFilename);
              if (fs.existsSync(fullStemPath)) {
                archive.file(fullStemPath, { name: `${stem}.wav` });
              }
            }
        } else {
          archive.directory(stemsPath, false);
        }

        archive.finalize();
      });

      const token = createFileToken(zipPath, zipFilename);
      log("ZIP ready. Starting download...");
      send("done", { filename: zipFilename, url: `/api/files/token/${token}`, expiresIn: FILE_TTL_MS });
      res.end();

    } catch (error: any) {
      console.error("Split error:", error);
      send("error", { message: error.message });
      res.end();
    }
  });

  // Secure token-based file download — used for all processed outputs (downloads + stems zips).
  // Token is a 12-character alphanumeric code, valid for 4 hours. Lookups are
  // rate-limited per-IP since the code is short enough to type/share (see
  // checkTokenRateLimit / recordTokenAttempt above).
  app.get("/api/files/token/:token", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const rate = checkTokenRateLimit(ip);
    if (!rate.allowed) {
      res.setHeader("Retry-After", Math.ceil((rate.retryAfterMs || 0) / 1000));
      return res.status(429).json({ error: "Too many attempts. Please wait before trying again." });
    }

    const entry = fileTokens.get(req.params.token);
    if (!entry) {
      recordTokenAttempt(ip, false);
      return res.status(404).json({ error: "File not found or link has expired." });
    }
    if (Date.now() >= entry.expiresAt) {
      fileTokens.delete(req.params.token);
      recordTokenAttempt(ip, false);
      try {
        if (fs.existsSync(entry.filepath)) fs.unlinkSync(entry.filepath);
      } catch {}
      return res.status(410).json({ error: "This download link has expired (4-hour limit)." });
    }
    if (!fs.existsSync(entry.filepath)) {
      fileTokens.delete(req.params.token);
      recordTokenAttempt(ip, false);
      return res.status(404).json({ error: "File not found on server." });
    }

    recordTokenAttempt(ip, true);
    const ext = path.extname(entry.originalName).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".flac": "audio/flac",
      ".wav": "audio/wav",
      ".zip": "application/zip",
    };
    if (mimeMap[ext]) res.setHeader("Content-Type", mimeMap[ext]);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(entry.originalName)}"`);
    req.setTimeout(0);
    res.sendFile(entry.filepath, (err) => {
      if (err) {
        const e = err as any;
        if (e.code === "ECONNABORTED" || e.code === "EPIPE" || e.message?.includes("aborted")) {
          console.log(`[token] Download of ${entry.originalName} cancelled by client.`);
        } else {
          console.error(`[token] Error sending ${entry.originalName}:`, err);
          if (!res.headersSent) res.status(500).send("Error sending file.");
        }
      }
    });
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

  // ── Gemini chord generation (server-side — key never exposed to browser) ──
  app.post("/api/generate-chords", async (req, res) => {
    const { key, scale, mood, bpm } = req.body;
    if (!key || !scale) return res.status(400).json({ error: "key and scale are required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a music theory expert. Generate a 4-bar chord progression in the key of ${key} ${scale}. The mood is ${mood || "neutral"} and the BPM is ${bpm || 120}. Make the progression interesting, perhaps using some 7th chords, 9ths, or passing chords if it fits the mood.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: "A musical chord symbol (e.g., Cmaj7, Am9, Dm7, G7b9)",
            },
            description: "An array of exactly 4 chord strings representing a 4-bar progression.",
          },
        },
      });

      const text = response.text || "[]";
      const chords = JSON.parse(text);
      const finalChords: string[] = Array.isArray(chords) ? chords.slice(0, 4) : ["C", "Am", "F", "G"];
      while (finalChords.length < 4) finalChords.push(finalChords[finalChords.length - 1] || "C");

      res.json({ chords: finalChords });
    } catch (error: any) {
      console.error("[generate-chords]", error.message);
      res.status(500).json({ error: error.message });
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
