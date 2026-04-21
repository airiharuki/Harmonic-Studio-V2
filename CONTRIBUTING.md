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

## 🐛 Found a Bug?
1. Check if someone already reported it in Issues.
2. If not, open a new issue with:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Screenshots if applicable
   - Your browser/OS info

## 💡 Got an Idea?
1. Open an issue with the `enhancement` label.
2. Describe what you want and why it'd be cool.
3. We'll discuss it and maybe you can build it!

## 🔧 Want to Submit Code (Pull Requests)?
1. Fork the repo.
2. Create a branch (`git checkout -b feature/cool-thing`).
3. Make your changes.
4. Test that stuff actually works locally first.
5. Commit with a **Conventional Commit** message (`feat: add cool thing that does X`).
6. Push to your fork (`git push origin feature/cool-thing`).
7. Open a Pull Request!
8. Wait for review (we're pretty chill).

## 📜 Code Style
- We use TypeScript, so please type your stuff!
- Tailwind for styling (no CSS files please).
- Keep React components reasonably sized.
- Comment weird logic so the next person doesn't cry.
- Run `npm run lint` before submitting a PR.

## 📋 Stuff You Can Help With
Here are some things we'd love help with right now if you are looking for ideas:
- [ ] 🎹 Chord inversions for the AI generator
- [ ] 🎵 Better stem separation models or GPU acceleration for faster processing
- [ ] ⌨️ Keyboard shortcuts for power users
- [ ] 💾 Save/load progressions to local storage
- [ ] 🎨 More color themes (why stop at two?)
- [ ] 📱 Better mobile responsiveness
- [ ] 🧪 Unit tests (yeah yeah, we know)
- [ ] Whatever you think would be cool!

---

Again, thank you so much for contributing. Fork the repo, build something sick, and open that Pull Request. We can't wait to see what you make! 🚀
