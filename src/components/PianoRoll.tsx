import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface Note {
  midi: number;
  time: number;
  duration: number;
  velocity: number;
}

interface Track {
  name: string;
  notes: Note[];
}

interface PianoRollProps {
  tracks: Track[];
  duration: number;
  currentTime?: number;
}

const TRACK_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500',
  'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'
];

export const PianoRoll: React.FC<PianoRollProps> = ({ tracks, duration, currentTime = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const minMidi = 21; // A0
  const maxMidi = 108; // C8
  const pitchRange = maxMidi - minMidi + 1;
  
  // Scale factor for time (pixels per second)
  const timeScale = 100;
  const width = Math.max(duration * timeScale, 800);
  const height = 300;
  const noteHeight = height / pitchRange;

  // Auto-scroll to follow playhead
  useEffect(() => {
    if (containerRef.current) {
      const playheadPos = currentTime * timeScale;
      const containerWidth = containerRef.current.clientWidth;
      const scrollPos = playheadPos - containerWidth / 2;
      
      containerRef.current.scrollLeft = Math.max(0, scrollPos);
    }
  }, [currentTime, timeScale]);

  return (
    <div 
      ref={containerRef}
      className="overflow-x-auto border border-foreground/20 rounded-xl bg-black/40 p-4 relative shadow-inner"
    >
      <div style={{ width: `${width}px`, height: `${height}px` }} className="relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE5LjUgMEwxOS41IDIwTTAgMTkuNUwyMCAxOS41IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')]">
        
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
          style={{ left: `${currentTime * timeScale}px`, transition: 'left 0.05s linear' }}
        />

        {tracks.map((track, trackIndex) => {
          const colorClass = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
          return track.notes.map((note, noteIndex) => (
            <motion.div
              key={`${trackIndex}-${noteIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`absolute rounded-sm border border-black/40 shadow-sm ${colorClass}`}
              style={{
                left: `${note.time * timeScale}px`,
                top: `${(maxMidi - note.midi) * noteHeight}px`,
                width: `${Math.max(note.duration * timeScale, 2)}px`,
                height: `${Math.max(noteHeight - 0.5, 2)}px`,
              }}
              title={`Track: ${track.name || trackIndex + 1} | Note: ${note.midi}`}
            />
          ));
        })}
      </div>
    </div>
  );
};
