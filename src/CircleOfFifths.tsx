import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const keys = [
  { maj: 'C', min: 'Am', camMaj: '8B', camMin: '8A' },
  { maj: 'G', min: 'Em', camMaj: '9B', camMin: '9A' },
  { maj: 'D', min: 'Bm', camMaj: '10B', camMin: '10A' },
  { maj: 'A', min: 'F#m', camMaj: '11B', camMin: '11A' },
  { maj: 'E', min: 'C#m', camMaj: '12B', camMin: '12A' },
  { maj: 'B', min: 'G#m', camMaj: '1B', camMin: '1A' },
  { maj: 'F#', min: 'D#m', camMaj: '2B', camMin: '2A' },
  { maj: 'C#', min: 'A#m', camMaj: '3B', camMin: '3A' },
  { maj: 'G#', min: 'Fm', camMaj: '4B', camMin: '4A' },
  { maj: 'D#', min: 'Cm', camMaj: '5B', camMin: '5A' },
  { maj: 'A#', min: 'Gm', camMaj: '6B', camMin: '6A' },
  { maj: 'F', min: 'Dm', camMaj: '7B', camMin: '7A' },
];

/** Normalise flat spellings to sharps so they match the keys array (e.g. Db → C#). */
const normaliseKey = (k: string) =>
  k
    .replace('Db', 'C#')
    .replace('Eb', 'D#')
    .replace('Gb', 'F#')
    .replace('Ab', 'G#')
    .replace('Bb', 'A#');

interface CircleOfFifthsProps {
  onSetBaseKey?: (key: string, scale: string) => void;
  onSetTargetKey?: (key: string, scale: string) => void;
  /**
   * When provided, the matching key node on the circle gets an animated
   * highlight ring — used when navigating here from the Analyzer.
   */
  highlightKey?: { key: string; scale: string } | null;
  /** Called when the user interacts with the circle, clearing the external highlight. */
  onHighlightCleared?: () => void;
}

