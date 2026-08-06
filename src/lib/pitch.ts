/**
 * Pitch detection + note math for the chromatic tuner.
 * Pure functions — unit-tested, no Web Audio dependency here.
 */

export interface NoteInfo {
  /** Note name without octave, e.g. "A#" */
  name: string;
  /** Scientific pitch notation octave, e.g. 4 for A4 */
  octave: number;
  /** Deviation from the nearest equal-tempered note, -50…+50 */
  cents: number;
  /** Input frequency, echoed back */
  frequency: number;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Convert a frequency in Hz to the nearest note name + cents offset, relative to a tunable A4 reference. */
export function frequencyToNote(frequency: number, a4 = 440): NoteInfo {
  const midiFloat = 69 + 12 * Math.log2(frequency / a4);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { name, octave, cents, frequency };
}

/**
 * Estimate the fundamental frequency of a time-domain buffer via autocorrelation.
 * Returns Hz, or -1 when the signal is too quiet or no plausible pitch is found.
 * (Classic improved-autocorrelation approach: edge trim, first-dip then peak,
 * parabolic interpolation for sub-sample accuracy.)
 */
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  if (SIZE < 2) return -1;

  // Loudness gate — don't hallucinate notes from background noise.
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  // Trim low-amplitude edges so silence doesn't smear the correlation.
  const thres = 0.2;
  let r1 = 0;
  let r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) r1 = i;
    else break;
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) r2 = SIZE - i;
    else break;
  }
  const trimmed = buffer.slice(r1, r2 + 1);
  const N = trimmed.length;
  if (N < 2) return -1;

  // Autocorrelation.
  const c = new Float32Array(N);
  for (let lag = 0; lag < N; lag++) {
    let sum = 0;
    for (let j = 0; j < N - lag; j++) sum += trimmed[j] * trimmed[j + lag];
    c[lag] = sum;
  }

  // Skip the initial descent, then take the strongest peak.
  let d = 0;
  while (d < N - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < N; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  if (maxpos <= 0) return -1;

  // Parabolic interpolation around the peak for sub-sample precision.
  const x0 = c[maxpos - 1];
  const x1 = c[maxpos];
  const x2 = maxpos < N - 1 ? c[maxpos + 1] : x1;
  const a = (x0 + x2 - 2 * x1) / 2;
  const b = (x2 - x0) / 2;
  const T0 = a !== 0 ? maxpos - b / (2 * a) : maxpos;

  const freq = sampleRate / T0;
  // Plausible instrument/vocal range.
  if (freq < 40 || freq > 1400) return -1;
  return freq;
}
