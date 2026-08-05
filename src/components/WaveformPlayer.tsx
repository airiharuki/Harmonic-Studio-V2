/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

const formatTime = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/** Read the app's holographic palette straight off the live CSS variables so
 *  the waveform always matches the active theme (light/dark/beta). */
function readPalette() {
  const style = getComputedStyle(document.body);
  const pick = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    cyan: pick("--iris-cyan", "rgba(125, 211, 252, 1)"),
    violet: pick("--iris-violet", "rgba(167, 139, 250, 1)"),
    rose: pick("--iris-rose", "rgba(249, 168, 212, 1)"),
  };
}

/** rgba(...) → rgba with a new alpha */
function withAlpha(color: string, alpha: number): string {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return color;
  const parts = m[1].split(",").map((p) => p.trim());
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function makeGradient(
  colors: { cyan: string; violet: string; rose: string },
  alpha: number,
  height: number,
): CanvasGradient | string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return withAlpha(colors.violet, alpha);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, withAlpha(colors.cyan, alpha));
    gradient.addColorStop(0.5, withAlpha(colors.violet, alpha));
    gradient.addColorStop(1, withAlpha(colors.rose, alpha));
    return gradient;
  } catch {
    return withAlpha(colors.violet, alpha);
  }
}

export interface WaveformPlayerProps {
  /** Audio source — blob URL or server URL */
  url: string;
  /** Known BPM from analysis — renders bar gridlines when provided */
  bpm?: number | null;
  /** Waveform height in px (default 72; use ~48 for compact stem rows) */
  height?: number;
  /** Optional label rendered to the left of the transport */
  label?: React.ReactNode;
  className?: string;
}

/**
 * Frosted / holographic themed WaveSurfer player.
 * - Click anywhere on the waveform to seek; playhead animates during playback.
 * - BPM bar-gridlines overlay when analysis data is available.
 * - Falls back to a plain <audio controls> element if rendering fails.
 */
export function WaveformPlayer({
  url,
  bpm,
  height = 72,
  label,
  className = "",
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const { resolvedTheme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    setIsReady(false);
    setFailed(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    let ws: WaveSurfer | null = null;
    try {
      const palette = readPalette();
      ws = WaveSurfer.create({
        container: containerRef.current,
        url,
        height,
        waveColor: makeGradient(palette, 0.45, height) as any,
        progressColor: makeGradient(palette, 0.95, height) as any,
        cursorColor: withAlpha(palette.violet, 0.95),
        cursorWidth: 1,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        dragToSeek: true,
      });
    } catch (e) {
      console.error("WaveSurfer init failed:", e);
      setFailed(true);
      return;
    }

    wavesurferRef.current = ws;
    ws.on("ready", () => {
      setIsReady(true);
      setDuration(ws!.getDuration());
    });
    ws.on("timeupdate", (t) => setCurrentTime(t));
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));
    ws.on("error", (err) => {
      console.error("WaveSurfer error:", err);
      setFailed(true);
    });

    return () => {
      try {
        ws?.destroy();
      } catch {}
      wavesurferRef.current = null;
    };
    // Recreate when the source or active theme changes so gradient colors
    // always match the current palette.
  }, [url, height, resolvedTheme]);

  const togglePlay = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  // ── Plain-player fallback ────────────────────────────────────────────────
  if (failed) {
    return (
      <div className={`space-y-1 ${className}`}>
        {label && <div className="text-xs font-bold opacity-60">{label}</div>}
        <audio src={url} controls className="w-full h-10" />
      </div>
    );
  }

  // Bar gridlines: one line per bar (4 beats), only when BPM + duration known
  const barLines: number[] = [];
  if (bpm && bpm > 0 && duration > 0) {
    const barSec = (60 / bpm) * 4;
    const count = Math.floor(duration / barSec);
    if (count > 0 && count <= 400) {
      for (let i = 1; i <= count; i++) barLines.push((i * barSec) / duration);
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          disabled={!isReady}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="w-10 h-10 rounded-full bg-foreground text-background hover:bg-foreground/90 shrink-0 disabled:opacity-40"
        >
          {!isReady ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex justify-between text-[10px] font-mono opacity-50 uppercase font-bold">
            <span className="truncate pr-2">{label ?? formatTime(currentTime)}</span>
            <span className="shrink-0">
              {label ? `${formatTime(currentTime)} / ` : ""}
              {formatTime(duration)}
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/[0.04] backdrop-blur-sm">
            {/* BPM bar gridlines — behind the waveform, non-interactive */}
            {barLines.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
                {barLines.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-black/10 dark:bg-white/10"
                    style={{ left: `${pos * 100}%` }}
                  />
                ))}
              </div>
            )}
            <div
              ref={containerRef}
              className="relative z-10 cursor-pointer px-1"
              style={{ minHeight: height }}
            />
            {!isReady && (
              <div className="absolute inset-0 z-20 flex items-center justify-center text-[10px] font-mono uppercase tracking-wider opacity-50">
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                Rendering waveform…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaveformPlayer;
