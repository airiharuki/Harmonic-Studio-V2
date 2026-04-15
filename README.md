# 🎵 VibeCoded Music Lab 🧪✨

A music theory tool that actually doesn't suck. Calculate pitch shifts, generate AI chords, analyze tracks, split stems, and stare at a Circle of Fifths that actually looks good—all while vibing at A=432Hz because we're fancy like that.

> **Wait, is this that old project?**
> If you're looking for that old comp project from months ago, you're in the wrong place. This is the spiritual successor—faster, smarter, and significantly more powerful. It's refined, powered by a robust suite of tools, and doesn't rely on fragile, over-hyped hosting platforms that shall remain nameless (looking at you, Vercel). This version is a massive upgrade over that v0 prototype.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Vite + React](https://img.shields.io/badge/vite-react-black.svg)
![Vibes](https://img.shields.io/badge/vibes-immaculate-ff69b4.svg)

## ✨ What's This Thing Do?

### 🎹 Vibe Composer (Main Tab)
Have you ever listened to a song and thought, "Wow, this pitch is in a weird scale," and wondered exactly how many semitones you should pitch it up or down in your DAW? Or maybe you just want to know if a **Yuno Miles** track is technically in the same key as a **Skrillex** drop? You're in the right place, my friend.

- 🎯 **Pitch Shift Calculator**: Tells you exactly how many semitones to pitch that thing (+7, -3, whatever) so it actually fits your project. Now with live key/scale display for your base and target keys.
- ⭕ **Interactive Circle of Fifths**: Finally, a Circle of Fifths that doesn't look like it was made in MS Paint in 2003. Completely redesigned with a beautiful horizontal layout, inner/outer rings for minor/major keys, and a harmonic relationship guide. Supports both Musical and Camelot modes.

### 🧠 Music Analyzer (Analyzer Tab)
Paste a link or upload a file, get the audio, and extract the vibe. That's it. That's the feature.

- 📥 **Universal Downloader (`yt-dlp`)**: We rip audio from the interwebs faster than you can say "copyright infringement". Files are automatically renamed to the actual track title.
- 🎧 **Hidden Iframe Player**: Preview your downloaded tracks directly in the browser using our stealthy hidden iframe technique (because raw audio tags are so 2010).
- 🧠 **Music Analysis (`essentia.js`)**: We use actual, literal math to tell you the BPM, Key, Scale, Energy, and Mood of a track. It's like having a tiny, very pedantic music major trapped in your browser.
- 🎙️ **Stem Splitting (v2 Upgrade)**: Slice your audio into Vocals, Drums, Bass, and "Other". Now featuring multiple high-performance models: **Demucs**, **MDX-Net (BETA)**, **Spleeter (BETA)**, and **BS-Roformer (BETA)**. Plus, a quick "Vocals/Instrumental" toggle for faster workflows.
  *   *Note: Models marked as BETA may not work 100% as expected.*
  *   *Note: MP3 input is supported, but the resulting stem quality may be significantly lower (potentially "garbage") compared to WAV input.*
- ✨ **Vibe Studio**: Feed the track's vibe directly into Gemini's massive AI brain, and it spits out a 4-bar chord progression. It's basically ghostwriting for your jam sessions.

### 🔁 Loop Studio (Loop Studio Tab)
The ultimate playground for creating custom chord loops.

- 🎹 **AI Loop Generation**: Generate 4-16 bar chord progressions in any key.
- ⏱️ **Custom Parameters**: Type in your own BPM (30-300) and Time Signature.
- 🎛️ **Manual Key Control**: Manually set the key and scale, or sync it instantly with the Circle of Fifths.
- 🔊 **SoundFont Playback**: Hear your loops instantly with a high-quality electric piano sound. No more guessing what the chords sound like.
- ⭕ **Synced Theory**: Automatically syncs with the Circle of Fifths so your loops are always in the right key.
- 🚫 **BPM Validation**: "We’re not making extra tone today" — built-in protection against impossible tempos.

## 🚨 THE GOLDEN RULE: WAV/FLAC ONLY 🚨

Listen to me very carefully. If you want to use the stem splitter or the music analyzer, **YOU SHOULD PREFER WAV OR FLAC FILES.** 

Why? Because MP3s are compressed, lossy garbage that throw our delicate algorithms into an existential crisis. We demand *uncompressed fidelity*. We want every single bit of audio data, even the parts human ears can't hear. Give us the WAVs, or give us death (or, you know, a generic error message).

## 🌐 Supported Sites (yt-dlp)
We support over 1000+ sites including:
- **YouTube** (obviously)
- **SoundCloud** (for the underground vibes)
- **Bandcamp** (support the artists!)
- **Vimeo**
- **Mixcloud**
- **Twitch**
- **Twitter/X**
- **TikTok**
- And basically anything else that hosts video or audio.

## 🚀 How to Actually Use It

### Need to Pitch Shift Something?
1. Go to the **Composer** tab (it's the landing page).
2. Pick your current key/scale (From Track).
3. Pick where you want it to go (To Track).
4. It tells you the semitones ("+7" means pitch up 7, etc.).
5. Go do that in your DAW.
6. Profit 💰 (or at least sound like you know what you're doing).

### Analyzing & Splitting a Track
1. Go to the **Analyzer** tab.
2. Paste a URL 📺 OR upload a local file 📁.
3. Hit **Load** to fetch metadata.
4. Choose your format (WAV/FLAC recommended) and hit **Download**.
5. Once loaded, use the sub-tabs:
   - **Split**: Select which stems you want (Vocals, Drums, etc.) and hit **Split & Download ZIP**.
   - **Analyze**: Hit **Start Analysis** to get the BPM, Key, and Mood.
   - **Vibe**: After analysis, hit **Generate Magic** for AI chord progressions.

### Creating Custom Loops
1. Go to the **Loop Studio** tab.
2. Set your **Bars** (4-16), **BPM** (30-300), and **Time Signature**.
3. (Optional) Set your key in the **Composer** tab using the Circle of Fifths.
4. Hit **Generate Loop** to get an AI-composed progression.
5. Hit **Play Loop** to hear it played with a professional electric piano sound.
6. **MIDI Preview**: Upload a `.mid` file to preview the MIDI sequence in a piano roll editor and play it back using the built-in soundfont. Supports multi-track MIDI files.
7. **Lyrics Display**: Supports synchronized lyrics display. Lyrics are automatically displayed below the piano roll for supported files. You can find the raw lyrics in `public/lyrics.txt` which can be updated with new tracks.

### 📝 Lyrics Management
We've added a `public/lyrics.txt` file. You can paste lyrics from the web into this file. The app is designed to parse this format for future dynamic lyric support.

## 🚀 Deployment (Oracle Cloud Free Tier)

This app requires significant RAM (2GB+) to run the Demucs AI stem splitter, meaning standard free tiers on Render or Netlify will crash. 

The best way to host this for free is using **Oracle Cloud's "Always Free" ARM instance** (which gives you 24GB of RAM for free).

We have included a `Dockerfile` and `docker-compose.yml` to make this easy. 

**See the full step-by-step guide in [ORACLE_DEPLOYMENT.md](ORACLE_DEPLOYMENT.md).**

## 🛠️ What's It Made With?

- ⚡ **Vite + React** (living on the edge)
- 🎨 **Tailwind CSS 4** (utility classes go brrrr)
- 🤖 **Google Gemini API** (for the AI chords)
- 🧠 **Essentia.js** (for the math)
- 🎹 **SpessaSynth + Tonal** (for high-quality soundfont playback and theory)
- 🐍 **Python, `yt-dlp`, and splitting engines** (for the heavy lifting)
- 🎬 **`ffmpeg-static`** (because raw audio needs to be converted properly)
- 📺 **VHS Grain Overlay** (because 1995 called and we answered)

## 🌓 It Looks Pretty Too™

- 🌙 **Dark Mode**: Based on a moody charcoal aesthetic.
- ☀️ **Light Mode**: Creamy off-white aesthetic™.
- 📺 **VHS Grain Overlay**: It's aggressive, and we like it. 

---

## 🧘 Why 432Hz?

Look, is there any peer-reviewed scientific evidence that tuning your instruments to 432Hz aligns your chakras with the resonant frequency of the universe? No. Absolutely not. 

Is it a total vibe? **Yes.** 

We don't make the rules of the universe, we just code the vibes. If you want to argue about standard A440 tuning, please direct your complaints to a brick wall.

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

Hell yeah! We love contributions. Here's how to get involved:

### 🐛 Found a Bug?

1. Check if someone already reported it in Issues
2. If not, open a new issue with:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Screenshots if applicable
   - Your browser/OS info

### 💡 Got an Idea?

1. Open an issue with the `enhancement` label
2. Describe what you want and why it'd be cool
3. We'll discuss it and maybe you can build it!

### 🔧 Want to Submit Code?

1. Fork the repo
2. Create a branch (`git checkout -b feature/cool-thing`)
3. Make your changes
4. Test that stuff actually works
5. Commit with a decent message (`git commit -m "Add cool thing that does X"`)
6. Push to your fork (`git push origin feature/cool-thing`)
7. Open a Pull Request
8. Wait for review (we're pretty chill)

### 📋 Contribution Ideas

Here's some stuff we'd love help with:

- [ ] 🎹 Chord inversions for the AI generator
- [ ] 🎵 Better stem separation models or GPU acceleration for faster processing
- [ ] ⌨️ Keyboard shortcuts for power users
- [ ] 💾 Save/load progressions to local storage
- [ ] 🎨 More color themes (why stop at two?)
- [ ] 📱 Better mobile responsiveness
- [ ] 🧪 Unit tests (yeah yeah, we know)
- [ ] Whatever you think would be cool

### 📜 Code Style

- We use TypeScript, so please type your stuff
- Tailwind for styling (no CSS files please)
- Keep components reasonably sized
- Comment weird shit so the next person doesn't cry
- Run `npm run lint` before submitting

### 🏆 Contributors

Thanks to everyone who's helped make this thing better:

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- Add yourself here when you contribute! -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

*Your name could be here! 👀*

## ⚠️ Stuff That's Kinda Broken

- 📺 YouTube analyzer can take a while if the video is an hour-long DJ mix
- 🎵 Stem splitter quality depends on audio quality and length (longer files = better separation)
- ⏱️ Stem processing can be slow on large files without GPU acceleration

None of it's dealbreaker stuff, just FYI.

## 📝 License

MIT - do whatever you want with it, just don't sue me if your track doesn't blow up.

## 🙏 Credits

Made by someone who got tired of manually calculating pitch shifts at 4am and also wanted a Circle of Fifths that didn't look like garbage. Built with pure vibes because sometimes you just want to understand how stuff actually works instead of npm installing 47 packages.

If this helped you make something cool, that's dope. Drop a star ⭐ if you're feeling generous.

---

## 💡 Pro Tips

- 🎧 Use the Circle of Fifths Camelot mode if you're a DJ trying to mix harmonically
- ☀️ Light mode is genuinely nice if you're not in a cave
- ✨ The theme toggle animation is smooth af, try it a few times
- 🤖 If you don't like the AI chords, just click Generate again. Gemini doesn't have feelings (yet).

---

*P.S. - If you made it this far in the README, you're the real MVP 🏅*

**Made with ❤️, ☕, and questionable life choices**

---
