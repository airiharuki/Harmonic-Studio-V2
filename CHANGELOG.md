# Changelog

All notable changes to Harmonic Studio V2. Newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — beta only

*Nothing cooking yet.*

---

## [v2.1.7] — SoundCloud Streaming Player

### Added
- **SoundCloud streaming player**: paste a SoundCloud track link in the Analyzer and get the official artwork-forward player inline — streams directly, no download required. Metadata (title, artist, 500px artwork) resolved server-side via SoundCloud's oEmbed API with strict hostname validation.

---

## [v2.1.6] — Real Audio Verification & History Scrub

### Security
- **Content-based audio validation**: uploaded files are now probed with `ffprobe` after the extension/MIME check — a renamed `.exe` or random blob with a `.mp3` filename fails the stream check and is rejected before it can reach the stem splitter.
- **Git history purged**: `attached_assets/` (including a committed `cookies.txt`) was scrubbed from the full commit history on both branches using `git filter-repo` — the files are no longer recoverable from any past commit.
- **`attached_assets/` blocked from git**: `.gitignore` updated so session cookies, uploaded screenshots, and other workspace assets can never be accidentally committed again.

---

## [v2.1.5] — Disk Cleanup

### Added
- **Automatic upload sweep**: untracked files in `downloads/` and `output/` older than **4 hours** are deleted on a background timer. Uploads, job leftovers, and orphaned output files no longer accumulate indefinitely and fill the disk.
- Files that are still being actively processed are left alone — only untracked, stale files are swept.

---

## [v2.1.4] — YouTube Download Rate Limiting

### Security
- **`/api/download` rate limiting**: per-IP single active download, 30-second cooldown, global cap of 3 concurrent downloads. Returns 429 with `Retry-After` on excess. `endDlJob` is always called in a `try/finally` so the counter never leaks on error.
- **`/api/info` rate limiting**: 5 requests per 30-second window per IP. Throttles metadata-only probes that could be used to enumerate or abuse the endpoint.
- Both limiters mirror the existing `/api/split` pattern (`checkRateLimit / beginJob / endJob`) for consistency.

---

## [v2.1.3] — Security Test Coverage

### Added
- Extracted `safeJoin` path guard and stem whitelist into `server/security.ts` — shared module used by the server and the test suite.
- **Vitest unit tests** covering all traversal payloads: `../` escapes, encoded separators, null bytes, and symlinks pointing outside the base directory.
- **HTTP integration tests** against `/api/files/:filename`, `/api/files/output/:filename`, and `/api/split` — regression suite that fails if any path-traversal hole reopens.
- `npm test` and `npx tsc --noEmit` registered as named validation commands in `.replit` — run from the Security or Validations pane without touching the terminal.

---

## [v2.1.2] — Upload Hardening

### Added
- **Upload size cap**: requests over **300 MB** are rejected with a `413` before Multer reads the body — the file never touches disk.
- **Audio-only file filter**: uploads are checked against extension and MIME type; anything that isn't a recognised audio format gets a `400` with a plain-English error message. Renamed executables and mystery blobs no longer land in `downloads/`.

---

## [v2.1.1] — Security & Infrastructure

### Security
- Fixed path traversal vulnerability across all file-serving routes (`/api/files/:filename`, `/api/files/output/:filename`, `/api/split`) — user-controlled filenames are now validated by a `safeJoin` guard that blocks `../` escapes, null bytes, and symlinks pointing outside the downloads/output directories.
- Whitelisted stem names in the ZIP builder — the `stemsToZip` array is now validated against a fixed enum before any filesystem access, preventing arbitrary file inclusion in downloads.
- Upgraded vulnerable direct dependencies: **axios → 1.16**, **multer → 2.2**, **vite → 6.4.3**; applied `npm audit fix` for all transitive findings (26 high-severity advisories cleared).

### Added
- **Rate limiting on `/api/split`**: per-IP single active job, 60-second cooldown between jobs, global cap of 2 concurrent ML jobs. Returns 429 with `Retry-After` header when exceeded.
- **Post-merge setup script** (`scripts/post-merge.sh`) wired into `.replit` — runs `npm install` and `tsc --noEmit` automatically after every task merge.

### Fixed
- Docker port mismatch — `docker-compose.yml` now sets `PORT=3000` so the container actually binds to the mapped port (was silently unreachable before).
- Dockerfile now includes `curl`, `unzip`, `spleeter`, `audio-separator[cpu]`, and `yt-dlp` — previously missing, so stem splitting and downloads didn't work in the containerized deploy.
- `deploy_server.sh` now writes `PORT=3000` to `.env` on creation (and backfills existing `.env` files that were missing it).

---

## [v2.1.0] — "Prism" — Model Variants, Loop Studio, & Beta Layer

