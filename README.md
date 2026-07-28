<div align="center">

```
██╗  ██╗ █████╗ ██████╗ ███╗   ███╗ ██████╗ ███╗   ██╗██╗ ██████╗
██║  ██║██╔══██╗██╔══██╗████╗ ████║██╔═══██╗████╗  ██║██║██╔════╝
███████║███████║██████╔╝██╔████╔██║██║   ██║██╔██╗ ██║██║██║
██╔══██║██╔══██║██╔══██╗██║╚██╔╝██║██║   ██║██║╚██╗██║██║██║
██║  ██║██║  ██║██║  ██║██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║╚██████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝

 ░░░░░░░░░░░░░░░░░░░   S T U D I O   V 2   ░░░░░░░░░░░░░░░░░░░
          ⚗️  L A B S   B U I L D  —  B E T A  B R A N C H  ⚗️
```

</div>

> **You're on the `beta` branch.**
> This is not the stable app. This is the lab. The garage. The 3am prototype that actually works. The place where things get weird before they get good.
> If you want calm and collected, [main is right there](https://github.com/airiharuki/Harmonic-Studio-V2/tree/main). We'll be here making noise.

<div align="center">

[![Branch](https://img.shields.io/badge/branch-beta-8b5cf6?style=for-the-badge&logo=git&logoColor=white)](https://github.com/airiharuki/Harmonic-Studio-V2/tree/beta)
[![Status](https://img.shields.io/badge/status-experimental-f97316?style=for-the-badge)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-22c55e?style=for-the-badge&logo=github)](CONTRIBUTING.md)
[![License](https://img.shields.io/badge/license-MIT-3b82f6?style=for-the-badge)](LICENSE)
[![Vibes](https://img.shields.io/badge/vibes-dangerously%20immaculate-ec4899?style=for-the-badge)]()
[![Dragons](https://img.shields.io/badge/here%20be-dragons-dc2626?style=for-the-badge)]()

</div>

---

## 🚀 Try It Live (Stable Build)

**👉 [harmonic-studio-v-2--aiharu.replit.app](https://harmonic-studio-v-2--aiharu.replit.app)**

The live site runs `main`. But here's the thing — the beta features are in there too. Hidden. Waiting. There are at least three ways to unlock them and we're not going to tell you what they are. Consider it a scavenger hunt for people who read READMEs.

---

## 🧪 What's Different in Labs

`beta` is where features get stress-tested before they're trusted with real humans. Right now, it's shipping with things `main` doesn't have yet:

### ⚗️ Beta Mode — The Hidden Layer

Somewhere in the app there's a toggle. Find it (or discover one of the secret ways to activate it) and a whole second layer of the app unfolds:

- **🏷️ Model Tiers** — The stem splitter stops pretending all models are equal. Each one gets an honest label: `✓ stable` means it's been through the fire and came out fine. `⚗ experimental` means it's trying its best and we're rooting for it.
- **📊 Extended Raw Analysis** — The Analyzer now surfaces metrics the standard view doesn't show: danceability %, key strength %, loudness in dBFS (real RMS from audio samples), and BPM to one decimal place. For when "it sounds around 128" isn't good enough.
- **🗒️ Beta Lab Notes** — A collapsible card at the bottom of the Analyzer tab. Plain-English explanations of every experimental feature. What it is, what it does, what might still go sideways. Documentation as a love language.
- **📣 Beta Banner** — A sleek violet announcement strip at the top so you always know you're in experiment mode. Has a `✕` dismiss button because we're not animals.

### 🌌 Holographic Aesthetic — The Visual Upgrade

The CSS on this branch has been significantly revised. Light touches that add up to something that feels unmistakably different:

| Feature | What it does |
|---|---|
| **Aurora Background** | A slow-breathing `radial-gradient` (violet/cyan/rose) behind all content in dark mode. 14s animation cycle. `filter: blur(30px)`. It breathes. |
| **Iridescent Card Edges** | Every `.theme-card` gets a 1px gradient hairline — cyan → violet → rose — across its top edge via `::before`. You'll notice it without knowing why. |
| **Deeper Glass Blur** | Cards blur at `80px` now (up from default). You're not looking at UI, you're looking *through* it. |
| **Y2K Scanlines** | A repeating 2px scanline texture on every card in dark mode at ~1.2% opacity. Nostalgia, tastefully encoded into CSS. |
| **Holographic Tab Pill** | The active tab in dark mode glows with a translucent cyan/violet/rose gradient. Main gets a normal highlight. You get this. |
| **Heading Glow** | `h1` and `h2` in dark mode have a soft violet/cyan `text-shadow`. Barely there. Completely intentional. |
| **Lavender Light Mode** | Background shifted from pure white to `oklch(0.99 0.004 280)`. A barely-there lavender tint. Your brain registers it as *premium* without knowing why. |
| **VHS Grain** | Tightened to 2px scan pitch with a slight RGB chromatic split enhancement. Still aggressive. Still art. No notes. |

---

## 🔬 The Feature Pipeline

This is how ideas move from "someone thought of this at 3am" to "a real person is using it":

```
                                                        
  💡 Idea          ⚗️ Beta Branch       🚀 Main          
  ─────────   →    ──────────────   →   ──────────      
  Open issue       PR merged here       Promoted         
  Discuss it       Live & testing       after testing    
  Plan it          You're here →        Powers the       
                                        live site        
                                                        
```

**If your code lands in `beta`, it's already running live.** That's not a waiting room — that's a deployment. One more lap and it hits the live site for everyone.

> Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full breakdown. The PR section has a thing or two to say about what landing in `beta` actually means for you.

---

## ✨ Full Feature Breakdown

### 🎹 Vibe Composer

The pitch tools. The reason this whole thing started.

- 🎯 **Pitch Shift Calculator** — Pick your current key/scale and your target. Get the exact semitones: "+7 means pitch up 7 in your DAW, you're done, go make music." No crying. No math.
- ⭕ **Interactive Circle of Fifths** — Completely redesigned with a beautiful horizontal layout, inner/outer rings for relative minor/major keys, and a harmonic relationship guide built in. Supports both **Musical** and **Camelot** modes. Clicking a key syncs the whole app. Your music teacher would be jealous. We'd let them be.
- 🔗 **Cross-tab Sync** — The key you set in the Composer talks to the Loop Studio talks to the Analyzer. Everything is in sync. The app knows what you're doing.

### 🧠 Music Analyzer

Drop a link or a file. Get the audio. Get the data. It's fast and it doesn't need a PhD to operate.

- 📥 **Universal Downloader (`yt-dlp`)** — Pulls audio from 1,000+ sites. YouTube, SoundCloud, Bandcamp, TikTok, Twitch, Mixcloud, Twitter/X — if it streams, we eat it. Files are auto-named to the actual track title because `video_1080p_final_v3_REAL.mp3` is not a personality.
- 🎧 **In-Browser Preview** — Hidden iframe player for downloaded tracks. Doesn't clutter the UI. Just works.
- 🧠 **Essentia.js Analysis** — BPM, Key, Scale, Energy, Mood — extracted with actual DSP math. A tiny, very pedantic music major now lives in your browser tab. They don't ask to be followed on SoundCloud.
- 🎙️ **Stem Splitting (4 Models)** — Pull tracks apart into Vocals, Drums, Bass, and Other:
  - **Demucs** `✓ stable` — The reliable one. Proven. Ships.
  - **MDX-Net** `⚗ experimental` — Faster, different tradeoffs.
  - **Spleeter** `⚗ experimental` — Rapid prototype energy. Works. Mostly.
  - **BS-Roformer** `⚗ experimental` — The ambitious one. High ceiling.
  - Outputs as a ZIP named after the song. All four stems or just Vocals/Instrumental — your call.
- ✨ **Vibe Studio (AI Chords)** — After analysis, feed the track's vibe into Gemini's brain. It writes you a 4-bar chord progression. You didn't play a single note and yet here you are, a composer.

> 🚨 **WAV or FLAC only** for the analyzer and splitter. MP3s are lossy and the models make faces. You've been warned, kindly.

### 🔁 Loop Studio

Build custom chord progressions and actually hear them. No DAW. No subscription. No upsell. No monthly fee email.

- 🤖 **AI Progression Generator** — 4–16 bars, any key, any scale. Powered by Gemini. Doesn't take requests for "something that slaps" but gives it a real shot anyway.
- ⏱️ **Full Parameter Control** — Custom BPM (30–300) and time signature. Yes, 7/8 is supported. We respect that about you.
- 🔊 **SoundFont Playback** — Hear your progression with a high-quality electric piano instantly. No more staring at chord names wondering if they sound right. They do.
- 🎹 **MIDI Preview + Piano Roll** — Upload a `.mid` file. See it rendered in a piano roll editor. Hear it played back with the soundfont. Supports multi-track MIDI. Yes, all of them.
- 📝 **Lyrics Display** — Synchronized lyrics pulled from `public/lyrics.txt`. Update the file, update the display.

**New in Labs 🧪**

- 🥁 **Tap Tempo** — a TAP button lives next to the BPM field. Hit it to the beat — up to 8 taps averaged — and the BPM field updates live. The button flashes orange while you're tapping, resets after 2 seconds of silence. No more guessing 128 vs 130.
- 🎚️ **Semitone Transpose** — generated a killer progression but it's in the wrong key? `−1 st` / `+1 st` buttons above the chord cards shift every chord and update the key selector in one click. No regeneration, no lost work. Stack transpositions freely.
- 📜 **Chord History** — every progression you generate gets saved automatically to localStorage (keeps the last 10). A **History** button appears above the chord cards once you have entries. Click any saved progression to reload it — chords, key, scale, and BPM all restore. Session-persistent. Close the tab, come back, it's still there.
- ⚡ **Send to Loop Studio** — in the Analyzer's Vibe Studio tab, after analysis, an **→ Loop Studio** button copies the detected key, scale, and BPM across to the Loop Studio and switches tabs in one click. Detected a track in F# Minor at 95 BPM? You're in Loop Studio ready to generate in 2 seconds flat.

---

## 🤝 Contributing to Labs

> **Full guide → [CONTRIBUTING.md](CONTRIBUTING.md)**
> It's thorough, it's warm, and the PR section specifically explains what it means for your code to land here.

The short version:

```bash
# 1. Fork the repo
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Harmonic-Studio-V2.git
cd Harmonic-Studio-V2

# 3. Create a branch off beta
git checkout beta
git checkout -b feat/your-cool-thing

# 4. Build something
# 5. Commit with Conventional Commits
git commit -m "feat: add your cool thing"

# 6. Open a PR → targeting beta, not main
```

### What we'd love to see in Labs specifically

These are things that would fit right here in `beta` before graduating to `main`:

| Area | Idea |
|---|---|
| 🎵 **AI Models** | New stem separation models, GPU acceleration toggles, quality presets |
| 🧠 **Analysis** | More Essentia metrics, genre detection, key confidence visualisation |
| 🎨 **Aesthetics** | New themes, animation variants, additional holographic effects |
| ⌨️ **Power UX** | Keyboard shortcuts, drag-and-drop, batch processing |
| 💾 **Persistence** | Save/load progressions, analysis history, preset banks |
| 📱 **Mobile** | Touch gestures, responsive improvements, PWA support |
| 🧪 **Tests** | Any tests at all, honestly. We will throw a party. |
| ✨ **Wildcards** | Cassette tape filter. Spectral visualiser. Whatever you think is cool. We mean it. |

### The vibe here

This branch moves fast and forgives things. If you have a half-baked idea that might be something, `beta` is the right place to try it. We'd rather see the experiment fail here than never exist at all.

We use [Conventional Commits](https://www.conventionalcommits.org/) — check [CONTRIBUTING.md](CONTRIBUTING.md) for the cheat sheet. It's one habit that makes the git log readable for everyone who comes after.

---

## 🛠️ Running Labs Locally

```bash
git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
cd Harmonic-Studio-V2
git checkout beta

# Node deps
npm install

# Python AI models
pip3 install -U demucs spleeter "audio-separator[cpu]" yt-dlp

# Run it
npm run dev
```

**Requirements:** Node.js v20+, Python 3.11 (not 3.12, not 2.7, please), FFmpeg.

For the fully automated install with scripts for Windows/macOS/Linux, the [main README](https://github.com/airiharuki/Harmonic-Studio-V2/tree/main#installation--setup-%EF%B8%8F) has you covered. Those scripts handle everything including the AI models. Go make a coffee.

> **GPU acceleration (Windows + NVIDIA):** Swap `"audio-separator[cpu]"` → `"audio-separator[gpu]"` for CUDA support. The models will go significantly faster. Your GPU will feel appreciated.

---

## 🛠️ Stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Vite + React + TypeScript | Living on the edge, touching grass never |
| Styling | Tailwind CSS v4 + custom CSS | Utility classes go brrrr. Zero regrets. |
| AI Chords | Google Gemini API | Smarter than us. We've made peace with that. |
| Audio Analysis | Essentia.js | Does not judge your music taste. Unlike us. |
| Soundfont | sf2-synth-audio-worklet + Tonal | Accurate enough to be almost annoying |
| Audio Pipeline | Python + yt-dlp + FFmpeg | The heavy lifting department |
| Stem Splitting | Demucs, MDX-Net, Spleeter, BS-Roformer | Four engines, four personalities |
| Texture | VHS Grain Overlay | 1995 called. We invited it in. It stayed. |

---

## 📋 Lab Log

A rough record of what's been brewing in here:

- `feat` **Holographic aesthetic overhaul** — aurora layer, iridescent edges, deeper glass, scanlines, heading glow, lavender light mode
- `feat` **Beta mode system** — flask toggle, violet banner, model tier labels, extended analysis panel, lab notes card
- `feat` **Multiple secret unlock methods** — we put easter eggs in the live app. There are three of them. Happy hunting.
- `feat` **BS-Roformer model** — the ambitious fourth stem splitter joins the roster
- `feat` **ZIP named after the song** — stems download with a real name instead of a timestamp crime
- `fix` **cookies.txt purged from all git history** — it happened, it's handled, it's gone

---

## ⚠️ Labs Disclaimer

Things on this branch might:
- Work perfectly `(likely)`
- Work *mostly* perfectly `(also likely)`
- Behave in a way that makes you say "huh, interesting" `(possible)`
- Crash in a creative and educational way `(rare, but this is the lab)`

That's the deal. You're early. You're brave. If something breaks, open an issue — detailed reports with steps to reproduce are the best gift you can give us. If something is genuinely amazing, open a PR. If something made you feel something, drop a ⭐ on the main repo and we'll feel it right back.

---

## 📝 License

MIT. Fork it, remix it, build an empire on it. Just don't sue us if your track doesn't blow up. That's the algorithm's problem, not ours.

---

## 🙏 Credits

Made by someone who got tired of manually calculating pitch shifts at 4am, then got completely carried away. Built on vibes, coffee, and the stubbornly held belief that music tools should be beautiful, fast, and actually work.

---

<div align="center">

*You're on* `beta`*. That means you're part of the process before the process is finished.*
*That's a specific kind of cool that most people never get to be.*

**Made with ❤️, ☕, and increasingly experimental CSS**

</div>
