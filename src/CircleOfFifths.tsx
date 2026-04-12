import React from 'react';

const keys = [
  { maj: 'C', min: 'Am', camMaj: '8B', camMin: '8A' },
  { maj: 'G', min: 'Em', camMaj: '9B', camMin: '9A' },
  { maj: 'D', min: 'Bm', camMaj: '10B', camMin: '10A' },
  { maj: 'A', min: 'F#m', camMaj: '11B', camMin: '11A' },
  { maj: 'E', min: 'C#m', camMaj: '12B', camMin: '12A' },
  { maj: 'B', min: 'G#m', camMaj: '1B', camMin: '1A' },
  { maj: 'F#', min: 'D#m', camMaj: '2B', camMin: '2A' },
  { maj: 'Db', min: 'Bbm', camMaj: '3B', camMin: '3A' },
  { maj: 'Ab', min: 'Fm', camMaj: '4B', camMin: '4A' },
  { maj: 'Eb', min: 'Cm', camMaj: '5B', camMin: '5A' },
  { maj: 'Bb', min: 'Gm', camMaj: '6B', camMin: '6A' },
  { maj: 'F', min: 'Dm', camMaj: '7B', camMin: '7A' },
];

export const CircleOfFifths = () => {
  return (
    <div className="relative w-64 h-64 mx-auto rounded-full border-4 border-zinc-800 bg-zinc-900/50 flex items-center justify-center">
      {keys.map((k, i) => {
        const angle = (i * 30) - 90; // Start C at top
        const rad = angle * (Math.PI / 180);
        const outerX = 50 + 40 * Math.cos(rad);
        const outerY = 50 + 40 * Math.sin(rad);
        const innerX = 50 + 20 * Math.cos(rad);
        const innerY = 50 + 20 * Math.sin(rad);
        
        return (
          <React.Fragment key={i}>
            <div 
              className="absolute text-center transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${outerX}%`, top: `${outerY}%` }}
            >
              <div className="font-bold text-orange-400 text-sm">{k.maj}</div>
              <div className="text-[10px] text-zinc-500">{k.camMaj}</div>
            </div>
            <div 
              className="absolute text-center transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${innerX}%`, top: `${innerY}%` }}
            >
              <div className="font-bold text-blue-400 text-xs">{k.min}</div>
              <div className="text-[9px] text-zinc-500">{k.camMin}</div>
            </div>
          </React.Fragment>
        );
      })}
      <div className="absolute w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 text-center leading-tight">
        Circle of<br/>Fifths
      </div>
    </div>
  );
};
