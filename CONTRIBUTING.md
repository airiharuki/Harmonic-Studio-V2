# Contributing to Harmonic Studio V2

First off, thank you for considering contributing to VibeCoded Music Lab (Harmonic Studio V2)! 

To keep our project repository clean, readable, and easy to traverse, **WE URGE YOU TO USE CONVENTIONAL COMMITS AS MUCH AS POSSIBLE**.

## Conventional Commits 📝

We strongly encourage following the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification. This leads to highly readable messages that are easy to follow when looking through the project history, and helps automate versioning and changelogs.

### Commit Message Format
Each commit message consists of a **type**, an optional **scope**, and a **description**:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Allowed Types
Here is a breakdown of the commit types you should use and exactly what they mean:

*   **`feat:`** A new feature for the application (e.g., `feat: add BS-Roformer processing support`).
*   **`fix:`** A bug fix for the application (e.g., `fix: resolve crash on invalid YouTube URL`).
*   **`chore:`** Routine tasks, maintenance, or dependency updates that don't modify `src` files (e.g., `chore: update packages in package.json` or `chore: update .gitignore`).
*   **`docs:`** Changes purely to documentation like `README.md`, `CONTRIBUTING.md`, or code comments (e.g., `docs: update Oracle deployment instructions`).
*   **`style:`** Changes that do not affect the logic of the code—such as whitespace, formatting, missing semi-colons, or minor UI styling tweaks (e.g., `style: format server.ts variables`).
*   **`refactor:`** A code change that neither fixes a bug nor adds a feature, but improves the underlying codebase structure (e.g., `refactor: simplify audio splitting switch statement`).
*   **`perf:`** A code change that specifically improves performance or execution speed.
*   **`test:`** Adding missing tests or correcting existing tests.
*   **`build:`** Changes that affect the build system or external dependencies (e.g., npm config, vite setup, Dockerfile tweaks).
*   **`ci:`** Changes to CI/CD configuration files and scripts (e.g., GitHub Actions workflows).

### Breaking Changes 🚨
If your commit introduces a breaking change, you **must** append a `!` after the type/scope to draw attention to it.
*   Example: `feat!: upgrade audio-separator causing breaking API change in backend`

Thank you for contributing and helping us maintain a clean, professional, and easily readable repository!
