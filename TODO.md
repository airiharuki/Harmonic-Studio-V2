# Harmonic Studio V2 — Project Tracking

## Current release: v2.1.7 (stable `main`)
## In progress: v2.2b1 "Reverie" (`beta`)

---

## ✅ Done (this cycle)

### Security & Hardening
- [x] Rate limiting on `/api/split` — per-IP cooldown, global job cap
- [x] Rate limiting on `/api/download` and `/api/info`
- [x] Path traversal fixed — `safeJoin` guard + symlink check + stem whitelist
- [x] Vitest regression tests for traversal payloads
- [x] Upload size cap (300 MB) + audio-only MIME/extension filter
- [x] `ffprobe` content validation — renamed non-audio files rejected
- [x] `attached_assets/` purged from git history, blocked in `.gitignore`
- [x] Dep upgrades: axios 1.16, multer 2.2, vite 6.4.3

### Infrastructure
- [x] Post-merge setup script (npm install + tsc check)
- [x] Docker stack fixed (PORT=3000, curl/unzip, spleeter/audio-separator/yt-dlp)
- [x] Deno added to all platform install scripts (macOS, Linux, Windows)
- [x] 4-hour disk sweep for stale uploads and output files

### Features (v2.1.x)
- [x] SoundCloud streaming player in Analyzer (oEmbed proxy, artwork-forward widget)
- [x] Model variant system (Demucs 4/6-stem, MDX-Net, BS-Roformer, BVR pipeline)
- [x] Local chord pack for Loop Studio (128 progressions, MIT, offline)
- [x] Tap tempo, semitone transpose, chord history, MIDI export, piano roll

### v2.2b1 "Reverie" (in progress)
- [x] WaveSurfer.js waveform player — click-to-seek, BPM gridlines, playhead
- [x] Live stem mixer — per-stem volume/solo/mute, bounce remix WAV export
- [ ] Instant BPM + key badges on track load (Task #18 — active)

### UI / Housekeeping
- [x] GitHub nav button in top-right bar
- [x] `~~Sponsored by Replit~~ (or maybe not)` in app footer + both READMEs
- [x] Spleeter labeled "legacy · fallback"
- [x] Four-state theme palette (non-beta light/dark, beta light/dark)
- [x] Removed stem preview mockups (replaced by full mixer)
- [x] CHANGELOG.md covering v1.x → v2.1.7

---

## 🔄 Active / queued tasks

| # | Title | Status |
|---|-------|--------|
| 18 | Instant BPM + key on track load | Active |
| 19 | Remix export matches song length, not longest tail | Queued |
| 20 | Mixer regression tests (solo/mute/bounce) | Queued |
| 10 | Confirm old uploaded files are deleted after 4 hours | Draft |

---

## 💡 v2.2b1 UI/UX ideas (discussed, not yet tasked)

- **Step-by-step split progress** — replace spinner with labeled steps (Download → Process → Split → Ready). Highest-impact UX fix.
- **Context-aware error messages** — "track too long", "region blocked", etc. instead of generic failures.
- **Cross-tab shortcuts** — "Open in Composer" from detected key; "Send to Loop Studio" from analysis.
- **Circle of Fifths auto-highlight** — animate CoF to detected key when Analyzer finishes.
- **Keyboard shortcuts on waveform** — Space play/pause, arrow keys seek.
- **Skeleton loading states** — styled placeholders while track info fetches.
- **Drag-and-drop visual** — glow ring + label on hover over upload zone.
- **Estimated split time** — "Demucs usually takes ~2 min for a 4-min track."
- **Auto-scroll to stems** — smooth scroll to results panel when split completes.
- **One-tap retry** — retry button on failed operations, no page reload.
- **Empty state onboarding** — suggested URL to try in the Analyzer landing state.

---

## 🗺 v2.2b2+ ideas (post-Reverie)

- Chromatic tuner (mic input, real-time pitch detection)
- Scale & mode explorer (root + mode → CoF highlight + chord functions)
- Batch splitting / playlist support
- Shareable analysis cards
- Session persistence (reload last track)
- Mobile-optimised piano roll
