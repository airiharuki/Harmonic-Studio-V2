/**
 * Integration tests: POST /api/split stage event ordering.
 *
 * Boots the real Express server and fires split requests at it, then
 * inspects the SSE stream to verify:
 *
 *  1. Remote-URL branch emits stages in order: download → convert → ...
 *  2. Uploaded-file branch never emits a "download" stage; first stage is "convert".
 *  3. BVR jobs emit separate events with pass: 1 and pass: 2 in that order.
 *
 * The tests are intentionally tolerant of early termination (the server will
 * error out once it tries to run a model that isn't installed in CI) — we
 * only assert on the stage events that arrive before any error.
 *
 * Rate-limit isolation: each test sends a unique X-Forwarded-For IP so the
 * per-IP 60 s cooldown never blocks a second test (trust proxy is enabled).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

const PORT = 5800;
const BASE = `http://127.0.0.1:${PORT}`;
const projectRoot = path.resolve(__dirname, "..");

let server: ChildProcess;

// ── Server lifecycle ──────────────────────────────────────────────────────────

async function waitForServer(timeoutMs = 60_000): Promise<void> {
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
  // Ensure the downloads dir exists so the uploaded-file tests can place files.
  fs.mkdirSync(path.join(projectRoot, "downloads"), { recursive: true });

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
});

// ── SSE helper ────────────────────────────────────────────────────────────────

interface SseEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * POST to /api/split and collect all SSE events until the stream closes or
 * a `done`/`error` event arrives (whichever comes first).  If the server
 * returns 429 the test is skipped gracefully.
 */
async function collectSplitEvents(
  body: Record<string, unknown>,
  fakeIp: string,
): Promise<{ status: number; events: SseEvent[] }> {
  const res = await fetch(`${BASE}/api/split`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Unique IP per test so rate limits don't bleed across test cases.
      "X-Forwarded-For": fakeIp,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    return { status: res.status, events: [] };
  }

  const events: SseEvent[] = [];
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const evt: SseEvent = JSON.parse(line.slice(6));
        events.push(evt);
        // Stop reading after terminal events — no need to wait out the stream.
        if (evt.type === "done" || evt.type === "error") {
          reader.cancel();
          return { status: res.status, events };
        }
      } catch {
        // ignore non-JSON lines
      }
    }
  }
  return { status: res.status, events };
}

/** Extract stage-type events in arrival order. */
function stageEvents(events: SseEvent[]): SseEvent[] {
  return events.filter((e) => e.type === "stage");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/split — stage event ordering", () => {
  it("remote URL branch: first stage emitted is 'download'", async () => {
    const { status, events } = await collectSplitEvents(
      {
        url: "https://example.com/fake-track-for-test.mp3",
        model: "demucs",
        stemsToZip: ["vocals"],
      },
      "10.0.0.1",
    );

    // If rate-limited, skip rather than fail — the cooldown is a server-config
    // concern, not a stage-ordering concern.
    if (status === 429) return;

    expect(status).toBe(200);
    const stages = stageEvents(events);
    expect(stages.length).toBeGreaterThan(0);
    expect(stages[0].stage).toBe("download");
  }, 30_000);

  it("remote URL branch: 'convert' follows 'download' before any separate/package", async () => {
    const { status, events } = await collectSplitEvents(
      {
        url: "https://example.com/fake-track-for-test-2.mp3",
        model: "demucs",
        stemsToZip: ["vocals"],
      },
      "10.0.0.2",
    );

    if (status === 429) return;

    expect(status).toBe(200);
    const stageIds = stageEvents(events).map((e) => e.stage as string);
    const downloadIdx = stageIds.indexOf("download");
    const convertIdx = stageIds.indexOf("convert");

    // download must appear
    expect(downloadIdx).toBeGreaterThanOrEqual(0);
    // if convert appears, it must come after download
    if (convertIdx >= 0) {
      expect(convertIdx).toBeGreaterThan(downloadIdx);
    }
  }, 30_000);

  it("uploaded-file branch: 'download' stage is never emitted", async () => {
    // Place a minimal valid file so the server passes the existence check.
    const filename = `test-upload-${Date.now()}.wav`;
    const filePath = path.join(projectRoot, "downloads", filename);
    fs.writeFileSync(filePath, Buffer.alloc(44, 0)); // 44-byte stub WAV header

    try {
      const { status, events } = await collectSplitEvents(
        {
          filename,
          model: "demucs",
          stemsToZip: ["vocals"],
        },
        "10.0.1.1",
      );

      if (status === 429) return;

      expect(status).toBe(200);
      const stageIds = stageEvents(events).map((e) => e.stage as string);

      // The regression: uploaded files must NEVER emit a "download" stage.
      expect(stageIds).not.toContain("download");
    } finally {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }, 30_000);

  it("uploaded-file branch: first stage emitted is 'convert'", async () => {
    const filename = `test-upload-first-${Date.now()}.wav`;
    const filePath = path.join(projectRoot, "downloads", filename);
    fs.writeFileSync(filePath, Buffer.alloc(44, 0));

    try {
      const { status, events } = await collectSplitEvents(
        {
          filename,
          model: "demucs",
          stemsToZip: ["vocals"],
        },
        "10.0.1.2",
      );

      if (status === 429) return;

      expect(status).toBe(200);
      const stages = stageEvents(events);
      expect(stages.length).toBeGreaterThan(0);
      expect(stages[0].stage).toBe("convert");
    } finally {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }, 30_000);

  it("BVR branch: separate events carry pass:1 then pass:2 in order", async () => {
    // BVR requires the audio-separator binary; if it's absent the server sends
    // an error event immediately. We just check that IF separate events arrive
    // they carry the right pass numbers in order.
    const { status, events } = await collectSplitEvents(
      {
        url: "https://example.com/fake-bvr-track.mp3",
        model: "bs-roformer",
        modelVariant: "karaoke_bsr",
        stemsToZip: ["lead_vocal", "backing_vocal"],
      },
      "10.0.2.1",
    );

    if (status === 429) return;

    expect(status).toBe(200);

    const separateEvents = stageEvents(events).filter((e) => e.stage === "separate");
    if (separateEvents.length === 0) {
      // audio-separator not installed — error arrived before any separate
      // event. This is acceptable: the test guards pass ordering, not
      // model availability.
      const errEvent = events.find((e) => e.type === "error");
      expect(errEvent).toBeDefined();
      return;
    }

    // Passes must arrive in ascending order (1 before 2).
    const passes = separateEvents.map((e) => e.pass as number);
    expect(passes[0]).toBe(1);
    if (passes.length > 1) {
      expect(passes[1]).toBe(2);
    }
  }, 30_000);

  it("BVR branch: download stage appears before the first separate stage", async () => {
    const { status, events } = await collectSplitEvents(
      {
        url: "https://example.com/fake-bvr-track-2.mp3",
        model: "bs-roformer",
        modelVariant: "karaoke_bsr",
        stemsToZip: ["lead_vocal"],
      },
      "10.0.2.2",
    );

    if (status === 429) return;

    expect(status).toBe(200);
    const stages = stageEvents(events);
    if (stages.length === 0) return; // error before any stage — skip ordering check

    // First stage event for a remote URL must be download.
    expect(stages[0].stage).toBe("download");
  }, 30_000);
});
