import { describe, it, expect } from "vitest";
import { frequencyToNote, autoCorrelate } from "../src/lib/pitch";

const SR = 44100;

function sine(freq: number, seconds = 0.05, amp = 0.8): Float32Array {
  const n = Math.floor(SR * seconds);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = amp * Math.sin((2 * Math.PI * freq * i) / SR);
  return buf;
}

describe("frequencyToNote", () => {
  it("maps A4 exactly at 440Hz reference", () => {
    const n = frequencyToNote(440, 440);
    expect(n.name).toBe("A");
    expect(n.octave).toBe(4);
    expect(n.cents).toBe(0);
  });

  it("respects a 432Hz reference", () => {
    const n = frequencyToNote(432, 432);
    expect(n.name).toBe("A");
    expect(n.octave).toBe(4);
    expect(n.cents).toBe(0);
    // 440Hz is sharp when A4=432
    expect(frequencyToNote(440, 432).cents).toBeGreaterThan(25);
  });

  it("maps C4 middle C", () => {
    const n = frequencyToNote(261.63, 440);
    expect(n.name).toBe("C");
    expect(n.octave).toBe(4);
    expect(Math.abs(n.cents)).toBeLessThanOrEqual(1);
  });

  it("reports sharp cents for 445Hz against A440", () => {
    const n = frequencyToNote(445, 440);
    expect(n.name).toBe("A");
    expect(n.cents).toBeGreaterThan(15);
    expect(n.cents).toBeLessThan(25);
  });

  it("wraps note names across octave boundary", () => {
    const n = frequencyToNote(493.88, 440); // B4
    expect(n.name).toBe("B");
    expect(n.octave).toBe(4);
  });
});

describe("autoCorrelate", () => {
  it("detects a 440Hz sine", () => {
    const f = autoCorrelate(sine(440), SR);
    expect(f).toBeGreaterThan(435);
    expect(f).toBeLessThan(445);
  });

  it("detects a 261.63Hz sine (C4)", () => {
    const f = autoCorrelate(sine(261.63), SR);
    expect(f).toBeGreaterThan(258);
    expect(f).toBeLessThan(265);
  });

  it("detects a low 110Hz sine (A2)", () => {
    const f = autoCorrelate(sine(110, 0.1), SR);
    expect(f).toBeGreaterThan(107);
    expect(f).toBeLessThan(113);
  });

  it("returns -1 for silence", () => {
    expect(autoCorrelate(new Float32Array(2048), SR)).toBe(-1);
  });

  it("returns -1 for very quiet noise", () => {
    const quiet = new Float32Array(2048).map(() => (Math.random() - 0.5) * 0.001);
    expect(autoCorrelate(quiet, SR)).toBe(-1);
  });
});
