// Chord progression data ported from ldrolez/free-midi-chords (MIT License)
// https://github.com/ldrolez/free-midi-chords
//
// Roman numerals resolved locally via music theory — no API calls needed.

export type ProgScale = 'Major' | 'Minor' | 'Modal';

export interface Progression {
  raw: string;       // space-separated Roman numeral tokens
  moods: string[];
  scale: ProgScale;
}

// ─── Progression Data ────────────────────────────────────────────────────────

const rawMajor: string[] = [
  "I I IV iii =Hopeful Nostalgic",
  "I I7 Idom7 IV =Relaxed Nostalgic",
  "I iii IV vi =Romantic Nostalgic",
  "I iii vi IV =Romantic Hopeful",
  "I IV ii V =Joyful Triumphant",
  "I IV V IV =Joyful Triumphant",
  "I IV V =Joyful Excited",
  "I IV vi V =Joyful Hopeful",
  "I IV vii iii vi ii V I =Romantic Triumphant",
  "I V I IV =Joyful Playful",
  "I V IV vi =Romantic Hopeful",
  "I V vi ii =Hopeful Romantic",
  "I V vi iii IV =Hopeful Joyful",
  "I V vi IV =Hopeful Romantic",
  "I V vi V =Hopeful Romantic",
  "I vi I IV =Tender Nostalgic",
  "I vi ii IV =Tender Nostalgic",
  "I vi ii V =Nostalgic Romantic",
  "I vi IV iii =Nostalgic Romantic",
  "I vi IV V =Romantic Hopeful",
  "I7 V7 viadd9 IV7 =Playful Joyful",
  "ii IV V =Hopeful",
  "ii IV vi V =Romantic",
  "ii V I =Triumphant",
  "ii V I IV =Hopeful Triumphant",
  "ii7 Vadd9 I7 =Triumphant",
  "iii vi IV I =Romantic Nostalgic",
  "iim7 V7 iiim7 vi7 iim7 V7 =Romantic Nostalgic",
  "IV I ii vi =Nostalgic Peaceful",
  "IV I iii IV =Playful Joyful",
  "IV I V vi =Joyful Romantic",
  "IV IV I V =Joyful Hopeful",
  "IV vi I V =Hopeful Romantic",
  "IV vi iii I =Nostalgic Playful",
  "IV vi IV vi =Nostalgic",
  "V I vi V =Hopeful Romantic",
  "V IV vi I =Hopeful Triumphant",
  "V vi IV I =Hopeful Romantic",
  "vi ii V I =Hopeful Romantic",
  "vi IV I V =Hopeful Romantic",
  "vi V IV V =Romantic Hopeful",
  "I IV Isus2 IV =Peaceful Hopeful",
  "I iii vi Isus4 =Tender Spiritual",
  "Isus2 I vi7 visus4 =Playful Romantic",
  "IV I IV6 Iadd9 =Relaxed Joyful",
  "I V vi iii IV I IV V =Hopeful Joyful",
  "vi V IV V ii V I I =Triumphant Hopeful",
  "vi IV iii V =Hopeful Romantic",
];

const rawMinor: string[] = [
  "i ii v i =Mysterious Triumphant",
  "i III iv VI =Nostalgic Romantic",
  "i III VII iv =Empowered Nostalgic",
  "i III VII VI =Nostalgic Romantic",
  "i iv III VI =Nostalgic Romantic",
  "i iv v iv =Mysterious Sad",
  "i iv v =Sad Lonely",
  "i iv VI v =Sad Hopeful",
  "i iv VII i =Sad Nostalgic",
  "i v iv VII =Sad Rebellious",
  "i VI III VII =Nostalgic Hopeful",
  "i VI iv ii =Sad Tender",
  "i VI iv III =Sad Nostalgic",
  "i VI iv v =Sad Hopeful",
  "i VI VII iv =Mysterious Nostalgic",
  "i VI VII v =Mysterious Rebellious",
  "i VI VII =Triumphant Rebellious",
  "i VII i v =Mysterious Nostalgic",
  "i VII III VI =Rebellious Triumphant",
  "i VII v VI =Mysterious Hopeful",
  "i VII VI III =Nostalgic Hopeful",
  "i VII VI iv =Sad Romantic",
  "i VII VI VII =Rebellious Triumphant",
  "i7 VI III7 VII6 i i7 III7 iv7 =Dark Nostalgic",
  "i7 VII VI7 iv7 =Nostalgic Romantic",
  "ii v i =Peaceful Hopeful",
  "ii v i iv =Peaceful Nostalgic",
  "ii VI i iv =Sad Hopeful",
  "im7 ivsus4 v7 isus4 =Mysterious Tender",
  "iv i v VI =Nostalgic Hopeful",
  "iv III VII i =Nostalgic Mysterious",
  "iv v VI VII =Mysterious Rebellious",
  "iv VI v VII =Mysterious Hopeful",
  "iv VI VII i =Triumphant",
  "v i iv VII =Dark Rebellious",
  "v IV i =Lonely",
  "v VI III i =Hopeful Nostalgic",
  "VI i v III =Hopeful Nostalgic",
  "VI III i v =Nostalgic Dark",
  "VI iv i v =Hopeful Tender",
  "VI VII i III =Triumphant Nostalgic",
  "VI VII v III =Rebellious Nostalgic",
  "VII iv v i =Mysterious Dark",
  "i ii v III i ii v VII =Mysterious Dramatic",
  "i iv VII v i i ii V =Mysterious Surprised",
  "i VI III VII i VI69 III7 VII =Mysterious Spiritual",
  "i VII i v III VII i v i =Mysterious Surprised",
  "i VII VI III iv VI VII i =Mysterious Surprised",
];

