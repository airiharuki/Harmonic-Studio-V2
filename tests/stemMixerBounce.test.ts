/**
 * Unit tests for the pure bounce-export helpers in StemMixer.tsx.
 *
 * computeBounceFrameCount — trim length must equal the shortest loaded stem
 *   regardless of which stems are muted or soloed.
 *
 * applyFadeOut — last frame must reach exactly 0; first frame is unchanged.
 */

import { describe, it, expect } from "vitest";
import {
  computeBounceFrameCount,
  applyFadeOut,
  effectiveGain,
  audioBufferToWav,
} from "../src/components/StemMixer";
import type { ChannelState } from "../src/components/StemMixer";

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

// ---------------------------------------------------------------------------
// effectiveGain — DAW gain law: mute wins; solo isolates; multiple solos stack
// ---------------------------------------------------------------------------

describe("effectiveGain", () => {
  const ch = (volume: number, mute: boolean, solo: boolean): ChannelState => ({
    volume,
    mute,
    solo,
  });

  it("normal stem, no solo active → volume / 100", () => {
    expect(effectiveGain(ch(80, false, false), false)).toBeCloseTo(0.8);
  });

  it("full volume (100) with no solo → 1.0", () => {
    expect(effectiveGain(ch(100, false, false), false)).toBe(1.0);
  });

  it("zero volume with no solo → 0", () => {
    expect(effectiveGain(ch(0, false, false), false)).toBe(0);
  });

  it("muted stem → 0 regardless of volume", () => {
    expect(effectiveGain(ch(100, true, false), false)).toBe(0);
  });

  it("muted stem → 0 even when solo is active globally", () => {
    // mute wins over solo
    expect(effectiveGain(ch(100, true, true), true)).toBe(0);
  });

  it("muted stem → 0 even when the stem itself is soloed", () => {
    expect(effectiveGain(ch(80, true, true), true)).toBe(0);
  });

  it("solo active, non-soloed stem → 0 (silenced)", () => {
    expect(effectiveGain(ch(90, false, false), true)).toBe(0);
  });

  it("solo active, soloed stem → volume / 100 (passes through)", () => {
    expect(effectiveGain(ch(60, false, true), true)).toBeCloseTo(0.6);
  });

  it("multiple solos — each soloed stem sounds at its own volume", () => {
    // anySolo = true; both stems are soloed → both get volume / 100
    expect(effectiveGain(ch(50, false, true), true)).toBeCloseTo(0.5);
    expect(effectiveGain(ch(75, false, true), true)).toBeCloseTo(0.75);
  });

  it("no solo active, non-solo flag on stem is ignored → volume / 100", () => {
    // solo flag on channel doesn't matter when no global solo
    expect(effectiveGain(ch(70, false, true), false)).toBeCloseTo(0.7);
  });
});

// ---------------------------------------------------------------------------
// audioBufferToWav — RIFF/WAVE header integrity and data size
// ---------------------------------------------------------------------------

describe("audioBufferToWav", () => {
  async function blobToDataView(blob: Blob): Promise<DataView> {
    const ab = await blob.arrayBuffer();
    return new DataView(ab);
  }

  function readString(view: DataView, offset: number, length: number): string {
    let s = "";
    for (let i = 0; i < length; i++) s += String.fromCharCode(view.getUint8(offset + i));
    return s;
  }

  it("writes RIFF and WAVE markers", async () => {
    const buf = makeBuffer(0.1, 44100, 1, 0.5);
    const blob = audioBufferToWav(buf);
    const view = await blobToDataView(blob);
    expect(readString(view, 0, 4)).toBe("RIFF");
    expect(readString(view, 8, 4)).toBe("WAVE");
    expect(readString(view, 12, 4)).toBe("fmt ");
    expect(readString(view, 36, 4)).toBe("data");
  });

  it("audio/wav MIME type", () => {
    const buf = makeBuffer(0.1, 44100, 1);
    const blob = audioBufferToWav(buf);
    expect(blob.type).toBe("audio/wav");
  });

  it("PCM format tag is 1", async () => {
    const buf = makeBuffer(0.1, 44100, 1);
    const blob = audioBufferToWav(buf);
    const view = await blobToDataView(blob);
    expect(view.getUint16(20, true)).toBe(1); // AudioFormat = PCM
  });

  it("channel count matches buffer", async () => {
    const buf = makeBuffer(0.1, 44100, 2);
    const blob = audioBufferToWav(buf);
    const view = await blobToDataView(blob);
    expect(view.getUint16(22, true)).toBe(2);
  });

  it("sample rate matches buffer", async () => {
    const buf = makeBuffer(0.1, 48000, 1);
    const blob = audioBufferToWav(buf);
    const view = await blobToDataView(blob);
    expect(view.getUint32(24, true)).toBe(48000);
  });

  it("blob size = 44 header + 2 bytes × frames × channels (full buffer)", async () => {
    const SR = 44100;
    const durationSecs = 0.1;
    const numChannels = 2;
    const buf = makeBuffer(durationSecs, SR, numChannels);
    const blob = audioBufferToWav(buf);
    const expectedDataBytes = buf.length * numChannels * 2;
    expect(blob.size).toBe(44 + expectedDataBytes);
  });

  it("frameCount trims output — blob size matches trimmed frame count", async () => {
    const buf = makeBuffer(1, 44100, 1); // 44100 frames
    const trimFrames = 1000;
    const blob = audioBufferToWav(buf, trimFrames);
    expect(blob.size).toBe(44 + trimFrames * 1 * 2);
  });

  it("data chunk size field matches actual data bytes", async () => {
    const buf = makeBuffer(0.05, 44100, 1);
    const blob = audioBufferToWav(buf);
    const view = await blobToDataView(blob);
    const dataSize = view.getUint32(40, true);
    expect(blob.size).toBe(44 + dataSize);
  });

  it("RIFF chunk size = blob size - 8", async () => {
    const buf = makeBuffer(0.05, 44100, 2);
    const blob = audioBufferToWav(buf);
    const view = await blobToDataView(blob);
    const riffSize = view.getUint32(4, true);
    expect(riffSize).toBe(blob.size - 8);
  });

  it("clamps +1.5 sample to max positive int16 (0x7fff)", async () => {
    const length = 1;
    const channelData = [new Float32Array([1.5])]; // over full-scale
    const buf: AudioBuffer = {
      duration: length / 44100,
      length,
      numberOfChannels: 1,
      sampleRate: 44100,
      getChannelData: (c: number) => channelData[c],
    } as unknown as AudioBuffer;
    const blob = audioBufferToWav(buf);
    const view = await blobToDataView(blob);
    expect(view.getInt16(44, true)).toBe(0x7fff);
  });

  it("clamps -1.5 sample to min negative int16 (-0x8000)", async () => {
    const length = 1;
    const channelData = [new Float32Array([-1.5])];
    const buf: AudioBuffer = {
      duration: length / 44100,
      length,
      numberOfChannels: 1,
      sampleRate: 44100,
      getChannelData: (c: number) => channelData[c],
    } as unknown as AudioBuffer;
    const blob = audioBufferToWav(buf);
    const view = await blobToDataView(blob);
    expect(view.getInt16(44, true)).toBe(-0x8000);
  });
});
