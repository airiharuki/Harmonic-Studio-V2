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

## Deployment
Configured for Autoscale:
- Build: `npm run build`
- Run: `npm start` (sets `NODE_ENV=production` and runs `tsx server.ts`)
The production server serves the built static assets from `dist/`.
