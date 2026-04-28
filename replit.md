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

## Deployment
Configured for Autoscale:
- Build: `npm run build`
- Run: `npm start` (sets `NODE_ENV=production` and runs `tsx server.ts`)
The production server serves the built static assets from `dist/`.
