/**
 * Unit tests for split pipeline pure helpers.
 *
 * These run without a server or React — they cover the exact logic that caused
 * two regression classes caught in review:
 *
 *  1. buildSplitSteps — local uploads must NOT include a "Download" step.
 *  2. stageToStepId  — BVR pass numbers must map to the correct step IDs.
 *  3. buildSplitPayload — the remote-URL path must use the persisted
 *     videoInfo URL, never the raw input-field value alone.
 */

import { describe, it, expect } from "vitest";
import {
  buildSplitSteps,
  stageToStepId,
  buildSplitPayload,
} from "../src/splitUtils";

// ── buildSplitSteps ───────────────────────────────────────────────────────────

describe("buildSplitSteps", () => {
  describe("local upload (isLocalFile=true)", () => {
    it("never contains a 'download' step", () => {
      const ids = buildSplitSteps(true, false).map((s) => s.id);
      expect(ids).not.toContain("download");
    });

    it("labels the first step 'Prepare', not 'Convert'", () => {
      const steps = buildSplitSteps(true, false);
      const convert = steps.find((s) => s.id === "convert");
      expect(convert?.label).toBe("Prepare");
    });

    it("ends with package → done", () => {
      const ids = buildSplitSteps(true, false).map((s) => s.id);
      const pkgIdx = ids.indexOf("package");
      const doneIdx = ids.indexOf("done");
      expect(pkgIdx).toBeGreaterThan(-1);
      expect(doneIdx).toBe(pkgIdx + 1);
    });

    it("standard (non-BVR) has a single 'separate' step", () => {
      const ids = buildSplitSteps(true, false).map((s) => s.id);
      expect(ids).toContain("separate");
      expect(ids).not.toContain("separate_1");
      expect(ids).not.toContain("separate_2");
    });

    it("BVR expands 'separate' into separate_1 / separate_2", () => {
      const ids = buildSplitSteps(true, true).map((s) => s.id);
      expect(ids).not.toContain("separate");
      expect(ids).toContain("separate_1");
      expect(ids).toContain("separate_2");
      // pass 1 before pass 2
      expect(ids.indexOf("separate_1")).toBeLessThan(ids.indexOf("separate_2"));
    });
  });

  describe("remote URL (isLocalFile=false)", () => {
    it("starts with a 'download' step", () => {
      const ids = buildSplitSteps(false, false).map((s) => s.id);
      expect(ids[0]).toBe("download");
    });

    it("order is download → convert → separate → package → done", () => {
      expect(buildSplitSteps(false, false).map((s) => s.id)).toEqual([
        "download",
        "convert",
        "separate",
        "package",
        "done",
      ]);
    });

    it("BVR order is download → convert → separate_1 → separate_2 → package → done", () => {
      expect(buildSplitSteps(false, true).map((s) => s.id)).toEqual([
        "download",
        "convert",
        "separate_1",
        "separate_2",
        "package",
        "done",
      ]);
    });
  });
});

// ── stageToStepId ─────────────────────────────────────────────────────────────

describe("stageToStepId", () => {
  it("returns null when stage is null", () => {
    expect(stageToStepId(null, null, false)).toBeNull();
    expect(stageToStepId(null, null, true)).toBeNull();
  });

  it("passes non-separate stages through unchanged", () => {
    for (const stage of ["download", "convert", "package", "done"]) {
      expect(stageToStepId(stage, null, false)).toBe(stage);
      expect(stageToStepId(stage, null, true)).toBe(stage);
    }
  });

  it("maps separate (non-BVR) to 'separate'", () => {
    expect(stageToStepId("separate", null, false)).toBe("separate");
    expect(stageToStepId("separate", 1, false)).toBe("separate");
  });

  it("BVR pass 1 maps to 'separate_1'", () => {
    expect(stageToStepId("separate", 1, true)).toBe("separate_1");
  });

  it("BVR pass 2 maps to 'separate_2'", () => {
    expect(stageToStepId("separate", 2, true)).toBe("separate_2");
  });

  it("BVR with no pass defaults to separate_1", () => {
    expect(stageToStepId("separate", null, true)).toBe("separate_1");
  });
});

// ── buildSplitPayload ─────────────────────────────────────────────────────────

describe("buildSplitPayload — local upload", () => {
  const base = {
    selectedStems: ["vocals", "drums"],
    splittingModel: "demucs",
    modelVariant: "htdemucs",
    videoInfo: null,
    url: "https://example.com/stale-input-field-value",
  };

  it("carries 'filename', not 'url'", () => {
    const payload = buildSplitPayload({ ...base, uploadedFilename: "track.wav" });
    expect(payload.filename).toBe("track.wav");
    expect(payload.url).toBeUndefined();
  });

  it("filename and url are never both present", () => {
    const payload = buildSplitPayload({ ...base, uploadedFilename: "track.wav" });
    const keys = Object.keys(payload);
    expect(keys).not.toContain("url");
    expect(keys).toContain("filename");
  });

  it("uses uploadedFilename as title when videoInfo is null", () => {
    const payload = buildSplitPayload({ ...base, uploadedFilename: "track.wav" });
    expect(payload.title).toBe("track.wav");
  });
});

describe("buildSplitPayload — remote URL", () => {
  const base = {
    selectedStems: ["vocals", "bass"],
    splittingModel: "demucs",
    modelVariant: "htdemucs",
    uploadedFilename: null,
  };

  it("uses videoInfo.loadedUrl, ignoring the raw url input", () => {
    const payload = buildSplitPayload({
      ...base,
      videoInfo: { loadedUrl: "https://cdn.example.com/persisted.mp4", title: "Track" },
      url: "https://example.com/stale-input-field-value",
    });
    expect(payload.url).toBe("https://cdn.example.com/persisted.mp4");
    expect(payload.url).not.toContain("stale-input-field-value");
  });

  it("falls back to soundcloudUrl when loadedUrl is absent", () => {
    const payload = buildSplitPayload({
      ...base,
      videoInfo: { soundcloudUrl: "https://api.soundcloud.com/tracks/123/stream" },
      url: "https://example.com/stale-input-field-value",
    });
    expect(payload.url).toBe("https://api.soundcloud.com/tracks/123/stream");
    expect(payload.url).not.toContain("stale-input-field-value");
  });

  it("uses raw url only when videoInfo has no canonical URL", () => {
    const payload = buildSplitPayload({
      ...base,
      videoInfo: { title: "Track with no URL" },
      url: "https://example.com/raw-input",
    });
    expect(payload.url).toBe("https://example.com/raw-input");
  });

  it("uses raw url when videoInfo is null", () => {
    const payload = buildSplitPayload({
      ...base,
      videoInfo: null,
      url: "https://example.com/raw-input",
    });
    expect(payload.url).toBe("https://example.com/raw-input");
  });

  it("never includes 'filename' for the remote path", () => {
    const payload = buildSplitPayload({
      ...base,
      videoInfo: { loadedUrl: "https://cdn.example.com/persisted.mp4" },
      url: "https://example.com/raw",
    });
    expect((payload as any).filename).toBeUndefined();
  });

  it("loadedUrl takes priority over soundcloudUrl", () => {
    const payload = buildSplitPayload({
      ...base,
      videoInfo: {
        loadedUrl: "https://cdn.example.com/persisted.mp4",
        soundcloudUrl: "https://api.soundcloud.com/tracks/123/stream",
      },
      url: "https://example.com/stale",
    });
    expect(payload.url).toBe("https://cdn.example.com/persisted.mp4");
  });
});