### Added
- **Model variant system**: each splitting engine now exposes its true capabilities via a per-model variant selector.
  - **Demucs**: `4-stem` (Vocals/Drums/Bass/Other) or `6-stem` (+ Guitar & Piano via `htdemucs_6s`).
  - **Spleeter**: `2-stem`, `4-stem`, or `5-stem` (+ Piano). Marked **legacy · fallback** — use Demucs first.
  - **MDX-Net**: `Inst HQ 3` (Vocals + Instrumental) or `BVR · MDX` (Lead/Backing split). Beta-gated.
  - **BS-Roformer**: `EP317 Vocals` (max SDR), `BVR · BS-RoFormer`, `BVR · MelBand`. Beta-gated.
- **Backing Vocal Removal (BVR)** — 2-pass pipeline: Pass 1 isolates all vocals (BS-RoFormer EP317), Pass 2 splits Lead vs Backing (karaoke fine-tuned checkpoint). Unlocked via beta mode.
- **Stem naming system**: 8 stem types (`vocals`, `drums`, `bass`, `guitar`, `piano`, `other`, `lead_vocal`, `backing_vocal`). Grid greys out unavailable stems per active variant automatically.
- **Loop Studio overhaul**:
  - Replaced Gemini loop generation with a local chord pack (128 real progressions from [ldrolez/free-midi-chords](https://github.com/ldrolez/free-midi-chords), MIT). No API call, works offline, instant.
  - Mood filter: Hopeful, Romantic, Dark, Triumphant, and more.
  - Tap Tempo (up to 8 taps averaged).
  - Semitone transpose — shift every chord up or down without regenerating.
  - Chord History — last 10 generated progressions saved locally, reload any in one click.
  - MIDI export — generates a correctly timed `.mid` file ready for your DAW.
  - Piano roll preview with scrolling playhead for generated loops.
  - Send-to-loop-studio from Vibe Studio (analysis → chord suggestion → loop).
- **Beta mode** — hidden experimental layer with three easter eggs (Konami code, click the title 7×, type `studio` anywhere). Unlocks beta-gated models, extended analysis metrics, and a lab-notes panel.
- **Beta mode backgrounds** (v2.1 "Prism"):
  - Dark: blue dot-matrix halftone — CRT quality, matches the violet/blue palette.
  - Light: pink sparkle gradient — warm rose palette to match.
  - Both served via Imgur (no binary assets committed).
- **Theme system**: all four states (non-beta light, non-beta dark, beta light, beta dark) now have distinct coordinated palettes — card tints, border colors, ring accents, active-pill gradients, and aurora overlay all derived from each background.
- **Deno 2.9.4** pinned binary for yt-dlp's n-challenge solver (YouTube throttling bypass) — auto-downloaded by the server on first run, bundled in all platform install scripts.
- Deno added to all platform install scripts: Homebrew on macOS, official installer on Linux (with PATH wiring to shell profiles), Winget on Windows.
- Windows installer now prompts GPU vs CPU choice for `audio-separator` at install time.

### Fixed
- YouTube bot check bypass via `tv_embedded` and `android` player clients.
- Loop playback stale closure + AudioContext reuse bug.
- Gemini API key moved server-side — was previously exposed in browser bundle.
- Beta banner cutting off content on mobile — shorter text + dynamic `pt-*` top padding.

### Changed
- Spleeter labeled **legacy · fallback** in the model selector with tooltip guidance.
- MDX-Net and BS-Roformer show **"Available soon"** outside beta mode — visually greyed, unclickable, with explanatory toast.

---

## [v2.0.0] — Holographic UI & Beta Foundation

### Added
- **Beta mode toggle** (flask icon, top-right) — reveals model tier labels, extended analysis metrics (`spectral_centroid`, `loudness`, `dissonance`, `tuning`), lab-notes panel, and experimental model access.
- **Holographic frosted glass aesthetic** — aurora breathing animation (dark mode), iridescent hairline card edges, VHS grain + scanlines overlay, deep backdrop blur. The app now looks like it was designed at 4am in the best possible way.
- **Secure file token system** — processed files served via 12-character alphanumeric tokens (4-hour expiry, per-IP rate limiting on retrieval). Download URLs are short enough to share but effectively unbrute-forceable within the file's lifetime.
- **Recent tracks** panel — quick access to previously downloaded/analyzed tracks.
- **MIDI preview** — upload any `.mid` for piano roll rendering and soundfont playback, including multi-track files.

### Fixed
- Removed `cookies.txt` from all git history (security: was committed earlier, now purged).

---

## [v1.x] — The Original

The original comp project. It calculated pitch shifts and had a Circle of Fifths that looked like it was made in 2003 by someone who'd never seen a circle. This is not that. This is better in every conceivable way.

*"Eight years on, and I'm still drifting in your orbit."* 💫
