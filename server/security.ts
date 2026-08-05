import path from "path";
import fs from "fs";

// Path traversal guard — resolves user-controlled filename segments and
// refuses anything that escapes the base directory (e.g. "../.env").
// Also resolves symlinks for existing paths so a planted symlink inside
// downloads/ or output/ can't redirect reads outside the base directory.
// Returns null for unsafe paths.
export const safeJoin = (baseDir: string, userPath: string): string | null => {
  if (!userPath || userPath.includes("\0")) return null;
  const baseResolved = path.resolve(baseDir);
  const resolved = path.resolve(baseResolved, userPath);
  if (resolved !== baseResolved && !resolved.startsWith(baseResolved + path.sep)) {
    return null;
  }
  // Symlink check — if the path exists, verify its REAL location is still
  // inside the base directory. Non-existent paths can't traverse at open
  // time, so the lexical check above is sufficient for them.
  try {
    const real = fs.realpathSync(resolved);
    const realBase = fs.realpathSync(baseResolved);
    if (real !== realBase && !real.startsWith(realBase + path.sep)) {
      return null;
    }
    return real;
  } catch {
    return resolved;
  }
};

// Whitelist of valid stem IDs — anything else (e.g. "../../.env")
// is rejected before it can reach the filesystem or the ZIP archive.
export const ALLOWED_STEMS = new Set([
  "vocals", "drums", "bass", "guitar", "piano", "other",
  "lead_vocal", "backing_vocal",
]);

// Validates a user-supplied stem name for the ZIP builder. Returns the stem
// if it is on the whitelist; throws otherwise.
export function validateStemName(stem: unknown): string {
  if (typeof stem !== "string" || !ALLOWED_STEMS.has(stem)) {
    throw new Error(`Invalid stem name: ${String(stem)}`);
  }
  return stem;
}
