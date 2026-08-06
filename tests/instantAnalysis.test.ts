import { describe, it, expect, vi } from "vitest";
import {
  LatestRunGate,
  runInstantAnalysis,
  autoFetchRemoteAudio,
  QUICK_TARGET_SR,
  type AutoFetchDeps,
} from "../src/lib/instantAnalysis";

const makeEssentia = (bpm = 120.4, key = "A", scale = "minor") => ({
  arrayToVector: (s: Float32Array) => s,
  PercivalBpmEstimator: vi.fn(() => ({ bpm })),
  KeyExtractor: vi.fn(() => ({ key, scale })),
});

const samples = new Float32Array(1024);

describe("runInstantAnalysis", () => {
  it("returns rounded BPM and capitalised scale when detection succeeds", async () => {
    const essentia = makeEssentia(120.4, "A", "minor");
    const result = await runInstantAnalysis("blob:track-1", {
      getEssentia: () => essentia,
      fetchSamples: async () => samples,
    });
    expect(result).toEqual({ bpm: 120, key: "A", scale: "Minor" });
    expect(essentia.PercivalBpmEstimator).toHaveBeenCalledWith(
      samples,
      undefined, undefined, undefined, undefined, undefined, undefined,
      QUICK_TARGET_SR
    );
  });

  it("defaults scale to Major when the extractor omits it", async () => {
    const essentia = makeEssentia(98, "F", "");
    const result = await runInstantAnalysis("blob:track", {
      getEssentia: () => essentia,
      fetchSamples: async () => samples,
    });
    expect(result?.scale).toBe("Major");
  });

  it("fails silently (null) only when Essentia initialisation actually failed", async () => {
    const result = await runInstantAnalysis("blob:track", {
      getEssentia: () => null,
      // Init settled (e.g. script load error) but Essentia is still absent.
      waitForEssentia: async () => {},
      fetchSamples: async () => samples,
    });
    expect(result).toBeNull();
  });

  it("audio available before Essentia is ready: waits for init and still produces a result", async () => {
    const essentia = makeEssentia(87, "C", "major");
    let ready = false;
    let resolveInit!: () => void;
    const initPromise = new Promise<void>((r) => { resolveInit = r; });

    const pending = runInstantAnalysis("blob:early-track", {
      getEssentia: () => (ready ? essentia : null),
      waitForEssentia: () => initPromise,
      fetchSamples: async () => samples,
    });
    // Essentia finishes initialising well after the track loaded.
    ready = true;
    resolveInit();
    await expect(pending).resolves.toEqual({ bpm: 87, key: "C", scale: "Major" });
  });

  it("skips the wait entirely when Essentia is already ready", async () => {
    const waitForEssentia = vi.fn(async () => {});
    const result = await runInstantAnalysis("blob:track", {
      getEssentia: () => makeEssentia(101, "G", "major"),
      waitForEssentia,
      fetchSamples: async () => samples,
    });
    expect(result).toEqual({ bpm: 101, key: "G", scale: "Major" });
    expect(waitForEssentia).not.toHaveBeenCalled();
  });

  it("fails silently (null) when audio decoding throws", async () => {
    const result = await runInstantAnalysis("blob:track", {
      getEssentia: () => makeEssentia(),
      fetchSamples: async () => {
        throw new Error("decode failed");
      },
    });
    expect(result).toBeNull();
  });

  it("fails silently (null) when the analyser throws", async () => {
    const essentia = makeEssentia();
    essentia.PercivalBpmEstimator.mockImplementation(() => {
      throw new Error("wasm crash");
    });
    const result = await runInstantAnalysis("blob:track", {
      getEssentia: () => essentia,
      fetchSamples: async () => samples,
    });
    expect(result).toBeNull();
  });

  it("returns null when cancelled while loading samples (track replaced)", async () => {
    const gate = new LatestRunGate();
    const runId = gate.next();
    const essentia = makeEssentia();
    const result = await runInstantAnalysis("blob:old-track", {
      getEssentia: () => essentia,
      fetchSamples: async () => {
        // A new track loads while the old one's samples are still decoding.
        gate.next();
        return samples;
      },
      isCancelled: () => !gate.isCurrent(runId),
    });
    expect(result).toBeNull();
    // The stale run must not even attempt analysis.
    expect(essentia.PercivalBpmEstimator).not.toHaveBeenCalled();
  });

  it("returns null when the track changes while waiting for Essentia init", async () => {
    let cancelled = false;
    const essentia = makeEssentia();
    const result = await runInstantAnalysis("blob:track", {
      getEssentia: () => null,
      waitForEssentia: async () => {
        cancelled = true; // a different track loads during startup
      },
      fetchSamples: async () => samples,
      isCancelled: () => cancelled,
    });
    expect(result).toBeNull();
    expect(essentia.PercivalBpmEstimator).not.toHaveBeenCalled();
  });
});

