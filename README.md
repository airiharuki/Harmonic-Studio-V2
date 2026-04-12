# 🎵 VibeCoded Music Lab 🧪✨

Welcome to the **VibeCoded Music Lab**, the only place on the internet where we take music theory entirely too seriously, but literally nothing else. 

Are you tired of listening to a song and *not* knowing if its danceability quotient is exactly 0.84? Do you have an overwhelming urge to rip the bassline out of a 2009 YouTube tutorial video? You're in the right place, my friend.

## 🎸 What is this sorcery?

This app is a Frankenstein's monster of audio processing, stitched together with good vibes and questionable amounts of caffeine. Here's what we've crammed into this bad boy:

*   **Audio Downloading (`yt-dlp`)**: We rip audio from the interwebs faster than you can say "copyright infringement" (just kidding, please only download royalty-free lo-fi beats to study/relax to).
*   **Stem Splitting (`demucs`)**: Ever wanted to isolate the vocals of a song just to realize the singer is actually terrible without the backing track? Now you can! We slice your audio into Vocals, Drums, Bass, and "Other" (which is usually just the sound of the guitarist's ego).
*   **Music Analysis (`essentia.js`)**: We use actual, literal math to tell you the BPM, Key, Scale, Energy, and Mood of a track. It's like having a tiny, very pedantic music major trapped in your browser.
*   **AI Chord Generation (`Gemini`)**: Don't know what chords to play over that beat? We feed the track's vibe (Key, Scale, Mood, BPM) directly into Gemini's massive AI brain, and it spits out a 4-bar chord progression. It's basically ghostwriting for your jam sessions.
*   **Interactive Stem Mixer**: A visual mockup for adjusting the individual volumes of your separated stems (Vocals, Drums, Bass, Other).
*   **DJ Tools & Pitch Shifter**: Want to mix D Major into A Minor? Our Pitch Shift Calculator tells you exactly how many semitones to pitch up or down to match root notes or harmonic relative keys. Plus, an interactive Circle of Fifths with Camelot wheel values!
*   **Vibe Studio**: A dedicated space where the AI Chord Generator lives, surrounded by the pure essence of your track's vibe.
*   **Aesthetic Overload**: We've implemented a creamy, smooth transition between Light and Dark modes, complete with a grainy VHS overlay and custom background images. It's not just an app; it's an *experience*.

## 🚨 THE GOLDEN RULE: WAV ONLY 🚨

Listen to me very carefully. If you want to use the stem splitter or the music analyzer, **YOU MUST DOWNLOAD THE AUDIO AS A WAV FILE.** 

Why? Because MP3s are compressed, lossy garbage that throw our delicate algorithms into an existential crisis. We demand *uncompressed fidelity*. We want every single bit of audio data, even the parts human ears can't hear. Give us the WAVs, or give us death (or, you know, a generic error message).

## 💻 Running Locally

Want to run this chaotic masterpiece on your own machine? Here's how:

1.  **Clone the repo**: `git clone <your-repo-url>`
2.  **Install dependencies**: `npm install`
3.  **Set up environment variables**: Copy `.env.example` to `.env` and add your `GEMINI_API_KEY`.
4.  **Install Python dependencies**: You'll need `demucs` and `yt-dlp` installed on your system.
    *   `pip install demucs yt-dlp`
    *   *Note: Demucs works best with a GPU, otherwise it might take a while to split stems.*
5.  **Start the dev server**: `npm run dev`
6.  **Open your browser**: Go to `http://localhost:3000` and start vibing.

## 🧘‍♂️ Why 432Hz?

Look, is there any peer-reviewed scientific evidence that tuning your instruments to 432Hz aligns your chakras with the resonant frequency of the universe? No. Absolutely not. 

Is it a total vibe? **Yes.** 

We don't make the rules of the universe, we just code the vibes. If you want to argue about standard A440 tuning, please direct your complaints to a brick wall.

## 🤝 Contributing

Want to help make this chaotic music lab even better? We'd love your help! 

1.  Fork the repo.
2.  Write some code (preferably while listening to synthwave).
3.  Submit a Pull Request.
4.  If your code breaks the stem splitter, you owe us a coffee. If it fixes a bug, we owe you a high five (redeemable in the metaverse).

*Note: Please don't submit PRs to remove the VHS grain. It's aggressive, and we like it.*

## 🐛 Bug Reports & Feature Requests

Did you find a bug? Did the app tell you that a death metal song is "Calm" and "Happy"? 

Please submit an issue! But before you do, ask yourself: *Is this a bug, or is it just avant-garde?*

If you're sure it's a bug, describe it in excruciating detail. If you just say "it doesn't work," we will assume your computer is haunted and close the issue. 

For feature requests, dream big! Want us to add a feature that automatically translates guitar solos into interpretive dance? We probably won't do it, but we'd love to read the proposal.

## 📜 License

This project is licensed under the **MIT License**. Basically, do whatever you want with the code, but if your track doesn't blow up, don't complain to us.

---
*Built with 🧡, ☕, and a profound misunderstanding of copyright law by the VibeCoded team.*
