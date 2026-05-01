# VibeCoded Music Lab

## Overview
A React + Vite frontend with an Express (TypeScript) backend, providing music tools including a Vibe Composer (pitch shift / circle of fifths), Loop Studio, and Analyzer. The Express server uses Vite middleware in development to serve the SPA, and serves the built `dist/` directory in production.

## Tech Stack
- Runtime: Node.js 20
- Frontend: React 19, Vite 6, Tailwind CSS 4, Base UI, Lucide
- Backend: Express 4 (TypeScript via tsx), youtube-dl-exec, fluent-ffmpeg, multer, archiver
- AI/Audio: @google/genai, essentia.js, @tonejs/midi, tonal

## Project Structure
- `server.ts` — Express server (also mounts Vite middleware in dev)
- `vite.config.ts` — Vite config (host `0.0.0.0`, allowedHosts `true`)
- `index.html`, `src/` — React app entry + components
- `components/`, `lib/` — Shared UI + utilities
- `public/` — Static assets (soundfont, lyrics)

## Replit Setup
- Single workflow `Start application` runs `YOUTUBE_DL_SKIP_PYTHON_CHECK=1 npm run dev` and listens on port 5000 (webview).
- Server binds to `0.0.0.0:5000` and Vite middleware allows all hosts so the Replit iframe proxy works.
- `YOUTUBE_DL_SKIP_PYTHON_CHECK=1` is required because the Replit container does not ship the `python` binary that `youtube-dl-exec`'s preinstall script expects.

## Environment Variables
See `.env.example`:
- `GEMINI_API_KEY` — for Google Gemini features (optional for basic tools)
- `APP_URL` — self-referential URL (optional)

## Audio Cover Art Pipeline (`/api/download`)
The download endpoint embeds the YouTube thumbnail as cover art for both MP3 and FLAC. To stay compatible with iOS Music / CarPlay (which silently drops non-baseline JPEG, alpha-channel, or PNG covers in FLAC), the thumbnail is normalized **before** ffmpeg embeds it:

1. The raw thumbnail is downloaded from `info.thumbnail` (often WebP, sometimes progressive JPEG).
2. ffmpeg re-encodes it to a single-frame baseline JPEG via:
   `-frames:v 1 -vf format=yuv420p -q:v 2 -f mjpeg`
3. The cleaned JPEG is then embedded with `-c:v copy -disposition:v attached_pic` for both MP3 (ID3v2 APIC) and FLAC (METADATA_BLOCK_PICTURE).
4. All temp files (raw thumbnail + intermediate audio) are deleted on success and on error.

Verifying a result locally:
```bash
ffprobe -v error -show_format -show_streams output.flac
# Expect: codec_name=mjpeg, pix_fmt=yuvj420p, DISPOSITION:attached_pic=1
#         TAG:title=..., TAG:artist=...
```

## Secure File Tokens & Auto-Delete
All processed output files (downloaded audio + stems ZIPs) are served via a one-time-use token URL, not a guessable filename path.

- **Token**: `crypto.randomBytes(32).toString('hex')` — 64 hex chars, unguessable.
- **TTL**: 4 hours from the moment the file is ready. Stored in an in-memory `Map<token, { filepath, originalName, expiresAt }>`.
- **Endpoint**: `GET /api/files/token/:token` — validates token, checks expiry, serves file with correct MIME type and `Content-Disposition`.
- **Sweep**: A `setInterval` runs every 30 minutes, deletes any file whose `expiresAt` has passed, and removes its entry from the map.
- **On-access expiry**: If an expired token is hit, the file is deleted on the spot and a `410 Gone` is returned.
- The old `/api/files/:filename` and `/api/files/output/:filename` routes remain for uploaded file preview (audio player in Loop Studio), but processed outputs never use those paths.

## Stem Splitter (Demucs)
- **Demucs 4.0.1** is installed and runs on CPU (torch 2.11.0+cpu + torchaudio 2.11.0+cpu).
- Binary: `/home/runner/workspace/.pythonlibs/bin/demucs`, in Node's PATH.
- `GET /api/splitters` detects available binaries via `command -v`; the UI greys out unavailable models with a "Local install" label.
- First split downloads ~200MB HTDemucs model weights (cached after first run).
- MDX-Net, BS-Roformer, Spleeter require ONNX/TensorFlow runtimes not available on hosted Replit.

## Deployment
Configured for Autoscale:
- Build: `npm run build`
- Run: `npm start` (sets `NODE_ENV=production` and runs `tsx server.ts`)
The production server serves the built static assets from `dist/`.