const rawModal: string[] = [
  "I bIIIM bVIIM I =Triumphant Rebellious",
  "I bIIIM bVIIM IV =Triumphant Mysterious",
  "I bIIIM bVIM bVIIM =Triumphant Hopeful",
  "I bIIIM IV I =Romantic",
  "I bVIIM bVIM IV IVsus4 IV =Hopeful Nostalgic",
  "I bVIIM IV V =Joyful Triumphant",
  "I bVIM bVIIM ivm =Empowered Nostalgic",
  "I IV bIIIM bVIM =Nostalgic Mysterious",
  "I IV bVIIM IV =Joyful Rebellious",
  "I IV V bVIIM =Triumphant Rebellious",
  "I V bVIIM IV =Triumphant Rebellious",
  "I IIIM vi V =Joyful Hopeful",
  "I IIM IV I =Joyful Triumphant",
  "im bIIIM bVIIM IV =Romantic Nostalgic",
  "im bIIIM bVIM V =Mysterious Triumphant",
  "im bIIIM IV bVIM =Mysterious Hopeful",
  "im bIIIM IV V =Mysterious Triumphant",
  "im bVIIM IV im =Nostalgic Mysterious",
  "im bVIM im IV =Nostalgic Hopeful",
  "im bVIM ivm V =Triumphant",
  "im ii vm IV =Nostalgic Hopeful",
  "im vm bVIM bIIM =Mysterious Hopeful",
  "im vm bVIIM IV =Hopeful Nostalgic",
  "im bIIM bIIIM bIIM =Mysterious Dark",
  "im bIIM ivm IIIM bIIM ivm IIIM IIIM =Mysterious Nostalgic",
  "vi IV I IIM =Hopeful Peaceful",
  "vi bVIM bVIIM I =Hopeful Triumphant",
  "I I7 Idom7 IV ivm I =Relaxed Nostalgic",
  "ii bVIIM7 I =Hopeful Triumphant",
  "bVIM bIIIM bVIIM IV I =Triumphant Mysterious",
  "IV V ii im bIIIM IV =Hopeful Nostalgic",
  "ivm bIIIM bVIM I =Cadence",
  "bIIIM V7 I =Cadence",
  "bVIIM V7 I =Cadence",
];

function parseRaw(raw: string, scale: ProgScale): Progression {
  const [pattern, moodStr] = raw.split(' =');
  const moods = moodStr
    ? moodStr.trim().split(' ').filter(m => m !== 'New')
    : [];
  return { raw: pattern.trim(), moods, scale };
}

export const PROGRESSIONS: Progression[] = [
  ...rawMajor.map(r => parseRaw(r, 'Major')),
  ...rawMinor.map(r => parseRaw(r, 'Minor')),
  ...rawModal.map(r => parseRaw(r, 'Modal')),
];

export const ALL_MOODS: string[] = [
  ...new Set(PROGRESSIONS.flatMap(p => p.moods)),
].sort();

// ─── Roman Numeral Resolver ───────────────────────────────────────────────────

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const KEY_NORM: Record<string, string> = {
  Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#',
};

// Semitone offsets for each scale degree (0-indexed)
const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 10];

const ROMAN_DEG: Record<string, number> = {
  I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6,
};

