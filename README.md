# 🎵 VibeCoded Music Lab 🧪✨

A music theory tool that actually doesn't suck. Calculate pitch shifts, generate chord progressions, analyze tracks, split stems, and stare at a Circle of Fifths that actually looks good — all while vibing at A=432Hz because we're fancy like that.

> **Wait, is this that old project?**
> If you're looking for that old comp project from months ago, you're in the wrong place. This is the spiritual successor — faster, smarter, and significantly more unhinged. It's refined, powered by a robust suite of tools, and doesn't rely on fragile, over-hyped hosting platforms that shall remain nameless (looking at you, Vercel. We see you. We do not respect you). This version is a massive upgrade over that v0 prototype, kind of like how a spaceship is a massive upgrade over a tricycle.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Vite + React](https://img.shields.io/badge/vite-react-black.svg)
![Vibes](https://img.shields.io/badge/vibes-immaculate-ff69b4.svg)
[![Changelog](https://img.shields.io/badge/changelog-what's%20new-6366f1.svg)](CHANGELOG.md)

## 🚀 Try It Live

**👉 [harmonic-studio-v-2--aiharu.replit.app](https://harmonic-studio-v-2--aiharu.replit.app)**

No install needed — just open it and vibe.

## ✨ What's This Thing Do?

### 🎹 Vibe Composer (Main Tab)
Have you ever listened to a song and thought, "Wow, this pitch is in a weird scale," and wondered exactly how many semitones you should pitch it up or down in your DAW? Or maybe you just want to know if a **Yuno Miles** track is technically in the same key as a **Skrillex** drop? Welcome. You're among friends. Weird, math-obsessed friends.

- 🎯 **Pitch Shift Calculator**: Tells you exactly how many semitones to pitch that thing (+7, -3, whatever) so it actually fits your project. Live key/scale display for your base and target keys. No more guessing. No more crying.
- ⭕ **Interactive Circle of Fifths**: Completely redesigned with a beautiful horizontal layout, inner/outer rings for minor/major keys, and a harmonic relationship guide. Supports both Musical and Camelot modes. Your music teacher would be jealous.
- 🔗 **Cross-tab Sync**: The key you set here talks to the Loop Studio, talks to the Analyzer. Everything stays in sync.

### 🧠 Music Analyzer (Analyzer Tab)
Paste a link or upload a file, get the audio, and extract the vibe. That's it. That's the feature. No PhD required.

- 📥 **Universal Downloader (`yt-dlp`)**: Pulls audio from 1,000+ sites. Files are automatically renamed to the actual track title, because `video_1080p_final_v3_REAL.mp3` is not a personality.
- 🎧 **Hidden Iframe Player**: Preview your downloaded tracks directly in the browser without cluttering the UI.
- 🧠 **Music Analysis (`essentia.js`)**: We use actual, literal math to tell you the BPM, Key, Scale, Energy, and Mood of a track. A tiny, very pedantic music major now lives in your browser tab.
- 🎙️ **Stem Splitting** — pull tracks apart with the model that fits the job:
  - **Demucs** — reliable, single-pass. `4-stem` (Vocals/Drums/Bass/Other) or `6-stem` (+ Guitar & Piano).
  - **Spleeter** `legacy · fallback` — single-pass. `2-stem`, `4-stem`, or `5-stem` (+ Piano). Start with Demucs; use Spleeter only when another model is troublesome for your track or setup.
  - **MDX-Net** and **BS-Roformer** — currently in trial. They're in the codebase and being stress-tested before general release; there's a hidden power-user layer of the app that unlocks them early (see below 👀).
  - Outputs as a ZIP named after the song.
- ✨ **Vibe Studio**: After analysis, generate a 4-bar chord progression from the track's detected key and mood.

> 🚨 **WAV or FLAC only** for the analyzer and splitter. MP3s are lossy and the models make faces. You've been warned, kindly.

### 🔁 Loop Studio (Loop Studio Tab)
The ultimate playground for creating custom chord loops. No DAW subscription required. No monthly fee. No upsell. Just vibes.

- 🎲 **Progression Generator**: 4–16 bars, any key, any scale. Pulls from a local pack of 128 real chord progressions ported from [ldrolez/free-midi-chords](https://github.com/ldrolez/free-midi-chords) (MIT) — no API call, no wait, no cost, works offline. Filter by mood (Hopeful, Romantic, Dark, Triumphant, and more) or leave it on "Any mood" for chaos.
- ⏱️ **Full Parameter Control**: Custom BPM (30–300) and time signature. Yes, 7/8 is supported.
- 🔊 **SoundFont Playback**: Hear your progression with a high-quality electric piano instantly.
- 🎹 **MIDI Preview + Piano Roll**: Upload a `.mid` file and see it rendered in a piano roll editor with playback, including multi-track MIDI. Generated loops get a live piano roll too, with a scrolling playhead.
- 💾 **MIDI Export**: One click builds a proper `.mid` file, correctly timed, ready to drop into your DAW.
- 🥁 **Tap Tempo**: Tap the beat, the BPM field updates live — up to 8 taps averaged.
- 🎚️ **Semitone Transpose**: Shift every chord in a progression up or down without regenerating.
- 📜 **Chord History**: Your last 10 generated progressions are saved locally — reload any of them in one click.
- 📝 **Lyrics Display**: Synchronized lyrics pulled from `public/lyrics.txt`.
- ⭕ **Synced Theory**: Automatically syncs with the Circle of Fifths so your loops are always in the right key.

## 🔬 Something's Cooking

Somewhere in this app there's a hidden toggle that unlocks an experimental layer — early access to trial models, extended raw analysis metrics, and a few other things we're not going to spell out. There are at least three ways to find it. Consider it a scavenger hunt for people who read READMEs. Whatever you unlock there is genuinely being tested, not just decoration — expect rough edges.

## 🚨 THE GOLDEN RULE: WAV/FLAC ONLY 🚨

Listen to me very carefully. If you want to use the stem splitter or the music analyzer, **YOU SHOULD PREFER WAV OR FLAC FILES.**

Why? Because MP3s are compressed, lossy garbage that throw our delicate algorithms into an existential crisis. We demand *uncompressed fidelity*. Give us the WAVs, or give us death (or, you know, a generic error message, which honestly feels similar).

## 🌐 Supported Sites (yt-dlp)
We support over 1,000+ sites including:
- **YouTube**, **SoundCloud**, **Bandcamp**, **Vimeo**, **Mixcloud**, **Twitch**, **Twitter/X**, **TikTok**
- And basically anything else that hosts video or audio. If it streams, we probably eat it.

## 🚀 How to Actually Use It

### Need to Pitch Shift Something?
1. Go to the **Composer** tab (it's the landing page — you literally cannot miss it).
2. Pick your current key/scale (From Track).
3. Pick where you want it to go (To Track).
4. It tells you the semitones ("+7" means pitch up 7, etc.).
5. Go do that in your DAW.

### Analyzing & Splitting a Track
1. Go to the **Analyzer** tab.
2. Paste a URL 📺 OR upload a local file 📁.
3. Hit **Load** to fetch metadata.
4. Choose your format (WAV/FLAC, we beg of you) and hit **Download**.
5. Once loaded, use the sub-tabs:
   - **Split**: Pick a model and variant, select which stems you want, hit **Split & Download ZIP**.
   - **Analyze**: Hit **Start Analysis** to get the BPM, Key, and Mood.
   - **Vibe**: After analysis, hit **Generate** for an AI chord progression.

### Creating Custom Loops
1. Go to the **Loop Studio** tab.
2. Set your **Bars** (4–16), **BPM** (30–300), and **Time Signature**.
3. (Optional) Set your key in the **Composer** tab using the Circle of Fifths — it's synced.
4. Hit **Roll Progression** to pull one from the local chord pack, optionally filtered by mood.
5. Hit **Play** to hear it, or **Export MIDI** to save it.

### 📝 Lyrics Management
`public/lyrics.txt` holds lyrics the app parses for synchronized display. Paste in new lyrics, update the display.

## Installation & Setup 🛠️

### The "I Just Need to Use It" Setup (Cloud Deployment)
If you just want to run this somewhere permanently without your laptop sounding like a jet engine, use our **Oracle Cloud** deployment guide. Standard free tiers on Render or Netlify will crash due to the high RAM (2GB+) required by the audio models.
**See the full step-by-step cloud guide in [ORACLE_DEPLOYMENT.md](ORACLE_DEPLOYMENT.md).**

### The "Zero Setup" Local Install (Fully Automated)
We wrote scripts that handle *literally everything*. They will fetch Git if you don't have it, clone the repo, install FFmpeg/Python/Node.js, download the AI models, and set up the app.

**Windows (Run in PowerShell as Administrator):**
```powershell
irm https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/main/install.ps1 | iex
```

**macOS (Run in Terminal):**
```bash
curl -fsSL https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/main/install_mac.sh | bash
```

**Linux (Debian/Ubuntu):**
```bash
curl -fsSL https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/main/install_linux.sh | bash
```

### The "I Like Doing Things the Hard Way" Install (Manual)

**1. Clone the repository**
```bash
git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
cd Harmonic-Studio-V2
```

**2. Install Core Dependencies**
You must natively install the following pieces of software on your system:
*   [Node.js](https://nodejs.org/) (v20+)
*   [Python](https://www.python.org/downloads/) (v3.11 recommended — not 3.12, not 2.7, please)
*   [FFmpeg](https://ffmpeg.org/download.html) (Crucial for audio processing. Non-negotiable.)
*   [Deno](https://deno.land/) (v2.9+ — needed by `yt-dlp` to solve YouTube's n-challenge)

**3. Install AI Audio Models & Downloader**
```bash
python3 -m pip install --upgrade pip
pip3 install -U demucs spleeter "audio-separator[cpu]" yt-dlp
```
*(Note for Windows users with NVIDIA GPUs: swap `"audio-separator[cpu]"` for `"audio-separator[gpu]"` to utilize CUDA.)*

**4. Build & Run the App**
```bash
npm install
npm run dev
```

## 🛠️ What's It Made With?

- ⚡ **Vite + React**
- 🎨 **Tailwind CSS 4**
- 🤖 **Google Gemini API** (for Vibe Studio chord suggestions on analyzed tracks)
- 🧠 **Essentia.js** (for the analysis math)
- 🎹 **sf2-synth-audio-worklet + Tonal** (soundfont playback and music theory)
- 🐍 **Python, `yt-dlp`, and splitting engines** (Demucs, Spleeter, audio-separator)
- 🦕 **Deno** (solves YouTube's n-challenge for `yt-dlp`)
- 🎬 **`ffmpeg-static`**
- 💾 **[Cobalt](https://github.com/imputnet/cobalt)** — shoutout for the inspo on their clean download design
- 📺 **VHS Grain Overlay**

## 🌓 It Looks Pretty Too™

- 🌙 **Dark Mode**: A moody deep-space aesthetic with a slow-breathing aurora backdrop.
- ☀️ **Light Mode**: A barely-there lavender tint. Your brain registers it as *premium* without knowing why.
- 📺 **VHS Grain Overlay**: It's aggressive, and we like it.

---

## 🧘 Why 432Hz?

Look, is there any peer-reviewed scientific evidence that tuning your instruments to 432Hz aligns your chakras with the resonant frequency of the universe? No. Absolutely not.

Is it a total vibe? **Yes.**

*(If you want standard A440 instead, change the base frequency in the sine wave fallback in `src/App.tsx`:)*

```typescript
// In src/App.tsx
const playMidiSine = async (file: File) => {
  // ...
  const A4 = 440; // Change this from 432 to 440
  // ...
};
```

## 🤝 Want to Contribute?

We love contributions. The codebase is chaotic but it has a soul.

**👉 [Check out CONTRIBUTING.md to get started!](CONTRIBUTING.md)** New work lands on the `beta` branch first, gets stress-tested, then graduates here.

### 🏆 Contributors

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- Add yourself here when you contribute! -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

*Your name could be here! 👀*

## ⚠️ Stuff That's Kinda Broken

- 📺 YouTube analyzer can take a while on hour-long files.
- 🎵 Stem splitter quality depends on audio quality and length — garbage in, garbage out.
- ⏱️ Stem processing can be slow on large files without GPU acceleration.
- ⚗️ MDX-Net and BS-Roformer are mid-trial — expect them to graduate out of the experimental layer once they've proven out.

## 📝 License

MIT — do whatever you want with it, remix it, fork it, build an empire on it.

## 🙏 Credits

Made by someone who got tired of manually calculating pitch shifts at 4am and also wanted a Circle of Fifths that didn't look like garbage. Built with pure vibes and an unreasonable amount of coffee.

If this helped you make something cool, drop a star ⭐ if you're feeling generous.

---

## 💡 Pro Tips

- 🎧 Use the Circle of Fifths Camelot mode if you're a DJ trying to mix harmonically.
- ☀️ Light mode is genuinely nice if you're not in a cave.
- ✨ The theme toggle animation is smooth — try it a few times.
- 🥁 Use Tap Tempo in Loop Studio when you already know the feel but not the number.

---

*P.S. — If you made it this far in the README, you are the target audience and we love you specifically.*

~~Sponsored by Replit~~ *(or maybe not)*

**Made with ❤️, ☕, and questionable life choices at questionable hours**

---

*"Eight years on, and I'm still drifting in your orbit. Just a satellite transmitting old melodies into the dark, hoping the signal somehow finds its way back to your universe."* 💫
