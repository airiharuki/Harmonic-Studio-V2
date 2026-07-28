# 🎵 VibeCoded Music Lab 🧪✨

A music theory tool that actually doesn't suck. Calculate pitch shifts, generate AI chords, analyze tracks, split stems, and stare at a Circle of Fifths that actually looks good — all while vibing at A=432Hz because we're fancy like that.

> **Wait, is this that old project?**
> If you're looking for that old comp project from months ago, you're in the wrong place. This is the spiritual successor — faster, smarter, and significantly more unhinged. It's refined, powered by a robust suite of tools, and doesn't rely on fragile, over-hyped hosting platforms that shall remain nameless (looking at you, Vercel. We see you. We do not respect you). This version is a massive upgrade over that v0 prototype, kind of like how a spaceship is a massive upgrade over a tricycle.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Vite + React](https://img.shields.io/badge/vite-react-black.svg)
![Vibes](https://img.shields.io/badge/vibes-immaculate-ff69b4.svg)

## 🚀 Try It Live

**👉 [harmonic-studio-v-2--aiharu.replit.app](https://harmonic-studio-v-2--aiharu.replit.app)**

No install needed — just open it and vibe.

## ✨ What's This Thing Do?

### 🎹 Vibe Composer (Main Tab)
Have you ever listened to a song and thought, "Wow, this pitch is in a weird scale," and wondered exactly how many semitones you should pitch it up or down in your DAW? Or maybe you just want to know if a **Yuno Miles** track is technically in the same key as a **Skrillex** drop? Welcome. You're among friends. Weird, math-obsessed friends.

- 🎯 **Pitch Shift Calculator**: Tells you exactly how many semitones to pitch that thing (+7, -3, whatever) so it actually fits your project. Now with live key/scale display for your base and target keys. No more guessing. No more crying.
- ⭕ **Interactive Circle of Fifths**: Finally, a Circle of Fifths that doesn't look like it was made in MS Paint in 2003 by someone who'd never seen a circle. Completely redesigned with a beautiful horizontal layout, inner/outer rings for minor/major keys, and a harmonic relationship guide. Supports both Musical and Camelot modes. Your music teacher would be jealous.

### 🧠 Music Analyzer (Analyzer Tab)
Paste a link or upload a file, get the audio, and extract the vibe. That's it. That's the feature. No PhD required.

- 📥 **Universal Downloader (`yt-dlp`)**: We rip audio from the interwebs faster than you can say "copyright infringement" (not that we're suggesting anything). Files are automatically renamed to the actual track title, because `video_1080p_final_v3_REAL.mp3` is not a personality.
- 🚀 **High-Fidelity Audio Pre-processing**: Optimized retrieval workflows featuring automatic track title formatting and metadata detection. Translation: it just works, and it looks good doing it.
- 🎧 **Hidden Iframe Player**: Preview your downloaded tracks directly in the browser using our stealthy hidden iframe technique (because raw audio tags are so 2010, and we have standards).
- 🧠 **Music Analysis (`essentia.js`)**: We use actual, literal math to tell you the BPM, Key, Scale, Energy, and Mood of a track. It's like having a tiny, very pedantic music major trapped in your browser, except this one doesn't ask you to listen to their SoundCloud.
- 🎙️ **Stem Splitting (v2 Upgrade)**: Slice your audio into Vocals, Drums, Bass, and "Other" (a.k.a. "the vibe"). Now featuring multiple high-performance models: **Demucs**, **MDX-Net (BETA)**, **Spleeter (BETA)**, and **BS-Roformer (BETA)**. Plus, a quick "Vocals/Instrumental" toggle for when you need the a cappella version immediately and cannot wait.
  *   *Note: Models marked as BETA may not work 100% as expected. They are trying their best. Please be kind.*
  *   *Note: MP3 input is supported, but the resulting stem quality may be significantly lower (technically: "garbage") compared to WAV input. You've been warned. With love.*
- ✨ **Vibe Studio**: Feed the track's vibe directly into Gemini's massive AI brain, and it spits out a 4-bar chord progression. It's basically ghostwriting for your jam sessions. We won't tell.

### 🔁 Loop Studio (Loop Studio Tab)
The ultimate playground for creating custom chord loops. No DAW subscription required. No monthly fee. No upsell. Just vibes.

- 🎹 **AI Loop Generation**: Generate 4-16 bar chord progressions in any key. The AI does not take requests for "something that slaps" but it will try its best.
- ⏱️ **Custom Parameters**: Type in your own BPM (30-300) and Time Signature. Yes, you can do 7/8. Yes, we respect that choice. No, we don't understand you.
- 🎛️ **Manual Key Control**: Manually set the key and scale, or sync it instantly with the Circle of Fifths. Coordination has never been this painless.
- 🔊 **SoundFont Playback**: Hear your loops instantly with a high-quality electric piano sound. No more staring at a chord sheet wondering if C maj7 sounds "right." It does. It always did.
- ⭕ **Synced Theory**: Automatically syncs with the Circle of Fifths so your loops are always in the right key. A first in human history.
- 🚫 **BPM Validation**: "We're not making extra tone today" — built-in protection against impossible tempos. 0 BPM is not a vibe. 600 BPM is not a song. The app knows.

## 🛠️ Technical Resilience

We've optimized our engine to ensure reliable track retrieval across various network conditions, focusing on metadata accuracy and stream stability. In other words: we broke it so many times trying to make it not break that we are now confident it does not break.

### Key Improvements:
- **Connection Reliability**: Enhanced handling for intermittent network resets. The internet is chaos; this app is not.
- **Smart Metadata Retrieval**: Automatic extraction of track titles and artists to ensure your analyzed files are named correctly. Because a file named `Unknown_Artist_Track_01` is a cry for help.
- **Optimized Stream Handling**: Fine-tuned for containerized environments to ensure consistent performance. It runs in a box and it runs well. Respect the box.

## 🚨 THE GOLDEN RULE: WAV/FLAC ONLY 🚨

Listen to me very carefully. If you want to use the stem splitter or the music analyzer, **YOU SHOULD PREFER WAV OR FLAC FILES.**

Why? Because MP3s are compressed, lossy garbage that throw our delicate algorithms into an existential crisis. We demand *uncompressed fidelity*. We want every single bit of audio data, even the parts human ears can't hear. We didn't write 3,000 lines of code so you could feed us a 128kbps rip from 2009. Give us the WAVs, or give us death (or, you know, a generic error message, which honestly feels similar).

## 🌐 Supported Sites (yt-dlp)
We support over 1,000+ sites including:
- **YouTube** (obviously — we're not animals)
- **SoundCloud** (for the underground vibes)
- **Bandcamp** (support the artists! they are human people!)
- **Vimeo**
- **Mixcloud**
- **Twitch**
- **Twitter/X** (both names accepted, no political stance implied)
- **TikTok**
- And basically anything else that hosts video or audio. If it streams, we probably eat it.

## 🚀 How to Actually Use It

### Need to Pitch Shift Something?
1. Go to the **Composer** tab (it's the landing page — you literally cannot miss it).
2. Pick your current key/scale (From Track).
3. Pick where you want it to go (To Track).
4. It tells you the semitones ("+7" means pitch up 7, etc.).
5. Go do that in your DAW.
6. Profit 💰 (or at least sound like you know what you're doing, which is the real goal).

### Analyzing & Splitting a Track
1. Go to the **Analyzer** tab.
2. Paste a URL 📺 OR upload a local file 📁. Both are valid life choices.
3. Hit **Load** to fetch metadata.
4. Choose your format (WAV/FLAC, we beg of you) and hit **Download**.
5. Once loaded, use the sub-tabs:
   - **Split**: Select which stems you want (Vocals, Drums, etc.) and hit **Split & Download ZIP**. The ZIP will be named after the song. Yes, we thought of everything.
   - **Analyze**: Hit **Start Analysis** to get the BPM, Key, and Mood.
   - **Vibe**: After analysis, hit **Generate Magic** for AI chord progressions. It's magic. We said what we said.

### Creating Custom Loops
1. Go to the **Loop Studio** tab.
2. Set your **Bars** (4-16), **BPM** (30-300), and **Time Signature**.
3. (Optional) Set your key in the **Composer** tab using the Circle of Fifths. The app is synced. It knows.
4. Hit **Generate Loop** to get an AI-composed progression.
5. Hit **Play Loop** to hear it played with a professional electric piano sound. Immediately feel like a composer.
6. **MIDI Preview**: Upload a `.mid` file to preview the MIDI sequence in a piano roll editor and play it back using the built-in soundfont. Supports multi-track MIDI files. Yes, all of them.
7. **Lyrics Display**: Supports synchronized lyrics display. Lyrics are automatically displayed below the piano roll for supported files. You can find the raw lyrics in `public/lyrics.txt` which can be updated with new tracks.

### 📝 Lyrics Management
We've added a `public/lyrics.txt` file. You can paste lyrics from the web into this file. The app is designed to parse this format for future dynamic lyric support. No pressure. No rush. We're visionaries.

## Installation & Setup 🛠️

### The "I Just Need to Use It" Setup (Cloud Deployment)
If you just want to run this somewhere permanently without your laptop sounding like a jet engine, use our **Oracle Cloud** deployment guide. Standard free tiers on Render or Netlify will crash due to the high RAM (2GB+) required by the audio models. We learned this the hard way so you don't have to.
**See the full step-by-step cloud guide in [ORACLE_DEPLOYMENT.md](ORACLE_DEPLOYMENT.md).**

### The "Zero Setup" Local Install (Fully Automated)
We wrote scripts that handle *literally everything*. They will fetch Git if you don't have it, clone the repo, install FFmpeg/Python/Node.js, download the AI models, and set up the app. Just open your terminal and paste the command for your OS. Go make a coffee. It'll be done by the time you're back.

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
Don't trust our scripts? Valid. We respect your paranoia. Here is the manual, step-by-step process for those who prefer suffering with full visibility.

**1. Clone the repository**
```bash
git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
cd Harmonic-Studio-V2
```

**2. Install Core Dependencies**
You must natively install the following pieces of software on your system:
*   [Node.js](https://nodejs.org/) (v20+)
*   [Python](https://www.python.org/downloads/) (v3.11 recommended — not 3.12, not 2.7, please)
*   [FFmpeg](https://ffmpeg.org/download.html) (Crucial for audio processing. Non-negotiable. Treat it like oxygen.)

**3. Install AI Audio Models & Downloader**
```bash
python3 -m pip install --upgrade pip
pip3 install -U demucs spleeter "audio-separator[cpu]" yt-dlp
```
*(Note for Windows users with NVIDIA GPUs: You can swap `"audio-separator[cpu]"` for `"audio-separator[gpu]"` to utilize CUDA and go significantly faster. Your GPU will feel appreciated.)*

**4. Build & Run the App**
```bash
npm install
npm run dev
```

## 🛠️ What's It Made With?

- ⚡ **Vite + React** (living on the edge, touching grass never)
- 🎨 **Tailwind CSS 4** (utility classes go brrrr — we have no regrets)
- 🤖 **Google Gemini API** (for the AI chords — it's smarter than us and we've made peace with that)
- 🧠 **Essentia.js** (for the math — it does not judge your music taste, unlike us)
- 🎹 **sf2-synth-audio-worklet + Tonal** (for high-performance soundfont playback and music theory so accurate it's almost annoying)
- 🐍 **Python, `yt-dlp`, and splitting engines** (for the heavy lifting — Python doing Python things)
- 🎬 **`ffmpeg-static`** (because raw audio needs to be converted properly and we are not savages)
- 💾 **[Cobalt](https://github.com/imputnet/cobalt)** (Shoutout for the inspo on their clean download design — great taste recognized)
- 📺 **VHS Grain Overlay** (because 1995 called and we not only answered, we invited it in for dinner)

## 🌓 It Looks Pretty Too™

- 🌙 **Dark Mode**: Based on a moody charcoal aesthetic. For night owls, cave dwellers, and anyone who finds joy in the dark.
- ☀️ **Light Mode**: Creamy off-white aesthetic™. For people who have windows and use them.
- 📺 **VHS Grain Overlay**: It's aggressive, and we like it. No notes. No changes. This is art.

---

## 🧘 Why 432Hz?

Look, is there any peer-reviewed scientific evidence that tuning your instruments to 432Hz aligns your chakras with the resonant frequency of the universe? No. Absolutely not. Our legal team has asked us to be very clear about that.

Is it a total vibe? **Yes.**

We don't make the rules of the universe, we just code the vibes. If you want to argue about standard A440 tuning, please direct your complaints to a brick wall, which will give your argument the attention it deserves.

*(But seriously, if you want to go back to standard A440, we won't judge too hard. Just change the base frequency in the sine wave fallback in `src/App.tsx`:)*

```typescript
// In src/App.tsx
const playMidiSine = async (file: File) => {
  // ...
  const A4 = 440; // Change this from 432 to 440
  // ...
};
```

## 🤝 Want to Contribute?

Hell yeah! We love contributions. The codebase is chaotic but it has a soul. Want to help build the ultimate open-source music lab?

**👉 [Check out our Friendly Contribution Guide (CONTRIBUTING.md) to get started!](CONTRIBUTING.md)** We wrote it because we'd love your help, whether you're squashing a bug, submitting a Pull Request, or just fixing a typo that has been haunting us for weeks.

### 🏆 Contributors

Thanks to everyone who's helped make this thing better (you are legally required to be cool):

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- Add yourself here when you contribute! -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

*Your name could be here! The glory is real. The fame is modest but genuine. 👀*

## ⚠️ Stuff That's Kinda Broken

- 📺 YouTube analyzer can take a while if the video is an hour-long DJ mix (we're analyzing it, not vibing to it — probably)
- 🎵 Stem splitter quality depends on audio quality and length (longer, cleaner files = better separation — garbage in, garbage out, as the philosophers say)
- ⏱️ Stem processing can be slow on large files without GPU acceleration (your CPU is trying. Please appreciate it.)

None of it's dealbreaker stuff, just FYI. The app ships. The app works. The app has opinions.

## 📝 License

MIT — do whatever you want with it, remix it, fork it, build an empire on it. Just don't sue me if your track doesn't blow up. That's on the algorithm, not us.

## 🙏 Credits

Made by someone who got tired of manually calculating pitch shifts at 4am and also wanted a Circle of Fifths that didn't look like garbage. Built with pure vibes and an unreasonable amount of coffee, because sometimes you just want to understand how stuff actually works instead of npm installing 47 packages and praying.

If this helped you make something cool, that's genuinely dope. Drop a star ⭐ if you're feeling generous. It feeds the developer's ego, which in turn fuels the updates.

---

## 💡 Pro Tips

- 🎧 Use the Circle of Fifths Camelot mode if you're a DJ trying to mix harmonically — your transitions will go from "okay" to "wait, how did you do that?"
- ☀️ Light mode is genuinely nice if you're not in a cave (some of us live in caves. no judgment.)
- ✨ The theme toggle animation is smooth af — try it a few times. It sparks joy. Marie Kondo would approve.
- 🤖 If you don't like the AI chords, just click Generate again. Gemini doesn't have feelings (yet). Probably.

---

*P.S. — If you made it this far in the README, you are the target audience and we love you specifically.*

**Made with ❤️, ☕, and questionable life choices at questionable hours**

---

*"Eight years on, and I'm still drifting in your orbit. Just a satellite transmitting old melodies into the dark, hoping the signal somehow finds its way back to your universe."* 💫
