import React from 'react';
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
}

export const PianoRoll: React.FC<PianoRollProps> = ({ tracks, duration }) => {
  const minMidi = 21; // A0
  const maxMidi = 108; // C8
  const pitchRange = maxMidi - minMidi + 1;
  
  // Scale factor for time (pixels per second)
  const timeScale = 100;
  const width = duration * timeScale;
  const height = 400;
  const noteHeight = height / pitchRange;

  return (
    <div className="overflow-x-auto border border-foreground/20 rounded-xl bg-black/20 p-4">
      <div style={{ width: `${width}px`, height: `${height}px` }} className="relative">
        {tracks.map((track, trackIndex) => (
          track.notes.map((note, noteIndex) => (
            <motion.div
              key={`${trackIndex}-${noteIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bg-primary/80 rounded-sm border border-primary-foreground/20"
              style={{
                left: `${note.time * timeScale}px`,
                top: `${(maxMidi - note.midi) * noteHeight}px`,
                width: `${note.duration * timeScale}px`,
                height: `${noteHeight - 1}px`,
              }}
            />
          ))
        ))}
      </div>
    </div>
  );
};
