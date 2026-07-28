# Welcome to Harmonic Studio V2! 👋

Hey there! If you're reading this file, it means you're interested in peeking under the hood and actually helping us build the ultimate open-source music lab. That's genuinely wonderful. Pull up a chair.

First off: **thank you so much.** Seriously, from the bottom of our hearts. Whether you're squashing a sneaky bug, adding a massive new AI separation model to the backend, or just fixing a single typo in the documentation — you're making this little corner of the internet better, and that matters. Every contribution, no matter how small, is a gift.

Because this app has *a lot* of moving parts (Vite, React, Python AI binaries, hardware audio processing, Oracle instances), we need a way to keep our history sane and easy to read. Future contributors — including future you — will thank us for this.

So... we have one major rule that we try to stick to.

## **WE URGE YOU TO USE CONVENTIONAL COMMITS AS MUCH AS POSSIBLE.** 🚨

We strongly encourage following the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification. Using this format makes the project history highly readable for everyone and helps us understand *exactly* what a PR does at a glance. Think of it as leaving a kind note for whoever comes next.

### The Message Format
Each commit message should look like this (a **type**, an optional **scope**, and a **description**):
```
<type>[optional scope]: <description>

[optional body]
```

### What do the Types mean?
Here is a quick cheat sheet for what tag you should use when you're committing:

*   🎸 **`feat:`** You built a brand new feature! (e.g., `feat: add BS-Roformer processing support`).
*   🩹 **`fix:`** You squashed a bug. A hero's work. (e.g., `fix: resolve crash on invalid YouTube URL`).
*   🧹 **`chore:`** Routine tasks, maintenance, or dependency updates that *don't* modify the actual application code. (e.g., `chore: update packages in package.json` or `chore: update .gitignore`).
*   📚 **`docs:`** You changed something purely in the documentation. The unsung heroism of open source. (e.g., `docs: update Oracle deployment instructions`).
*   💅 **`style:`** Changes that don't affect logic at all — like whitespace, formatting, missing semi-colons, or minor UI CSS tweaks. (e.g., `style: format server.ts variables`).
*   🏗️ **`refactor:`** A code change that doesn't fix a bug or add a feature, but makes the underlying codebase cleaner and more loveable. (e.g., `refactor: simplify audio splitting switch statement`).
*   ⚡ **`perf:`** A code change that specifically improves performance or execution speed. Speed is kindness.
*   🧪 **`test:`** Adding missing tests or correcting existing ones. You are doing the right thing.
*   📦 **`build:`** Changes that affect the build system or external dependencies like npm config or Vite.

### Did you break something on purpose? 💥
If your commit introduces a breaking change (like changing a major API route that the frontend relies on), you **must** append a `!` after the type/scope to draw attention to it — it's only fair to give everyone a heads-up!
*   Example: `feat!: upgrade audio-separator causing breaking API change in backend`

---

## 🐛 Found a Bug? Let's squash it.
We try our best, but sometimes things break. That's okay — it's how we learn. If the audio glitches out, the UI has a moment, or a model fails to load:
1. Hit up the **Issues** tab to make sure someone else hasn't already found it (someone else also cares!).
2. If you're the first to find it, open a new issue! Try to include:
   - What you *expected* to happen (the dream).
   - What *actually* happened (the reality check).
   - A step-by-step on how we can recreate it.
   - Screenshots or console errors (these are incredibly helpful, truly).
   - Your OS and browser (since Web Audio APIs behave differently depending on where they run).

## 💡 Got a Crazy Idea?
We love crazy ideas. Genuinely. Want to add a vintage cassette tape filter? Hook up a brand new machine learning model? Make the Circle of Fifths spin?
1. Open a new issue and slap the `enhancement` label on it.
2. Share your vision and why it would make the app more joyful to use.
3. We'll hop in the comments, chat about it together, and figure out how to make it real. Collaboration is the whole point.

## 🔧 Want to Write Some Code? (Pull Requests)
Ready to get your hands dirty? Here is the warmest, most welcoming path to getting your code merged:
1. **Fork the repo** to your own GitHub account. It's yours now. Treat it well.
2. **Create a branch** for your magic (`git checkout -b feature/cool-thing`).
3. **Hack away.** Build the thing you believe in!
4. **Test it locally.** (Please make sure the app actually boots up before pushing — your future reviewers will appreciate it deeply).
5. **Commit your code** using that sweet **Conventional Commit** format we talked about above (`feat: add cool thing`).
6. **Push** to your fork (`git push origin feature/cool-thing`).
7. **Open a Pull Request!** Write a little description about what you did and why. We love reading them.
8. Kick back and wait for a review. We're kind and constructive here, so don't stress if we suggest a few tweaks — it's all in good faith.

## 📜 Keeping the Code Clean
We don't have a million strict corporate rules — this is a music app, not a bank. But please keep these in mind so the next person who touches this code has a good time:
- **Types are friends:** We use TypeScript. Please try to type your variables so the compiler stays happy and future-you doesn't suffer.
- **Tailwind only:** We do all our styling with Tailwind utility classes. No stray CSS files, please — we like to keep things tidy.
- **Break it up:** If a React component is getting big, consider splitting it into smaller, friendlier pieces.
- **Comment the weird stuff:** If you write a piece of logic and think *"wow, this is kind of a hack"*, leave a comment so the next developer doesn't have to sit there confused at midnight. Be the comment you wish you had.
- **Format:** Just run `npm run lint` before you make your PR to make sure the linter is happy!

## 📋 Looking for inspiration?
If you want to contribute but don't know where to start, here is our current wishlist. Pick anything that sparks joy for you!
- [ ] 🎹 **Music Theory:** Add chord inversions to the AI progression generator.
- [ ] 🎵 **AI Models:** Hook up new/better stem separation models or add GPU acceleration toggles for the backend.
- [ ] ⌨️ **UX:** Add keyboard shortcuts for power users who want to fly.
- [ ] 💾 **Storage:** Let users save/load their favorite progressions to local browser storage.
- [ ] 🎨 **Vibes:** Create more color themes — why stop at dark and light when there's a whole spectrum out there?
- [ ] 📱 **Mobile:** Make the UI shine on smaller screens so everyone can vibe on the go.
- [ ] 🧪 **Tests:** Add unit tests (we know, we know — we appreciate you more than words can say if you do this).
- [ ] ✨ **Surprise us:** Whatever you think would be cool. We mean it.

---

Again, thank you so much for being here. You didn't have to show up, and you did. Fork the repo, build something wonderful, and open that Pull Request. We genuinely cannot wait to see what you make. 🚀
