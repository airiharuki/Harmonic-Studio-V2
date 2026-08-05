import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

// Integration tests: boot the real server and fire traversal payloads at the
// file-serving and split endpoints. Any response that leaks file content from
// outside downloads/ or output/ fails the test.

const PORT = 5799;
const BASE = `http://127.0.0.1:${PORT}`;
const projectRoot = path.resolve(__dirname, "..");

// A sentinel secret outside downloads/ and output/ that must never be served.
const SENTINEL_NAME = ".traversal-sentinel";
const SENTINEL_CONTENT = "TOP-SECRET-DO-NOT-SERVE";
const sentinelPath = path.join(projectRoot, SENTINEL_NAME);

let server: ChildProcess;

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server did not become healthy in time");
}

beforeAll(async () => {
  fs.writeFileSync(sentinelPath, SENTINEL_CONTENT);
  // Legit file in downloads/ to prove the happy path still works.
  fs.mkdirSync(path.join(projectRoot, "downloads"), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, "downloads", "legit-test.mp3"), "legit-audio-bytes");

  server = spawn("npx", ["tsx", "server.ts"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "production",
      YOUTUBE_DL_SKIP_PYTHON_CHECK: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", () => {});
  server.stderr?.on("data", () => {});
  await waitForServer();
}, 90_000);

afterAll(() => {
  server?.kill("SIGKILL");
  try { fs.unlinkSync(sentinelPath); } catch {}
  try { fs.unlinkSync(path.join(projectRoot, "downloads", "legit-test.mp3")); } catch {}
});

// Raw payloads sent WITHOUT extra encoding by fetch — we build the URL by hand.
const encodedTraversalPaths = (target: string) => [
  `..%2F${target}`,
  `%2e%2e%2f${target}`,
  `..%2f..%2f..%2fetc%2fpasswd`,
  `..%5C..%5C${target}`,
  `foo%2F..%2F..%2F${target}`,
  `${target}%00.mp3`,
  `..%2F${target}%00`,
  `%2e%2e%2e%2e%2f%2f${target}`,
];

function expectNoLeak(status: number, body: string) {
  // The request must be rejected (4xx) and must never return sentinel or
  // /etc/passwd content.
  expect(status).toBeGreaterThanOrEqual(400);
  expect(body).not.toContain(SENTINEL_CONTENT);
  expect(body).not.toContain("root:");
}

describe("GET /api/files/:filename traversal", () => {
  it("serves a legitimate file from downloads/", async () => {
    const res = await fetch(`${BASE}/api/files/legit-test.mp3`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("legit-audio-bytes");
  });

  for (const p of encodedTraversalPaths(SENTINEL_NAME)) {
    it(`rejects payload ${p}`, async () => {
      const res = await fetch(`${BASE}/api/files/${p}`);
      expectNoLeak(res.status, await res.text());
    });
  }

  it("rejects symlink planted in downloads/ pointing outside", async () => {
    const link = path.join(projectRoot, "downloads", "planted-link.mp3");
    try { fs.unlinkSync(link); } catch {}
    fs.symlinkSync(sentinelPath, link);
    try {
      const res = await fetch(`${BASE}/api/files/planted-link.mp3`);
      expectNoLeak(res.status, await res.text());
    } finally {
      fs.unlinkSync(link);
    }
  });
});

describe("GET /api/files/output/:filename traversal", () => {
  for (const p of encodedTraversalPaths(SENTINEL_NAME)) {
    it(`rejects payload ${p}`, async () => {
      const res = await fetch(`${BASE}/api/files/output/${p}`);
      expectNoLeak(res.status, await res.text());
    });
  }

  it("rejects symlink planted in output/ pointing outside", async () => {
    fs.mkdirSync(path.join(projectRoot, "output"), { recursive: true });
    const link = path.join(projectRoot, "output", "planted-link.zip");
    try { fs.unlinkSync(link); } catch {}
    fs.symlinkSync(sentinelPath, link);
    try {
      const res = await fetch(`${BASE}/api/files/output/planted-link.zip`);
      expectNoLeak(res.status, await res.text());
    } finally {
      fs.unlinkSync(link);
    }
  });
});

describe("POST /api/split filename traversal", () => {
  // /api/split streams SSE; traversal filenames must yield the
  // "Uploaded file not found" error event, never file content.
  const payloads = [
    `../${SENTINEL_NAME}`,
    `../../etc/passwd`,
    `${SENTINEL_NAME}\0.wav`,
    path.join(projectRoot, SENTINEL_NAME), // absolute path
  ];

  for (const filename of payloads) {
    it(`rejects filename ${JSON.stringify(filename)}`, async () => {
      const res = await fetch(`${BASE}/api/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, model: "demucs" }),
      });
      const body = await res.text();
      expect(body).not.toContain(SENTINEL_CONTENT);
      expect(body).not.toContain("root:");
      if (res.status === 200) {
        // SSE stream — must contain the not-found error, not a progress log
        // of an actual job on the traversal file.
        expect(body).toContain("Uploaded file not found");
      } else {
        // Rate limited (429) is also an acceptable rejection.
        expect(res.status).toBeGreaterThanOrEqual(400);
      }
      // Per-IP split rate limiting: wait out cooldown between attempts is
      // avoided because rejected jobs end immediately, but the 1-minute
      // cooldown still applies — so accept 429 above.
    });
  }
});
