import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

const PITCH_CLASSES = {
  'C': 0, 'Db': 1, 'C#': 1, 'D': 2, 'Eb': 3, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'Ab': 8, 'G#': 8, 'A': 9, 'Bb': 10, 'A#': 10, 'B': 11
};

const ALL_KEYS = Object.keys(PITCH_CLASSES);

export const PitchShifter = () => {
  const [sourceKey, setSourceKey] = useState('D');
  const [sourceScale, setSourceScale] = useState('Major');
  const [targetKey, setTargetKey] = useState('A');
  const [targetScale, setTargetScale] = useState('Minor');

  const calculateShift = () => {
    const srcPitch = PITCH_CLASSES[sourceKey as keyof typeof PITCH_CLASSES];
    const tgtPitch = PITCH_CLASSES[targetKey as keyof typeof PITCH_CLASSES];
    
    if (srcPitch === undefined || tgtPitch === undefined) return null;

    // Direct root shift
    let diff = tgtPitch - srcPitch;
    if (diff < -6) diff += 12;
    if (diff > 6) diff -= 12;

    // Smart mix (relative key matching)
    let smartDiff = diff;
    if (sourceScale === 'Major' && targetScale === 'Minor') {
      // Target is Minor. Its relative major is +3 semitones.
      smartDiff = (tgtPitch + 3) - srcPitch;
    } else if (sourceScale === 'Minor' && targetScale === 'Major') {
      // Target is Major. Its relative minor is -3 semitones.
      smartDiff = (tgtPitch - 3) - srcPitch;
    }
    
    // Normalize smartDiff
    smartDiff = smartDiff % 12;
    if (smartDiff < -6) smartDiff += 12;
    if (smartDiff > 6) smartDiff -= 12;

    return { rootShift: diff, smartShift: smartDiff };
  };

  const shift = calculateShift();

  return (
    <div className="space-y-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-xs text-zinc-500 uppercase font-bold">From Track</label>
          <div className="flex gap-2">
            <Select value={sourceKey} onValueChange={setSourceKey}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceScale} onValueChange={setSourceScale}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Major">Major</SelectItem>
                <SelectItem value="Minor">Minor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ArrowRight className="w-6 h-6 text-zinc-600 mt-6" />

        <div className="flex-1 space-y-2">
          <label className="text-xs text-zinc-500 uppercase font-bold">To Track</label>
          <div className="flex gap-2">
            <Select value={targetKey} onValueChange={setTargetKey}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={targetScale} onValueChange={setTargetScale}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Major">Major</SelectItem>
                <SelectItem value="Minor">Minor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {shift && (
        <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Direct Root Shift:</span>
            <span className="font-bold text-orange-400 text-lg">
              {shift.rootShift > 0 ? '+' : ''}{shift.rootShift} st
            </span>
          </div>
          {sourceScale !== targetScale && (
            <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
              <span className="text-sm text-zinc-400">Harmonic Mix (Match Relative):</span>
              <span className="font-bold text-blue-400 text-lg">
                {shift.smartShift > 0 ? '+' : ''}{shift.smartShift} st
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
