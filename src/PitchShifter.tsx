import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

const PITCH_CLASSES = {
  'C': 0, 'Db': 1, 'C#': 1, 'D': 2, 'Eb': 3, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'Ab': 8, 'G#': 8, 'A': 9, 'Bb': 10, 'A#': 10, 'B': 11
};

const ALL_KEYS = Object.keys(PITCH_CLASSES);

export const PitchShifter = ({
  sourceKey, setSourceKey,
  sourceScale, setSourceScale,
  targetKey, setTargetKey,
  targetScale, setTargetScale
}: any) => {
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
    <div className="space-y-6 p-6 bg-black/5 dark:bg-black/20 rounded-xl border border-black/10 dark:border-white/10 backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full space-y-3">
          <label className="text-xs text-black/60 dark:text-white/60 uppercase font-bold tracking-wider">From Track</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-black/40 dark:text-white/40 uppercase mb-1 block">Key</label>
              <Select value={sourceKey} onValueChange={setSourceKey}>
                <SelectTrigger className="bg-black/5 dark:bg-black/40 border-black/10 dark:border-white/10 h-12 text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-black/40 dark:text-white/40 uppercase mb-1 block">Scale</label>
              <Select value={sourceScale} onValueChange={setSourceScale}>
                <SelectTrigger className="bg-black/5 dark:bg-black/40 border-black/10 dark:border-white/10 h-12 text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Major">Major</SelectItem>
                  <SelectItem value="Minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center justify-center mt-6">
          <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10">
            <ArrowRight className="w-5 h-5 text-black/40 dark:text-white/40" />
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          <label className="text-xs text-black/60 dark:text-white/60 uppercase font-bold tracking-wider">To Track</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-black/40 dark:text-white/40 uppercase mb-1 block">Key</label>
              <Select value={targetKey} onValueChange={setTargetKey}>
                <SelectTrigger className="bg-black/5 dark:bg-black/40 border-black/10 dark:border-white/10 h-12 text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-black/40 dark:text-white/40 uppercase mb-1 block">Scale</label>
              <Select value={targetScale} onValueChange={setTargetScale}>
                <SelectTrigger className="bg-black/5 dark:bg-black/40 border-black/10 dark:border-white/10 h-12 text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Major">Major</SelectItem>
                  <SelectItem value="Minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {shift && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-black/5 dark:bg-black/30 rounded-xl border border-black/10 dark:border-white/5 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-black/60 dark:text-zinc-400 uppercase tracking-wider mb-2">Direct Root Shift</span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-purple-600 dark:text-purple-400 text-4xl">
                {shift.rootShift > 0 ? '+' : ''}{shift.rootShift}
              </span>
              <span className="text-black/40 dark:text-zinc-500 font-medium">st</span>
            </div>
            <p className="text-[10px] text-black/40 dark:text-zinc-500 mt-2">Shifts root note exactly</p>
          </div>
          
          {sourceScale !== targetScale ? (
            <div className="p-5 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl border border-purple-500/20 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-purple-700/70 dark:text-purple-300/70 uppercase tracking-wider mb-2">Harmonic Mix (Relative)</span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-purple-600 dark:text-purple-400 text-4xl">
                  {shift.smartShift > 0 ? '+' : ''}{shift.smartShift}
                </span>
                <span className="text-purple-500/50 font-medium">st</span>
              </div>
              <p className="text-[10px] text-purple-600/60 dark:text-purple-400/60 mt-2">Matches relative major/minor</p>
            </div>
          ) : (
             <div className="p-5 bg-black/5 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 flex flex-col justify-center items-center text-center opacity-50">
              <span className="text-xs text-black/40 dark:text-zinc-500 uppercase tracking-wider mb-2">Harmonic Mix</span>
              <span className="text-sm text-black/40 dark:text-zinc-400 mt-2">Scales already match</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
