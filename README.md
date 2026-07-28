# ⚗️ Harmonic Studio V2 — LABS BUILD

> **You're on the `beta` branch.** This is not the stable app. This is the lab. The garage. The place where we try things that *probably* work and find out together. If you want the calm, collected, production version, [main is over there](https://github.com/airiharuki/Harmonic-Studio-V2/tree/main). No judgment. Cowards welcome.

[![Branch](https://img.shields.io/badge/branch-beta-violet?style=flat-square)](https://github.com/airiharuki/Harmonic-Studio-V2/tree/beta)
[![Status](https://img.shields.io/badge/status-experimental-orange?style=flat-square)]()
[![Vibes](https://img.shields.io/badge/vibes-dangerously%20immaculate-ff69b4?style=flat-square)]()
[![Dragons](https://img.shields.io/badge/here%20be-dragons-red?style=flat-square)]()

---

## 🚀 Try the Live App (Stable)

**👉 [harmonic-studio-v-2--aiharu.replit.app](https://harmonic-studio-v-2--aiharu.replit.app)**

The live app runs `main`. To get the beta features there, you'll need to find the unlock. We're not telling you. That's the point.

---

## 🧪 What's Different in Labs

This branch is where features get stress-tested before they're trusted with real people. Right now, `beta` is running with:

### ⚗️ Beta Mode
A secret experimental layer hidden inside the app. When you flip it on:
- **Model tiers** surface on the stem splitter — you'll see which models are battle-tested (✓ stable) and which are still in the "we believe in you, buddy" phase (⚗ experimental).
- **Extended Raw Analysis** — the Analyzer gives you more: danceability %, key strength %, loudness in dBFS, BPM to one decimal place. For when "it slaps" isn't a precise enough metric.
- **Beta Lab Notes** — a collapsible panel at the bottom of the Analyzer tab that explains every experimental feature in plain English, because documentation is a form of love.
- **Animated beta banner** — because you should know when you're in the lab. No surprises. Well, fewer surprises.

### 🌌 Holographic Aesthetic
The visual layer got an upgrade that `main` hasn't received yet:
- **Aurora background** — a slow-breathing iridescent glow lives behind everything in dark mode. It's subtle. It's violet. It's *alive*.
- **Iridescent card edges** — every glass panel has a 1px gradient hairline (cyan → violet → rose) across the top. It's the kind of detail you notice without knowing why you notice it.
- **Deeper glass blur** — cards blur at 80px now. You're not looking at UI, you're looking through it.
- **Y2K scanlines** — a 2px scanline texture rides on top of every card in dark mode at just barely-visible opacity. It's nostalgia encoded into CSS. We did that.
- **Holographic active tab pill** — the selected tab in dark mode glows with a translucent cyan/violet/rose gradient. Main gets a normal tab. You get this.
- **Heading glow** — `h1` and `h2` in dark mode have a soft violet/cyan `text-shadow`. Just enough to look intentional.
- **Light mode lavender tint** — the background in light mode shifted from pure white to `oklch(0.99 0.004 280)`. You'll never consciously notice. Your brain already has.

---

## 🔬 How Features Graduate Out of Labs

```
idea → beta branch → battle tested → merged to main → live site
```

When something in `beta` works consistently and doesn't explode, it gets promoted to `main`. The aesthetic overhaul above? Currently in testing. Extended analysis? Same. If you use this branch and nothing breaks for you, that's a data point that helps us ship it to everyone.

**Contributing to `beta`** is explicitly encouraged — see [CONTRIBUTING.md](CONTRIBUTING.md) for why landing a PR in `beta` is already more than halfway to the finish line.

---

## ✨ What the Full App Does

*(The stuff below is the same across both branches — the core feature set hasn't changed, it just got extra layers here.)*

### 🎹 Vibe Composer
The pitch-shift calculator and Circle of Fifths that don't look like they were made in 2003 by someone who'd never met a designer.

- 🎯 **Pitch Shift Calculator**: Input your key, input your target, get your semitones. No crying required.
- ⭕ **Interactive Circle of Fifths**: Beautiful horizontal layout, inner/outer rings for minor/major keys, Camelot + Musical modes. Your music teacher would be jealous and we'd let them be.

### 🧠 Music Analyzer
Paste a link or upload a file. Get the vibe extracted, surgically.

- 📥 **Universal Downloader (`yt-dlp`)**: 1,000+ supported sites. If it streams, we eat it.
- 🧠 **Essentia.js Analysis**: BPM, Key, Scale, Energy, Mood — real math, not guesses. A tiny pedantic music major lives in your browser tab now.
- 🎙️ **Stem Splitting**: Demucs, MDX-Net, Spleeter, BS-Roformer. Separate Vocals, Drums, Bass, and "Other" (a.k.a. the vibes themselves). ZIP named after the song. We thought of everything.
- ✨ **Vibe Studio (AI Chords)**: Feed the track's energy into Gemini. It ghostwrites a chord progression for you. You take all the credit. We don't mind.

### 🔁 Loop Studio
Build chord progressions. Set BPM. Hear them back with a proper soundfont. No DAW, no subscription, no upsell.

- 4–16 bar progressions in any key/scale
- Synced with the Circle of Fifths because the app should know what key you're in
- MIDI preview with piano roll and soundfont playback
- 7/8 time signature support — yes, we respect that about you

---

## 🚨 THE GOLDEN RULE: WAV/FLAC ONLY 🚨

MP3s are lossy. The stem splitter and analyzer prefer uncompressed audio. Feed them garbage, they'll try their best and still make a face about it.

If you're using beta models in particular, this matters even more. Experimental models are doing experimental math. Give them clean inputs.

---

## 🛠️ Running Labs Locally

```bash
git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
cd Harmonic-Studio-V2
git checkout beta
npm install
pip3 install -U demucs spleeter "audio-separator[cpu]" yt-dlp
npm run dev
```

> Requires: Node.js v20+, Python 3.11 (not 3.12, not 2.7), FFmpeg.

For a full automated install (including AI models), scripts are in the [main branch README](https://github.com/airiharuki/Harmonic-Studio-V2/tree/main#installation--setup-%EF%B8%8F).

---

## 🛠️ Stack

- ⚡ **Vite + React + TypeScript** — living on the edge, touching grass never
- 🎨 **Tailwind CSS 4** — utility classes go brrrr
- 🤖 **Google Gemini API** — smarter than us and we've made peace with that
- 🧠 **Essentia.js** — does not judge your music taste, unlike us
- 🎹 **sf2-synth-audio-worklet + Tonal** — soundfont playback that actually sounds good
- 🐍 **Python + yt-dlp + splitting engines** — the heavy lifting department
- 📺 **VHS Grain Overlay** — 1995 called, we invited it in for dinner

---

## ⚠️ Labs Disclaimer

Things on this branch might:
- Work perfectly (likely)
- Work *mostly* perfectly (also likely)
- Behave in a way that makes you go "huh, interesting" (possible)
- Crash in a creative and educational way (rare but possible)

That's the deal with labs. You're early. You're brave. We appreciate you specifically.

If something breaks, open an issue. If something is amazing, open a PR. If something made you feel things, drop a ⭐ on the main repo and we'll feel things right back.

---

## 📝 License

MIT. Remix it, fork it, build an empire on it. Just don't sue us if your track doesn't blow up. That's the algorithm's fault, not ours.

---

## 🙏 Credits

Made by someone who got tired of manually calculating pitch shifts at 4am, then got carried away building a whole lab around the problem. Built on vibes, caffeine, and the quiet belief that music tools should be beautiful and actually work.

---

*P.S. — You're on beta. That makes you part of the process. That's kind of cool. We think so anyway.*

**Made with ❤️, ☕, and increasingly experimental CSS**