export const CircleOfFifths = ({
  onSetBaseKey,
  onSetTargetKey,
  highlightKey,
  onHighlightCleared,
}: CircleOfFifthsProps) => {
  const [mode, setMode] = useState<'musical' | 'camelot'>('musical');
  const [selectedKey, setSelectedKey] = useState<{ key: string; scale: string } | null>(null);
  // Internal pulse counter — used to re-trigger the entrance animation even
  // when the same key is sent a second time (same prop value = no re-render).
  const [pulseKey, setPulseKey] = useState(0);
  const prevHighlightRef = useRef<string | null>(null);

  // Re-trigger the animation when highlightKey changes.
  useEffect(() => {
    const next = highlightKey ? `${highlightKey.key}|${highlightKey.scale}` : null;
    if (next && next !== prevHighlightRef.current) {
      setPulseKey(k => k + 1);
    }
    prevHighlightRef.current = next;
  }, [highlightKey]);

  const normHighKey = highlightKey ? normaliseKey(highlightKey.key) : null;

  const handleUserClick = (key: string, scale: string) => {
    setSelectedKey({ key, scale });
    // Dismiss any externally-imposed highlight so the user's choice takes over.
    if (onHighlightCleared) onHighlightCleared();
  };

  return (
    <div className="w-full theme-card rounded-3xl p-8 flex flex-col lg:flex-row gap-12 items-center lg:items-start relative overflow-hidden">
      {/* Header / Toggle */}
      <div className="absolute top-6 left-8">
        <h2 className="text-xl font-bold">Circle of Fifths</h2>
      </div>
      <div className="absolute top-6 right-8 flex bg-black/10 dark:bg-white/10 rounded-full p-1">
        <button
          onClick={() => setMode('musical')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'musical' ? 'bg-foreground text-background' : 'opacity-60 hover:opacity-100'}`}
        >
          Musical
        </button>
        <button
          onClick={() => setMode('camelot')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'camelot' ? 'bg-foreground text-background' : 'opacity-60 hover:opacity-100'}`}
        >
          Camelot
        </button>
      </div>

      {/* Circle */}
      <div className="relative w-[340px] h-[340px] flex-shrink-0 mt-16 lg:mt-8">
        {keys.map((k, i) => {
          const angle = (i * 30) - 90;
          const rad = angle * (Math.PI / 180);
          const outerX = 50 + 42 * Math.cos(rad);
          const outerY = 50 + 42 * Math.sin(rad);
          const innerX = 50 + 22 * Math.cos(rad);
          const innerY = 50 + 22 * Math.sin(rad);

          const isMajSelected = selectedKey?.key === k.maj && selectedKey?.scale === 'Major';
          const isMinSelected = selectedKey?.key === k.min.replace('m', '') && selectedKey?.scale === 'Minor';

          // External highlight matching (from Analyzer → Composer jump)
          const isMajHighlighted =
            !!normHighKey &&
            normHighKey === k.maj &&
            highlightKey?.scale?.toLowerCase() === 'major';
          const isMinHighlighted =
            !!normHighKey &&
            normaliseKey(k.min.replace('m', '')) === normHighKey &&
            highlightKey?.scale?.toLowerCase() === 'minor';

          return (
            <React.Fragment key={i}>
              {/* Major key node */}
              <div
                onClick={() => handleUserClick(k.maj, 'Major')}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border flex items-center justify-center shadow-lg backdrop-blur-sm transition-all hover:scale-110 cursor-pointer ${
                  isMajSelected
                    ? 'bg-foreground text-background border-foreground scale-110 z-10'
                    : isMajHighlighted
                    ? 'bg-orange-500/20 dark:bg-orange-400/20 border-orange-400 text-foreground scale-110 z-10'
                    : 'bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/20 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
                style={{ left: `${outerX}%`, top: `${outerY}%` }}
              >
                {/* Animated pulse ring for highlighted major key */}
                <AnimatePresence>
                  {isMajHighlighted && (
                    <motion.span
                      key={`pulse-maj-${pulseKey}`}
                      className="absolute inset-0 rounded-full border-2 border-orange-400"
                      initial={{ scale: 1, opacity: 0.9 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </AnimatePresence>
                <span className="font-bold text-sm relative z-10">
                  {mode === 'musical' ? k.maj : k.camMaj}
                </span>
              </div>

              {/* Minor key node */}
              <div
                onClick={() => handleUserClick(k.min.replace('m', ''), 'Minor')}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full border flex items-center justify-center shadow-inner transition-all hover:scale-110 cursor-pointer ${
                  isMinSelected
                    ? 'bg-foreground/80 text-background border-foreground scale-110 z-10'
                    : isMinHighlighted
                    ? 'bg-orange-500/20 dark:bg-orange-400/20 border-orange-400 text-foreground scale-110 z-10'
                    : 'bg-black/10 dark:bg-white/10 border-black/5 dark:border-white/10 hover:bg-black/20 dark:hover:bg-white/20'
                }`}
                style={{ left: `${innerX}%`, top: `${innerY}%` }}
              >
                {/* Animated pulse ring for highlighted minor key */}
                <AnimatePresence>
                  {isMinHighlighted && (
                    <motion.span
                      key={`pulse-min-${pulseKey}`}
                      className="absolute inset-0 rounded-full border-2 border-orange-400"
                      initial={{ scale: 1, opacity: 0.9 }}
                      animate={{ scale: 1.7, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </AnimatePresence>
                <span className="font-semibold text-xs opacity-80 relative z-10">
                  {mode === 'musical' ? k.min : k.camMin}
                </span>
              </div>
            </React.Fragment>
          );
        })}

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 flex items-center justify-center text-center shadow-xl">
          <span className="text-[10px] font-medium opacity-60 leading-tight">Circle of<br/>Fifths</span>
        </div>
      </div>

      {/* Info Panels */}
      <div className="flex flex-col justify-center gap-4 w-full mt-8 lg:mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-foreground"></div>
              <h3 className="font-bold text-sm">Major Keys</h3>
            </div>
            <p className="text-xs opacity-60">Outer ring - Brighter, uplifting sound</p>
          </div>
          <div className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-foreground/80"></div>
              <h3 className="font-bold text-sm">Minor Keys</h3>
            </div>
            <p className="text-xs opacity-60">Inner ring - Darker, emotional sound</p>
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-2xl p-6 mt-2">
          <h3 className="font-bold text-sm mb-4">Harmonic Relationships</h3>
          <div className="space-y-3 text-xs">
            <div className="flex gap-2">
              <span className="font-bold min-w-[70px]">Adjacent:</span>
              <span className="opacity-70">Keys next to each other share 6 of 7 notes</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold min-w-[70px]">Relative:</span>
              <span className="opacity-70">Major/minor pairs share all 7 notes (same position)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold min-w-[70px]">Opposite:</span>
              <span className="opacity-70">Keys across the circle create tension (tritone)</span>
            </div>
          </div>
        </div>

        {/* Highlight label — shown when arriving from Analyzer */}
        <AnimatePresence>
          {highlightKey && !selectedKey && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="bg-orange-500/10 border border-orange-400/30 rounded-2xl p-4 mt-2"
            >
              <p className="text-xs font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                Detected key: {highlightKey.key} {highlightKey.scale}
              </p>
              <p className="text-[11px] opacity-60 mt-1">Click the highlighted node to set it as base or target key.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedKey && (
          <div className="bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 mt-2 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-sm mb-4">Selected: {selectedKey.key} {selectedKey.scale}</h3>
            <div className="flex gap-3">
              <button
                onClick={() => onSetBaseKey && onSetBaseKey(selectedKey.key, selectedKey.scale)}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-sm font-medium"
              >
                Set as Base Key
              </button>
              <button
                onClick={() => onSetTargetKey && onSetTargetKey(selectedKey.key, selectedKey.scale)}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-sm font-medium"
              >
                Set as Target Key
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
