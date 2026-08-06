/**
 * Unit tests for the pure bounce-export helpers in StemMixer.tsx.
 *
 * computeBounceFrameCount — trim length must equal the shortest loaded stem
 *   regardless of which stems are muted or soloed.
 *
 * applyFadeOut — last frame must reach exactly 0; first frame is unchanged.
 */

import { describe, it, expect } from "vitest";
import { computeBounceFrameCount, applyFadeOut } from "../src/components/StemMixer";

// ---------------------------------------------------------------------------
// Minimal AudioBuffer stub (only the fields our functions touch)
// ---------------------------------------------------------------------------

function makeBuffer(
  durationSecs: number,
  sampleRate = 44100,
  channels = 1,
  fill = 1.0,
): AudioBuffer {
  const length = Math.ceil(durationSecs * sampleRate);
  const channelData = Array.from({ length: channels }, () =>
    new Float32Array(length).fill(fill),
  );
  return {
    duration: durationSecs,
    length,
    numberOfChannels: channels,
    sampleRate,
    getChannelData: (c: number) => channelData[c],
  } as unknown as AudioBuffer;
}

function makeBufferMap(entries: [string, AudioBuffer][]): Map<string, AudioBuffer> {
  return new Map(entries);
}

// ---------------------------------------------------------------------------
// computeBounceFrameCount
// ---------------------------------------------------------------------------

describe("computeBounceFrameCount", () => {
  const SR = 44100;

  it("returns 0 for an empty map", () => {
    expect(computeBounceFrameCount(new Map(), SR)).toBe(0);
  });

  it("normal mix — returns shortest stem frame count", () => {
    const buffers = makeBufferMap([
      ["vocals", makeBuffer(10, SR)],
      ["drums",  makeBuffer(10.5, SR)],  // padded tail
      ["bass",   makeBuffer(11, SR)],    // padded tail
    ]);
    const expected = Math.ceil(10 * SR);
    expect(computeBounceFrameCount(buffers, SR)).toBe(expected);
  });

  it("muted-shortest — shortest stem still sets trim length even when muted", () => {
    // The caller only passes audible stems to the renderer, but
    // computeBounceFrameCount receives ALL loaded buffers, so muting
    // the shortest stem must not extend the export.
    const buffers = makeBufferMap([
      ["vocals", makeBuffer(10, SR)],    // ← this is the shortest
      ["drums",  makeBuffer(11, SR)],
    ]);
    // Simulate muting vocals by passing only drums to OfflineAudioContext,
    // but computeBounceFrameCount is called with ALL buffers.
    const frames = computeBounceFrameCount(buffers, SR);
    expect(frames).toBe(Math.ceil(10 * SR));
  });

  it("soloed-longest — shortest stem still sets trim length even when the longest is soloed", () => {
    const buffers = makeBufferMap([
      ["vocals", makeBuffer(9.8, SR)],
      ["drums",  makeBuffer(11.2, SR)],  // soloed — but trim should still be shortest
    ]);
    const frames = computeBounceFrameCount(buffers, SR);
    expect(frames).toBe(Math.ceil(9.8 * SR));
  });

  it("single stem — returns its exact frame count", () => {
    const buffers = makeBufferMap([["vocals", makeBuffer(4.5, SR)]]);
    expect(computeBounceFrameCount(buffers, SR)).toBe(Math.ceil(4.5 * SR));
  });
});

// ---------------------------------------------------------------------------
// applyFadeOut
// ---------------------------------------------------------------------------

describe("applyFadeOut", () => {
  it("last frame is exactly 0", () => {
    const buf = makeBuffer(1, 100, 1, 1.0); // 100 frames, all 1.0
    const fadeFrames = 10;
    const endFrame = buf.length - 1;
    applyFadeOut(buf, endFrame, fadeFrames);
    const data = buf.getChannelData(0);
    expect(data[endFrame]).toBe(0);
  });

  it("frame before the fade region is untouched", () => {
    const buf = makeBuffer(1, 100, 1, 0.8);
    const fadeFrames = 10;
    const endFrame = buf.length - 1;
    const fadeStart = endFrame - fadeFrames + 1;
    applyFadeOut(buf, endFrame, fadeFrames);
    const data = buf.getChannelData(0);
    // sample just before the fade must remain at 0.8
    expect(data[fadeStart - 1]).toBeCloseTo(0.8);
  });

  it("applies fade to every channel", () => {
    const buf = makeBuffer(0.1, 100, 2, 1.0); // 10 frames, 2 channels
    applyFadeOut(buf, buf.length - 1, buf.length);
    expect(buf.getChannelData(0)[buf.length - 1]).toBe(0);
    expect(buf.getChannelData(1)[buf.length - 1]).toBe(0);
  });

  it("noop when fadeFrames is 0", () => {
    const buf = makeBuffer(0.1, 100, 1, 0.5);
    applyFadeOut(buf, buf.length - 1, 0);
    // nothing should change
    const data = buf.getChannelData(0);
    expect(data.every((v) => v === 0.5)).toBe(true);
  });

  it("single-frame fade — frame is set to 0", () => {
    const buf = makeBuffer(0.1, 100, 1, 0.9);
    applyFadeOut(buf, buf.length - 1, 1);
    expect(buf.getChannelData(0)[buf.length - 1]).toBe(0);
  });
});