describe("autoFetchRemoteAudio", () => {
  const blob = { fake: "blob" } as unknown as Blob;
  const makeDeps = (gate: LatestRunGate, overrides: Partial<AutoFetchDeps> = {}): AutoFetchDeps => ({
    gate,
    requestDownloadUrl: vi.fn(async () => "/files/track.mp3"),
    fetchBlob: vi.fn(async () => ({ data: blob, contentType: "audio/mpeg" })),
    hasManualAudio: () => false,
    installAudio: vi.fn(),
    ...overrides,
  });

  it("installs audio for the current load generation", async () => {
    const gate = new LatestRunGate();
    const loadId = gate.next();
    const deps = makeDeps(gate);
    await expect(autoFetchRemoteAudio(loadId, "https://yt/a", "A", deps)).resolves.toBe(true);
    expect(deps.installAudio).toHaveBeenCalledWith(blob);
  });

  it("loading two remote tracks sequentially: only the newest installs audio", async () => {
    const gate = new LatestRunGate();
    const installed: string[] = [];
    // Track A starts; its download is slow.
    const loadA = gate.next();
    let releaseA!: () => void;
    const depsA = makeDeps(gate, {
      requestDownloadUrl: () => new Promise((r) => { releaseA = () => r("/files/a.mp3"); }),
      installAudio: () => installed.push("A"),
    });
    const promiseA = autoFetchRemoteAudio(loadA, "https://yt/a", "A", depsA);
    // Track B loads before A's download resolves.
    const loadB = gate.next();
    const depsB = makeDeps(gate, { installAudio: () => installed.push("B") });
    const resultB = await autoFetchRemoteAudio(loadB, "https://yt/b", "B", depsB);
    releaseA();
    const resultA = await promiseA;
    expect(resultB).toBe(true);
    expect(resultA).toBe(false);
    expect(installed).toEqual(["B"]);
  });

  it("out-of-order info responses: a stale load id never starts installing", async () => {
    const gate = new LatestRunGate();
    const staleLoadId = gate.next(); // first /api/info request's generation
    gate.next();                     // second track load supersedes it
    const deps = makeDeps(gate);
    // The stale info response resolves late and tries to start its auto-fetch.
    await expect(autoFetchRemoteAudio(staleLoadId, "https://yt/old", "Old", deps)).resolves.toBe(false);
    expect(deps.requestDownloadUrl).not.toHaveBeenCalled();
    expect(deps.installAudio).not.toHaveBeenCalled();
  });

  it("does not clobber audio the user produced manually meanwhile", async () => {
    const gate = new LatestRunGate();
    const loadId = gate.next();
    const deps = makeDeps(gate, { hasManualAudio: () => true });
    await expect(autoFetchRemoteAudio(loadId, "https://yt/a", "A", deps)).resolves.toBe(false);
    expect(deps.installAudio).not.toHaveBeenCalled();
  });

  it("silently skips HTML error responses", async () => {
    const gate = new LatestRunGate();
    const loadId = gate.next();
    const deps = makeDeps(gate, {
      fetchBlob: async () => ({ data: blob, contentType: "text/html; charset=utf-8" }),
    });
    await expect(autoFetchRemoteAudio(loadId, "https://yt/a", "A", deps)).resolves.toBe(false);
    expect(deps.installAudio).not.toHaveBeenCalled();
  });

  it("fails silently when the download request throws", async () => {
    const gate = new LatestRunGate();
    const loadId = gate.next();
    const deps = makeDeps(gate, {
      requestDownloadUrl: async () => { throw new Error("network down"); },
    });
    await expect(autoFetchRemoteAudio(loadId, "https://yt/a", "A", deps)).resolves.toBe(false);
    expect(deps.installAudio).not.toHaveBeenCalled();
  });
});

describe("LatestRunGate", () => {
  it("only the most recent run id is current", () => {
    const gate = new LatestRunGate();
    const first = gate.next();
    expect(gate.isCurrent(first)).toBe(true);
    const second = gate.next();
    expect(gate.isCurrent(first)).toBe(false);
    expect(gate.isCurrent(second)).toBe(true);
  });

  it("supports interleaved local and remote loads invalidating each other", () => {
    const gate = new LatestRunGate();
    const remoteFetch = gate.next(); // remote track starts background fetch
    const localUpload = gate.next(); // user uploads a local file meanwhile
    expect(gate.isCurrent(remoteFetch)).toBe(false);
    expect(gate.isCurrent(localUpload)).toBe(true);
  });
});
