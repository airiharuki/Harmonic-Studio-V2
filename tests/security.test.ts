import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { safeJoin, validateStemName, ALLOWED_STEMS } from "../server/security";

// ─── Unit tests: safeJoin path-traversal guard ────────────────────────────────

describe("safeJoin", () => {
  let base: string;
  let outside: string;

  beforeAll(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "safejoin-base-"));
    outside = fs.mkdtempSync(path.join(os.tmpdir(), "safejoin-outside-"));
    fs.writeFileSync(path.join(base, "song.mp3"), "audio");
    fs.writeFileSync(path.join(outside, "secret.txt"), "secret");
  });

  afterAll(() => {
    fs.rmSync(base, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  });

  it("allows a plain filename inside the base dir", () => {
    expect(safeJoin(base, "song.mp3")).toBe(fs.realpathSync(path.join(base, "song.mp3")));
  });

  it("allows a non-existent filename inside the base dir", () => {
    expect(safeJoin(base, "not-yet-there.wav")).toBe(path.join(fs.realpathSync(base), "not-yet-there.wav"));
  });

  it("rejects empty input", () => {
    expect(safeJoin(base, "")).toBeNull();
  });

  const traversalPayloads = [
    "../secret.txt",
    "..",
    "../",
    "../../etc/passwd",
    "....//....//etc/passwd",
    "foo/../../etc/passwd",
    "..\u2215..\u2215etc\u2215passwd/../../../etc/passwd", // unicode lookalike + real traversal
  ];
  for (const payload of traversalPayloads) {
    it(`rejects traversal payload ${JSON.stringify(payload)}`, () => {
      const result = safeJoin(base, payload);
      if (result !== null) {
        // If not rejected outright, it must still be confined to base.
        expect(result.startsWith(fs.realpathSync(base) + path.sep)).toBe(true);
      }
    });
  }

  it("rejects '../secret.txt' outright", () => {
    expect(safeJoin(base, "../secret.txt")).toBeNull();
  });

  it("rejects absolute paths outside the base dir", () => {
    expect(safeJoin(base, "/etc/passwd")).toBeNull();
    expect(safeJoin(base, path.join(outside, "secret.txt"))).toBeNull();
  });

  it("rejects null-byte payloads", () => {
    expect(safeJoin(base, "song.mp3\0.png")).toBeNull();
    expect(safeJoin(base, "\0")).toBeNull();
    expect(safeJoin(base, "../secret.txt\0")).toBeNull();
  });

  it("rejects URL-decoded separators (as express delivers them)", () => {
    // Express decodes %2e%2e%2f -> "../" before the route handler sees it.
    expect(safeJoin(base, decodeURIComponent("..%2Fsecret.txt"))).toBeNull();
    expect(safeJoin(base, decodeURIComponent("%2e%2e%2fsecret.txt"))).toBeNull();
    expect(safeJoin(base, decodeURIComponent("..%5C..%5Cetc%5Cpasswd/../../etc/passwd"))).toBeNull();
  });

  it("rejects a symlink inside base pointing to a file outside base", () => {
    const link = path.join(base, "evil-link");
    fs.symlinkSync(path.join(outside, "secret.txt"), link);
    try {
      expect(safeJoin(base, "evil-link")).toBeNull();
    } finally {
      fs.unlinkSync(link);
    }
  });

  it("rejects a symlinked directory inside base escaping the base", () => {
    const link = path.join(base, "evil-dir");
    fs.symlinkSync(outside, link);
    try {
      expect(safeJoin(base, "evil-dir/secret.txt")).toBeNull();
    } finally {
      fs.unlinkSync(link);
    }
  });

  it("allows a symlink that stays inside the base dir", () => {
    const link = path.join(base, "ok-link");
    fs.symlinkSync(path.join(base, "song.mp3"), link);
    try {
      expect(safeJoin(base, "ok-link")).toBe(fs.realpathSync(path.join(base, "song.mp3")));
    } finally {
      fs.unlinkSync(link);
    }
  });
});

// ─── Unit tests: stem-name whitelist (guards the stemsToZip ZIP builder) ────

describe("validateStemName", () => {
  it("accepts every whitelisted stem", () => {
    for (const stem of ALLOWED_STEMS) {
      expect(validateStemName(stem)).toBe(stem);
    }
  });

  const badStems: unknown[] = [
    "../../.env",
    "..",
    "vocals/../../../etc/passwd",
    "/etc/passwd",
    "vocals\0",
    "VOCALS", // case must match exactly
    "vocals.wav",
    "",
    null,
    undefined,
    42,
    { toString: () => "vocals" },
    ["vocals"],
  ];
  for (const stem of badStems) {
    it(`rejects ${JSON.stringify(stem) ?? String(stem)}`, () => {
      expect(() => validateStemName(stem)).toThrow(/Invalid stem name/);
    });
  }
});