/** Map a suffix string + base quality to a Tonal-compatible chord type */
function mapSuffix(suffix: string, isUpper: boolean): string {
  if (!suffix) return isUpper ? '' : 'm';

  // Explicit quality overrides
  if (suffix === 'M' || suffix === 'maj') return '';
  if (suffix === 'm') return 'm';

  const table: Record<string, string> = {
    '7': isUpper ? '7' : 'm7',
    'M7': 'maj7', 'maj7': 'maj7',
    'm7': 'm7', 'mM7': 'mM7',
    'dom7': '7',
    'dim': 'dim', 'dim6': 'dim', 'dim7': 'dim7', 'vdim': 'dim',
    'aug': 'aug',
    'sus4': 'sus4', 'sus2': 'sus2',
    'add9': isUpper ? 'add9' : 'madd9',
    'madd9': 'madd9', 'madd4': 'madd4',
    '6': isUpper ? '6' : 'm6',
    'm6': 'm6', '6add9': '69',
    '69': '69', 'm69': 'm69',
    '9': isUpper ? '9' : 'm9',
    'M9': 'maj9', 'maj9': 'maj9', 'm9': 'm9',
    '7sus4': '7sus4', '9sus4': '9sus4',
    'm7-5': 'm7b5', 'm7b5': 'm7b5', 'm7b9b5': 'm7b5',
    'M-5': '',    // major flat-5 → simplify to major
    '7-5': '7b5', '7+5': 'aug7',
    '7-9': '7b9', '7b9': '7b9',
    '7+11': '7#11',
    'add4': 'add4', 'add11': 'add11',
    'sus4add9': 'sus4',
    'm7add11': 'm7', 'mM7add11': 'mM7',
    '5': '5',
    'ivsus4': 'sus4', // rare edge case
    '4': 'sus4',
  };

  if (suffix in table) return table[suffix];

  // Composite: starts with 'm' → minor family
  if (suffix.startsWith('m')) return 'm';

  // Unknown → fall back to base quality
  return isUpper ? '' : 'm';
}

/**
 * Resolve a single Roman numeral token (e.g. "bVIIm7", "IV", "i") to a
 * Tonal-compatible chord name (e.g. "Gm7", "F", "Am").
 * Returns null for rests ("X") and unparseable tokens.
 */
export function resolveToken(token: string, key: string, scale: ProgScale): string | null {
  if (!token || token === 'X') return null;

  let t = token;
  let shift = 0;
  while (t.startsWith('b')) { shift -= 1; t = t.slice(1); }
  while (t.startsWith('#')) { shift += 1; t = t.slice(1); }

  // Match longest Roman numeral first
  const romanRe = /^(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)/;
  const m = t.match(romanRe);
  if (!m) return null;

  const roman = m[1];
  const suffix = t.slice(roman.length);
  const isUpper = roman === roman.toUpperCase();
  const deg = ROMAN_DEG[roman.toUpperCase()];
  if (deg === undefined) return null;

  const offsets = scale === 'Minor' ? MINOR_OFFSETS : MAJOR_OFFSETS;
  const normKey = KEY_NORM[key] || key;
  const keyIdx = CHROMATIC.indexOf(normKey);
  if (keyIdx === -1) return null;

  const rootIdx = ((keyIdx + offsets[deg] + shift) % 12 + 12) % 12;
  const root = CHROMATIC[rootIdx];

  return root + mapSuffix(suffix, isUpper);
}

/**
 * Resolve a full progression string into an array of chord names,
 * repeated/trimmed to `bars` length.
 */
export function resolveProgression(
  raw: string,
  key: string,
  scale: ProgScale,
  bars: number,
): string[] {
  const tokens = raw.split(' ').filter(Boolean);
  const resolved = tokens
    .map(t => resolveToken(t, key, scale))
    .filter((c): c is string => c !== null && c.length > 0);

  if (resolved.length === 0) return Array(bars).fill(key);

  // Repeat to fill bars, then trim
  const out: string[] = [];
  while (out.length < bars) out.push(...resolved);
  return out.slice(0, bars);
}

/**
 * Pick a random progression matching the given scale and optional mood.
 * Falls back gracefully if no mood match found.
 */
export function pickProgression(
  scale: ProgScale,
  mood?: string,
): Progression {
  let pool = PROGRESSIONS.filter(p => p.scale === scale);

  if (mood && mood !== '') {
    const filtered = pool.filter(p =>
      p.moods.some(m => m.toLowerCase() === mood.toLowerCase()),
    );
    if (filtered.length > 0) pool = filtered;
  }

  if (pool.length === 0) pool = PROGRESSIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}
