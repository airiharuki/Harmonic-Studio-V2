# Changelog

All notable changes to Harmonic Studio V2. Newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---


## [Unreleased] — v2.2b2 "Reverie" (in progress)
## [Unreleased] — v2.2b2 "Reverie" (in progress)
### Added
- **Beta mode toggle** (flask icon, top-right) — reveals model tier labels, extended analysis metrics (`spectral_centroid`, `loudness`, `dissonance`, `tuning`), lab-notes panel, and experimental model access.
- **Holographic frosted glass aesthetic** — aurora breathing animation (dark mode), iridescent hairline card edges, VHS grain + scanlines overlay, deep backdrop blur. The app now looks like it was designed at 4am in the best possible way.
- **Secure file token system** — processed files served via 12-character alphanumeric tokens (4-hour expiry, per-IP rate limiting on retrieval). Download URLs are short enough to share but effectively unbrute-forceable within the file's lifetime.
- **Recent tracks** panel — quick access to previously downloaded/analyzed tracks.
- **MIDI preview** — upload any `.mid` for piano roll rendering and soundfont playback, including multi-track files.

## [v2.2b1] — "Reverie"

### Added
- **Beta mode toggle** (flask icon, top-right) — reveals model tier labels, extended analysis metrics (`spectral_centroid`, `loudness`, `dissonance`, `tuning`), lab-notes panel, and experimental model access.
- **Holographic frosted glass aesthetic** — aurora breathing animation (dark mode), iridescent hairline card edges, VHS grain + scanlines overlay, deep backdrop blur. The app now looks like it was designed at 4am in the best possible way.
- **Secure file token system** — processed files served via 12-character alphanumeric tokens (4-hour expiry, per-IP rate limiting on retrieval). Download URLs are short enough to share but effectively unbrute-forceable within the file's lifetime.
- **Recent tracks** panel — quick access to previously downloaded/analyzed tracks.
- **MIDI preview** — upload any `.mid` for piano roll rendering and soundfont playback, including multi-track files.

### Fixed
- Removed `cookies.txt` from all git history (security: was committed earlier, now purged).

---

## [v2.1.7] — SoundCloud Streaming Player

### Added
- **Beta mode toggle** (flask icon, top-right) — reveals model tier labels, extended analysis metrics (`spectral_centroid`, `loudness`, `dissonance`, `tuning`), lab-notes panel, and experimental model access.
- **Holographic frosted glass aesthetic** — aurora breathing animation (dark mode), iridescent hairline card edges, VHS grain + scanlines overlay, deep backdrop blur. The app now looks like it was designed at 4am in the best possible way.
- **Secure file token system** — processed files served via 12-character alphanumeric tokens (4-hour expiry, per-IP rate limiting on retrieval). Download URLs are short enough to share but effectively unbrute-forceable within the file's lifetime.
- **Recent tracks** panel — quick access to previously downloaded/analyzed tracks.
- **MIDI preview** — upload any `.mid` for piano roll rendering and soundfont playback, including multi-track files.

## [v2.1.6] — Real Audio Verification & History Scrub

### Security
- Fixed path traversal vulnerability across all file-serving routes (`/api/files/:filename`, `/api/files/output/:filename`, `/api/split`) — user-controlled filenames are now validated by a `safeJoin` guard that blocks `../` escapes, null bytes, and symlinks pointing outside the downloads/output directories.
- Whitelisted stem names in the ZIP builder — the `stemsToZip` array is now validated against a fixed enum before any filesystem access, preventing arbitrary file inclusion in downloads.
- Upgraded vulnerable direct dependencies: **axios → 1.16**, **multer → 2.2**, **vite → 6.4.3**; applied `npm audit fix` for all transitive findings (26 high-severity advisories cleared).

## [v2.1.5] — Disk Cleanup

### Added
- **Beta mode toggle** (flask icon, top-right) — reveals model tier labels, extended analysis metrics (`spectral_centroid`, `loudness`, `dissonance`, `tuning`), lab-notes panel, and experimental model access.
- **Holographic frosted glass aesthetic** — aurora breathing animation (dark mode), iridescent hairline card edges, VHS grain + scanlines overlay, deep backdrop blur. The app now looks like it was designed at 4am in the best possible way.
- **Secure file token system** — processed files served via 12-character alphanumeric tokens (4-hour expiry, per-IP rate limiting on retrieval). Download URLs are short enough to share but effectively unbrute-forceable within the file's lifetime.
- **Recent tracks** panel — quick access to previously downloaded/analyzed tracks.
- **MIDI preview** — upload any `.mid` for piano roll rendering and soundfont playback, including multi-track files.

## [v2.1.4] — YouTube Download Rate Limiting

