/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Chromatic metronome — Web Audio API lookahead scheduler (drift-free),
 * tap tempo, time signature selector, spring-animated beat indicators.
 */

import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Scheduler constants ──────────────────────────────────────────────────────
const SCHEDULE_AHEAD_SEC = 0.12; // schedule notes this far ahead
const TIMER_INTERVAL_MS  = 25;   // wake up every 25 ms to schedule

const TIME_SIGS = [
  { label: "4/4", beats: 4 },
  { label: "3/4", beats: 3 },
  { label: "6/8", beats: 6 },
  { label: "5/4", beats: 5 },
] as const;

interface QueuedNote {
  beat: number;   // 0 = downbeat
  time: number;   // AudioContext.currentTime when the click fires
}

// ── Component ────────────────────────────────────────────────────────────────
export function Metronome() {
  const [bpm, setBpm]             = useState(120);
  const [timeSigIdx, setTimeSigIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);

  // Keep mutable refs in sync so the scheduler closure always reads fresh values
  const bpmRef      = useRef(bpm);
  const beatsRef    = useRef(TIME_SIGS[0].beats as number);
  useEffect(() => { bpmRef.current   = bpm; },                       [bpm]);
  useEffect(() => { beatsRef.current = TIME_SIGS[timeSigIdx].beats; }, [timeSigIdx]);

  const audioCtxRef      = useRef<AudioContext | null>(null);
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextNoteTimeRef  = useRef(0);
  const beatCountRef     = useRef(0);
  const queueRef         = useRef<QueuedNote[]>([]);
  const rafRef           = useRef<number | null>(null);
  const tapTimesRef      = useRef<number[]>([]);

  // ── Click sound ─────────────────────────────────────────────────────────
  const scheduleClick = useCallback((beat: number, time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Downbeat: higher pitch + louder
    osc.frequency.value = beat === 0 ? 1000 : 500;
    const volume = beat === 0 ? 0.75 : 0.45;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.1);

    queueRef.current.push({ beat, time });
  }, []);

  // ── Lookahead scheduler ──────────────────────────────────────────────────
  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      const beat = beatCountRef.current % beatsRef.current;
      scheduleClick(beat, nextNoteTimeRef.current);
      nextNoteTimeRef.current += 60 / bpmRef.current;
      beatCountRef.current++;
    }
    timerRef.current = setTimeout(scheduler, TIMER_INTERVAL_MS);
  }, [scheduleClick]);

  // ── RAF loop: advance visual beat indicator ──────────────────────────────
  useEffect(() => {
    if (!isPlaying) {
      setCurrentBeat(-1);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const q = queueRef.current;
      while (q.length && q[0].time <= ctx.currentTime) {
        setCurrentBeat(q[0].beat);
        q.shift();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close();
  }, []);

  // ── Controls ─────────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    beatCountRef.current   = 0;
    queueRef.current       = [];
    nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
    setIsPlaying(true);
    scheduler();
  }, [scheduler]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => (isPlaying ? stop() : start()), [isPlaying, start, stop]);

  const tapTempo = useCallback(() => {
    const now  = performance.now();
    const taps = tapTimesRef.current;
    // Drop taps older than 3 s (user paused)
    const fresh = taps.filter((t) => now - t < 3000);
    fresh.push(now);
    if (fresh.length > 6) fresh.shift();
    tapTimesRef.current = fresh;
    if (fresh.length >= 2) {
      const intervals = fresh.slice(1).map((t, i) => t - fresh[i]);
      const avg = intervals.reduce((a, b) => a + b) / intervals.length;
      setBpm(Math.max(20, Math.min(300, Math.round(60_000 / avg))));
    }
  }, []);

  const changeSig = useCallback((idx: number) => {
    setTimeSigIdx(idx);
    if (isPlaying) stop();
  }, [isPlaying, stop]);

  const beats = TIME_SIGS[timeSigIdx].beats;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-sm mx-auto space-y-10 select-none">

      {/* BPM readout */}
      <div className="text-center space-y-1">
        <motion.div
          key={bpm}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-8xl font-black font-mono tabular-nums tracking-tight"
        >
          {bpm}
        </motion.div>
        <div className="text-xs font-bold uppercase tracking-[0.25em] opacity-40">BPM</div>

        <div className="flex items-center justify-center gap-3 pt-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-9 h-9"
            onClick={() => setBpm((b) => Math.max(20, b - 1))}
            onMouseDown={(e) => e.preventDefault()}
          >
            −
          </Button>
          <input
            type="range"
            min={20}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-44 accent-violet-500 cursor-pointer"
          />
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-9 h-9"
            onClick={() => setBpm((b) => Math.min(300, b + 1))}
            onMouseDown={(e) => e.preventDefault()}
          >
            +
          </Button>
        </div>
      </div>

      {/* Beat indicators */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: beats }).map((_, i) => {
          const active = currentBeat === i;
          const isDown = i === 0;
          return (
            <motion.div
              key={i}
              animate={{
                scale:   active ? 1.45 : 1,
                opacity: active ? 1    : isPlaying ? 0.3 : 0.5,
              }}
              transition={{ type: "spring", stiffness: 700, damping: 18 }}
              className={[
                "w-10 h-10 rounded-full border-2 transition-colors",
                isDown
                  ? active
                    ? "border-violet-400 bg-violet-500 shadow-lg shadow-violet-500/50"
                    : "border-violet-400/50 bg-violet-500/10"
                  : active
                    ? "border-white/80 bg-white/60 dark:bg-white/40"
                    : "border-white/20 bg-white/5",
              ].join(" ")}
            />
          );
        })}
      </div>

      {/* Time signature */}
      <div className="flex justify-center gap-2">
        {TIME_SIGS.map((ts, i) => (
          <Button
            key={ts.label}
            size="sm"
            variant={timeSigIdx === i ? "default" : "outline"}
            onClick={() => changeSig(i)}
            className="w-14 font-mono"
          >
            {ts.label}
          </Button>
        ))}
      </div>

      {/* Start / Stop + Tap */}
      <div className="flex gap-3 justify-center">
        <Button
          size="lg"
          onClick={toggle}
          className="w-32 gap-2 font-semibold"
        >
          {isPlaying
            ? <><Square className="w-4 h-4" /> Stop</>
            : <><Play  className="w-4 h-4 ml-0.5" /> Start</>}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={tapTempo}
          className="w-32 font-semibold"
        >
          Tap
        </Button>
      </div>

      {/* Hint */}
      <p className="text-center text-[10px] font-mono opacity-30 uppercase tracking-widest">
        Tap the button to detect tempo · adjust the slider to fine-tune
      </p>
    </div>
  );
}

export default Metronome;
