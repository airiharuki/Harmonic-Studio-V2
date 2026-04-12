# 🎵 VibeCoded Music Lab 🧪✨

A music theory tool that actually doesn't suck. Calculate pitch shifts, generate AI chords, analyze YouTube tracks, split stems, and stare at a Circle of Fifths that actually looks good—all while vibing at A=432Hz because we're fancy like that.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Vite + React](https://img.shields.io/badge/vite-react-black.svg)
![Vibes](https://img.shields.io/badge/vibes-immaculate-ff69b4.svg)

## ✨ What's This Thing Do?

### 🎹 Pitch & Scale Calculator

Have you ever listened to a song and thought, "Wow, this pitch is in a weird scale," and wondered exactly how many semitones you should pitch it up or down in your DAW? Or maybe you just want to know if a Yuno Miles track is technically in the same key as a Skrillex drop? You're in the right place, my friend.

- 🎯 Visual display of direct root shifts
- 🧠 Harmonic mixing (matches relative major/minor keys)
- ⬆️⬇️ Tells you exactly how many semitones to pitch that thing (+7, -3, whatever)

### 🎸 AI Chord Generation (Vibe Studio)

Look, we've all been there. Staring at the piano roll at 3am, trying to make a chord progression that doesn't sound like ass. This thing helps. We feed the track's vibe (Key, Scale, Mood, BPM) directly into Gemini's massive AI brain, and it spits out a 4-bar chord progression. It's basically ghostwriting for your jam sessions.

- 🤖 Powered by Gemini AI
- ✨ Generates chords based on the exact vibe of your analyzed track
- 🔮 Lives in its own dedicated "Vibe Studio" tab

### ⭕ Circle of Fifths

Finally, a Circle of Fifths that doesn't look like it was made in MS Paint in 2003.

- 🎵 **Musical Mode**: Classic notation for the theory nerds
- 🔢 **Camelot Mode**: For DJs who think in numbers and letters
- 🌙 Inner ring for minor keys, outer ring for major keys

### 📺 YouTube Audio Downloader & Analyzer

Paste a YouTube link, get the audio, and extract the vibe. That's it. That's the feature.

- 📥 **Audio Downloading (`yt-dlp`)**: We rip audio from the interwebs faster than you can say "copyright infringement" (just kidding, please only download royalty-free lo-fi beats to study/relax to).
- 🧠 **Music Analysis (`essentia.js`)**: We use actual, literal math to tell you the BPM, Key, Scale, Energy, and Mood of a track. It's like having a tiny, very pedantic music major trapped in your browser.

### 🎵 Stem Splitter

Do you have an overwhelming urge to rip the bassline out of a 2009 YouTube tutorial video? Ever wanted to isolate the vocals of a song just to realize the singer is actually terrible without the backing track? Now you can!

- 🎙️ **Stem Splitting (`demucs`)**: We slice your audio into Vocals, Drums, Bass, and "Other" (which is usually just the sound of the guitarist's ego).
- 🎚️ **Interactive Stem Mixer**: A visual mockup for adjusting the individual volumes of your separated stems.

### 🌓 It Looks Pretty Too™

- 🌙 Dark mode for late night sessions (moody charcoal-to-black gradient)
- ☀️ Light mode for when you open your laptop at a coffee shop (creamy off-white aesthetic™)
- 📺 **VHS Grain Overlay**: It's aggressive, and we like it. 
- ✨ Smooth-ass theme transitions that don't just snap between modes

## 🚨 THE GOLDEN RULE: WAV ONLY 🚨

Listen to me very carefully. If you want to use the stem splitter or the music analyzer, **YOU MUST DOWNLOAD THE AUDIO AS A WAV FILE.** 

Why? Because MP3s are compressed, lossy garbage that throw our delicate algorithms into an existential crisis. We demand *uncompressed fidelity*. We want every single bit of audio data, even the parts human ears can't hear. Give us the WAVs, or give us death (or, you know, a generic error message).

## 🚀 Try It

Just clone it and run it. Or click the deploy link if there is one.

## 🛠️ What's It Made With?

- ⚡ Vite + React (living on the edge)
- 🎨 Tailwind CSS 4 (utility classes go brrrr)
- 🤖 Google Gemini API (for the AI chords)
- 🧠 Essentia.js (for the math)
- 🐍 Python, `yt-dlp`, and `demucs` (for the heavy lifting)
- 💎 VHS Grain everywhere (because 1995 called and we answered)

## 📦 How to Run This Locally

```bash
# Get the code
git clone <your-repo-url>
cd vibecoded-music-lab

# Install the stuff
npm install

# Set up environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to the .env file

# Install Python dependencies (you'll need demucs and yt-dlp installed on your system)
pip install demucs yt-dlp
# Note: Demucs works best with a GPU, otherwise it might take a while to split stems.

# Run it
npm run dev

# Now go to localhost:3000 and make some music
```

## 🎯 How to Actually Use It

### Need to Pitch Shift Something?

1. Go to the DJ Tools tab
2. Pick your current key/scale (From Track)
3. Pick where you want it to go (To Track)
4. It tells you the semitones ("+7" means pitch up 7, etc.)
5. Go do that in your DAW
6. Profit 💰

### Analyzing a Track

1. Paste a YouTube URL 📺 (Remember: **WAV ONLY** if you want the good stuff).
2. Hit the download button. Wait patiently while our server does the heavy lifting.
3. Click "Analyze Track". Our math-powered hamsters will determine the BPM, Key, Scale, and overall mood.
4. Copy whatever values you need.

### Splitting Stems

1. After downloading your WAV file, click "Split Stems".
2. Wait for processing (may take a minute depending on file size).
3. Use the interactive stem mixer mockup to adjust volumes.
4. Use them in your DAW for remixing, sampling, or production.

### Making AI Chords

1. Analyze a track first to extract its vibe.
2. Head over to the Vibe Studio tab ✨
3. Click "Generate Magic" 🎲
4. Let Gemini write a 4-bar chord progression tailored to the exact vibe of your track.

### Using the Circle of Fifths

1. Go to the DJ Tools tab.
2. Toggle between Musical and Camelot mode based on your vibe.
3. Read the tips on the side if you forgot your music theory classes 📚

## 🎼 Why 432Hz Though?

Look, is there any peer-reviewed scientific evidence that tuning your instruments to 432Hz aligns your chakras with the resonant frequency of the universe? No. Absolutely not. 

Is it a total vibe? **Yes.** 

We don't make the rules of the universe, we just code the vibes. If you want to argue about standard A440 tuning, please direct your complaints to a brick wall.

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

- 📱 Mobile browsers can be weird with the audio (blame Apple)
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

**Made with ❤️, ☕, and questionable life choices**

*P.S. - If you made it this far in the README, you're the real MVP 🏅*