### Security
- Fixed path traversal vulnerability across all file-serving routes (`/api/files/:filename`, `/api/files/output/:filename`, `/api/split`) — user-controlled filenames are now validated by a `safeJoin` guard that blocks `../` escapes, null bytes, and symlinks pointing outside the downloads/output directories.
- Whitelisted stem names in the ZIP builder — the `stemsToZip` array is now validated against a fixed enum before any filesystem access, preventing arbitrary file inclusion in downloads.
- Upgraded vulnerable direct dependencies: **axios → 1.16**, **multer → 2.2**, **vite → 6.4.3**; applied `npm audit fix` for all transitive findings (26 high-severity advisories cleared).

## [v2.1.3] — Security Test Coverage

### Added
- **Beta mode toggle** (flask icon, top-right) — reveals model tier labels, extended analysis metrics (`spectral_centroid`, `loudness`, `dissonance`, `tuning`), lab-notes panel, and experimental model access.
- **Holographic frosted glass aesthetic** — aurora breathing animation (dark mode), iridescent hairline card edges, VHS grain + scanlines overlay, deep backdrop blur. The app now looks like it was designed at 4am in the best possible way.
- **Secure file token system** — processed files served via 12-character alphanumeric tokens (4-hour expiry, per-IP rate limiting on retrieval). Download URLs are short enough to share but effectively unbrute-forceable within the file's lifetime.
- **Recent tracks** panel — quick access to previously downloaded/analyzed tracks.
- **MIDI preview** — upload any `.mid` for piano roll rendering and soundfont playback, including multi-track files.

## [v2.1.2] — Upload Hardening

### Added
- **Beta mode toggle** (flask icon, top-right) — reveals model tier labels, extended analysis metrics (`spectral_centroid`, `loudness`, `dissonance`, `tuning`), lab-notes panel, and experimental model access.
- **Holographic frosted glass aesthetic** — aurora breathing animation (dark mode), iridescent hairline card edges, VHS grain + scanlines overlay, deep backdrop blur. The app now looks like it was designed at 4am in the best possible way.
- **Secure file token system** — processed files served via 12-character alphanumeric tokens (4-hour expiry, per-IP rate limiting on retrieval). Download URLs are short enough to share but effectively unbrute-forceable within the file's lifetime.
- **Recent tracks** panel — quick access to previously downloaded/analyzed tracks.
- **MIDI preview** — upload any `.mid` for piano roll rendering and soundfont playback, including multi-track files.

## [v2.1.1] — Security & Infrastructure

### Security
- Fixed path traversal vulnerability across all file-serving routes (`/api/files/:filename`, `/api/files/output/:filename`, `/api/split`) — user-controlled filenames are now validated by a `safeJoin` guard that blocks `../` escapes, null bytes, and symlinks pointing outside the downloads/output directories.
- Whitelisted stem names in the ZIP builder — the `stemsToZip` array is now validated against a fixed enum before any filesystem access, preventing arbitrary file inclusion in downloads.
- Upgraded vulnerable direct dependencies: **axios → 1.16**, **multer → 2.2**, **vite → 6.4.3**; applied `npm audit fix` for all transitive findings (26 high-severity advisories cleared).

### Added
- **Beta mode toggle** (flask icon, top-right) — reveals model tier labels, extended analysis metrics (`spectral_centroid`, `loudness`, `dissonance`, `tuning`), lab-notes panel, and experimental model access.
- **Holographic frosted glass aesthetic** — aurora breathing animation (dark mode), iridescent hairline card edges, VHS grain + scanlines overlay, deep backdrop blur. The app now looks like it was designed at 4am in the best possible way.
- **Secure file token system** — processed files served via 12-character alphanumeric tokens (4-hour expiry, per-IP rate limiting on retrieval). Download URLs are short enough to share but effectively unbrute-forceable within the file's lifetime.
- **Recent tracks** panel — quick access to previously downloaded/analyzed tracks.
- **MIDI preview** — upload any `.mid` for piano roll rendering and soundfont playback, including multi-track files.

### Fixed
- Removed `cookies.txt` from all git history (security: was committed earlier, now purged).

---

## [v2.1.0] — "Prism" — Model Variants, Loop Studio, & Beta Layer

### Added
- **Beta mode toggle** (flask icon, top-right) — reveals model tier labels, extended analysis metrics (`spectral_centroid`, `loudness`, `dissonance`, `tuning`), lab-notes panel, and experimental model access.
- **Holographic frosted glass aesthetic** — aurora breathing animation (dark mode), iridescent hairline card edges, VHS grain + scanlines overlay, deep backdrop blur. The app now looks like it was designed at 4am in the best possible way.
- **Secure file token system** — processed files served via 12-character alphanumeric tokens (4-hour expiry, per-IP rate limiting on retrieval). Download URLs are short enough to share but effectively unbrute-forceable within the file's lifetime.
- **Recent tracks** panel — quick access to previously downloaded/analyzed tracks.
- **MIDI preview** — upload any `.mid` for piano roll rendering and soundfont playback, including multi-track files.

### Fixed
- Removed `cookies.txt` from all git history (security: was committed earlier, now purged).

---

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

## [Unreleased] — v2.2b2 "Reverie" (in progress)
