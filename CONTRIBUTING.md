# Welcome to Harmonic Studio V2! 👋

Hey there! If you're reading this file, it means you're interested in peeking under the hood and actually helping us build the ultimate open-source music lab. 

First off: **thank you so much.** We are incredibly grateful for your time and energy. Whether you're squashing a sneaky bug, adding a massive new AI separation model to the backend, or just fixing a single typo in the documentation, you are the reason this project gets better!

Because this app has *a lot* of moving parts (Vite, React, Python AI binaries, hardware audio processing, Oracle instances), we need a way to keep our history sane and easy to read. 

So... we have one major rule that we try to stick to.

## **WE URGE YOU TO USE CONVENTIONAL COMMITS AS MUCH AS POSSIBLE.** 🚨

We strongly encourage following the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification. Using this format makes the project history highly readable for everyone and helps us understand *exactly* what a PR does at a glance.

### The Message Format
Each commit message should look like this (a **type**, an optional **scope**, and a **description**):
```
<type>[optional scope]: <description>

[optional body]
```

### What do the Types mean?
Here is a quick cheat sheet for what tag you should use when you're committing:

*   🎸 **`feat:`** You built a brand new feature! (e.g., `feat: add BS-Roformer processing support`).
*   🩹 **`fix:`** You squashed a bug. (e.g., `fix: resolve crash on invalid YouTube URL`).
*   🧹 **`chore:`** Routine tasks, maintenance, or dependency updates that *don't* modify the actual application code. (e.g., `chore: update packages in package.json` or `chore: update .gitignore`).
*   📚 **`docs:`** You changed something purely in the documentation. (e.g., `docs: update Oracle deployment instructions`).
*   💅 **`style:`** Changes that don't affect logic at all—like whitespace, formatting, missing semi-colons, or minor UI CSS tweaks. (e.g., `style: format server.ts variables`).
*   🏗️ **`refactor:`** A code change that doesn't fix a bug or add a feature, but improves the underlying codebase structure so it's cleaner. (e.g., `refactor: simplify audio splitting switch statement`).
*   ⚡ **`perf:`** A code change that specifically improves performance or execution speed.
*   🧪 **`test:`** Adding missing tests or correcting existing ones.
*   📦 **`build:`** Changes that affect the build system or external dependencies like npm config or Vite.

### Did you break something on purpose? 💥
If your commit introduces a breaking change (like changing a major API route that the frontend relies on), you **must** append a `!` after the type/scope to draw attention to it!
*   Example: `feat!: upgrade audio-separator causing breaking API change in backend`

---

## 🐛 Found a Bug? Let's squash it.
We try our best, but sometimes things break. If the audio glitches out, the UI explodes, or a model fails to load:
1. Hit up the **Issues** tab to make sure someone else hasn't already pointed it out.
2. If you're the first to find it, open a new issue! Try to include:
   - What you *expected* to happen (the dream).
   - What *actually* happened (the reality).
   - A step-by-step on how we can recreate it.
   - Screenshots or console errors (we love these).
   - Your OS and browser (since Web Audio APIs act completely different depending on where they run).

## 💡 Got a Crazy Idea?
We love crazy ideas. Want to add a vintage cassette tape filter? Support a brand new machine learning model? 
1. Open a new issue and slap the `enhancement` label on it.
2. Describe your vision and why it would make the app 10x cooler.
3. We'll hop in the comments, chat about it, and figure out how to make it real!

## 🔧 Want to Write Some Code? (Pull Requests)
Ready to get your hands dirty? Here is the chillest path to getting your code merged:
1. **Fork the repo** to your own GitHub account.
2. **Create a branch** for your magic (`git checkout -b feature/cool-thing`).
3. **Hack away.** Build the thing!
4. **Test it locally.** (Please make sure the app actually boots up before pushing!).
5. **Commit your code** using that sweet **Conventional Commit** format we talked about above (`feat: add cool thing`).
6. **Push** to your fork (`git push origin feature/cool-thing`).
7. **Open a Pull Request!**
8. Kick back and wait for a review. We're super laid back, so don't sweat it if we suggest a few minor tweaks.

## 📜 Keeping the Code Clean
We don't have a million strict corporate rules, but please keep these in mind:
- **Types are friends:** We use TypeScript. Please try to type your variables so the compiler doesn't yell at us.
- **Tailwind only:** We do all our styling with Tailwind utility classes. No stray CSS files, please!
- **Break it up:** If a React component is getting massive, try to split it into smaller pieces.
- **Comment the weird stuff:** If you write a piece of logic and think *"wow, this is kind of a hack"*, leave a comment so the next developer doesn't cry trying to understand it.
- **Format:** Just run `npm run lint` before you make your PR to ensure the linter is happy!

## 📋 Looking for inspiration?
If you want to contribute but don't know where to start, here is our current wishlist. Pick anything that sounds fun!
- [ ] 🎹 **Music Theory:** Add chord inversions to the AI progression generator.
- [ ] 🎵 **AI Models:** Hook up new/better stem separation models or add GPU acceleration toggles for the backend.
- [ ] ⌨️ **UX:** Add keyboard shortcuts for power users.
- [ ] 💾 **Storage:** Let users save/load their favorite progressions to local browser storage.
- [ ] 🎨 **Vibes:** Create more color themes (why stop at just dark and light?).
- [ ] 📱 **Mobile:** Make the UI look better on tiny screens.
- [ ] 🧪 **Tests:** Add unit tests (yeah, yeah, we know we should have these).
- [ ] ✨ **Surprise us:** Whatever you think would be cool!

---

Again, thank you so much for contributing. Fork the repo, build something sick, and open that Pull Request. We can't wait to see what you make! 🚀
