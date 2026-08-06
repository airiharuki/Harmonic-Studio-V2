/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Loader2,
  Headphones,
  VolumeX,
  Volume2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export interface StemMixerStem {
  /** Stable stem id, e.g. "vocals" */
  name: string;
  /** Audio file URL */
  url: string;
  label?: React.ReactNode;
  icon?: React.ElementType;
}

/** Per-stem persistent mixer channel state (volume 0-100, mute, solo). */
export interface ChannelState {
  volume: number;
  mute: boolean;
  solo: boolean;
}

const DEFAULT_CHANNEL: ChannelState = { volume: 80, mute: false, solo: false };

const formatTime = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/** DAW gain law: mute wins; if any solo is active, only soloed stems sound. */
export function effectiveGain(ch: ChannelState, anySolo: boolean): number {
  if (ch.mute) return 0;
  if (anySolo && !ch.solo) return 0;
  return ch.volume / 100;
}

/**
 * Return the canonical export frame count for a bounce: the shortest stem
 * duration across ALL loaded buffers, converted to frames at the given sample
 * rate. This is intentionally independent of solo/mute so that muting or
 * soloing the shortest stem never extends the exported file to a padded tail.
 */
export function computeBounceFrameCount(
  buffers: Map<string, AudioBuffer>,
  sampleRate: number,
): number {
  if (buffers.size === 0) return 0;
  const minDuration = Math.min(...Array.from(buffers.values()).map((b) => b.duration));
  return Math.ceil(minDuration * sampleRate);
}

/**
 * Apply a linear fade-out over `fadeFrames` ending at `endFrame` (inclusive).
 * The last frame is multiplied by exactly 0. Mutates the buffer in-place.
 */
export function applyFadeOut(buffer: AudioBuffer, endFrame: number, fadeFrames: number): void {
  if (fadeFrames <= 0) return;
  const fadeStart = Math.max(0, endFrame - fadeFrames + 1);
  const steps = endFrame - fadeStart; // 0 when single-frame fade
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = fadeStart; i <= endFrame; i++) {
      // t=0 at fadeStart → t=1 at endFrame (last frame always → 0).
      const t = steps === 0 ? 1 : (i - fadeStart) / steps;
      data[i] *= 1 - t;
    }
  }
}

/** Encode an AudioBuffer to a 16-bit PCM WAV Blob. */
export function audioBufferToWav(buffer: AudioBuffer, frameCount?: number): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = Math.min(frameCount ?? buffer.length, buffer.length);
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = channels[c][i];
      s = Math.max(-1, Math.min(1, s));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export interface StemMixerProps {
  stems: StemMixerStem[];
  /**
   * Persistent channel states keyed by stem name — lifted so mixer settings
   * survive stem-variant switches and re-splits.
   */
  channels: Record<string, ChannelState>;
  onChannelsChange: React.Dispatch<React.SetStateAction<Record<string, ChannelState>>>;
  /** Basename for the bounced file, e.g. the track title. */
  exportName?: string;
  className?: string;
}

/**
 * Live stem mixer — per-stem volume / solo / mute, sample-accurate synced
 * playback through a single Web Audio clock, and offline bounce-to-WAV.
 */
export function StemMixer({
  stems,
  channels,
  onChannelsChange,
  exportName = "remix",
  className = "",
}: StemMixerProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const sourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainsRef = useRef<Map<string, GainNode>>(new Map());
  // Transport clock: position = (ctx.currentTime - startCtxTime) + startOffset
  const startCtxTimeRef = useRef(0);
  const startOffsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const generationRef = useRef(0);

  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bouncing, setBouncing] = useState(false);

  const anySolo = useMemo(
    () => stems.some((s) => (channels[s.name] ?? DEFAULT_CHANNEL).solo),
    [stems, channels],
  );

  const getChannel = useCallback(
    (name: string): ChannelState => channels[name] ?? DEFAULT_CHANNEL,
    [channels],
  );

  const stemsKey = stems.map((s) => s.url).join("|");

  // ── Load all stems as AudioBuffers whenever the stem set changes ──────────
  useEffect(() => {
    if (stems.length === 0) return;
    const generation = ++generationRef.current;
    let cancelled = false;

    setReady(false);
    setLoading(true);
    setLoadError(null);
    setPosition(0);
    startOffsetRef.current = 0;

    // Stop any playback from a previous stem set
    stopAllSources();
    isPlayingRef.current = false;
    setIsPlaying(false);

    const ctx =
      audioCtxRef.current ??
      new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    (async () => {
      try {
        const entries = await Promise.all(
          stems.map(async (stem) => {
            const res = await fetch(stem.url);
            if (!res.ok) throw new Error(`Failed to fetch ${stem.name} (${res.status})`);
            const arr = await res.arrayBuffer();
            const buf = await ctx.decodeAudioData(arr);
            return [stem.name, buf] as const;
          }),
        );
        if (cancelled || generation !== generationRef.current) return;
        const map = new Map(entries);
        buffersRef.current = map;
        const maxDur = Math.max(...entries.map(([, b]) => b.duration));
        setDuration(maxDur);
        setReady(true);
      } catch (e: any) {
        if (cancelled || generation !== generationRef.current) return;
        console.error("StemMixer load error:", e);
        setLoadError(e?.message ?? "Failed to load stems");
      } finally {
        if (!cancelled && generation === generationRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stemsKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllSources();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAllSources() {
    sourcesRef.current.forEach((src) => {
      try {
        src.onended = null;
        src.stop();
        src.disconnect();
      } catch {}
    });
    sourcesRef.current.clear();
    gainsRef.current.forEach((g) => {
      try {
        g.disconnect();
      } catch {}
    });
    gainsRef.current.clear();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  const currentPosition = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPlayingRef.current) return startOffsetRef.current;
    return ctx.currentTime - startCtxTimeRef.current + startOffsetRef.current;
  }, []);

  const tick = useCallback(() => {
    const pos = currentPosition();
    setPosition(Math.min(pos, duration));
    if (isPlayingRef.current) rafRef.current = requestAnimationFrame(tick);
  }, [currentPosition, duration]);

  const startPlayback = useCallback(
    async (offset: number) => {
      const ctx = audioCtxRef.current;
      if (!ctx || !ready) return;
      if (ctx.state === "suspended") await ctx.resume();

      stopAllSources();

      // Single clock: schedule every stem at the same context time
      const startAt = ctx.currentTime + 0.05;
      startCtxTimeRef.current = startAt;
      startOffsetRef.current = offset;

      const soloActive = stems.some((s) => getChannel(s.name).solo);
      let longestName: string | null = null;
      let longestDur = -1;

      stems.forEach((stem) => {
        const buf = buffersRef.current.get(stem.name);
        if (!buf) return;
        if (buf.duration > longestDur) {
          longestDur = buf.duration;
          longestName = stem.name;
        }
        const gain = ctx.createGain();
        gain.gain.value = effectiveGain(getChannel(stem.name), soloActive);
        gain.connect(ctx.destination);
        gainsRef.current.set(stem.name, gain);

        if (offset < buf.duration) {
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(gain);
          src.start(startAt, offset);
          sourcesRef.current.set(stem.name, src);
        }
      });

      // End-of-track detection via the longest stem
      const longestSrc = longestName ? sourcesRef.current.get(longestName) : null;
      if (longestSrc) {
        longestSrc.onended = () => {
          if (!isPlayingRef.current) return;
          isPlayingRef.current = false;
          setIsPlaying(false);
          startOffsetRef.current = 0;
          setPosition(0);
          stopAllSources();
        };
      }

      isPlayingRef.current = true;
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    },
    [ready, stems, getChannel, tick],
  );

  const pause = useCallback(() => {
    const pos = currentPosition();
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopAllSources();
    startOffsetRef.current = Math.min(pos, duration);
    setPosition(startOffsetRef.current);
  }, [currentPosition, duration]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopAllSources();
    startOffsetRef.current = 0;
    setPosition(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) pause();
    else startPlayback(startOffsetRef.current >= duration ? 0 : startOffsetRef.current);
  }, [pause, startPlayback, duration]);

  const seek = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(t, duration));
      if (isPlayingRef.current) {
        startPlayback(clamped);
      } else {
        startOffsetRef.current = clamped;
        setPosition(clamped);
      }
    },
    [duration, startPlayback],
  );

  // ── Apply live gain changes to running nodes ──────────────────────────────
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || gainsRef.current.size === 0) return;
    const soloActive = stems.some((s) => getChannel(s.name).solo);
    stems.forEach((stem) => {
      const gain = gainsRef.current.get(stem.name);
      if (!gain) return;
      const target = effectiveGain(getChannel(stem.name), soloActive);
      // Short ramp avoids zipper noise on slider moves and mute clicks
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(target, ctx.currentTime, 0.015);
    });
  }, [channels, stems, getChannel]);

  const updateChannel = useCallback(
    (name: string, patch: Partial<ChannelState>) => {
      onChannelsChange((prev) => ({
        ...prev,
        [name]: { ...(prev[name] ?? DEFAULT_CHANNEL), ...patch },
      }));
    },
    [onChannelsChange],
  );

  // ── Bounce: render current mix state offline to a WAV file ────────────────
  const bounce = useCallback(async () => {
    if (!ready || bouncing) return;
    setBouncing(true);
    try {
      const buffers = buffersRef.current;
      const soloActive = stems.some((s) => getChannel(s.name).solo);
      const audible = stems.filter(
        (s) => buffers.has(s.name) && effectiveGain(getChannel(s.name), soloActive) > 0,
      );
      if (audible.length === 0) {
        toast.error("Nothing to bounce — every stem is silent.");
        return;
      }
      const sampleRate = buffers.get(audible[0].name)!.sampleRate;
      const numChannels = Math.max(
        ...audible.map((s) => buffers.get(s.name)!.numberOfChannels),
      );
      const length = Math.ceil(
        Math.max(...audible.map((s) => buffers.get(s.name)!.duration)) * sampleRate,
      );
      const offline = new OfflineAudioContext(numChannels, length, sampleRate);
      audible.forEach((stem) => {
        const buf = buffers.get(stem.name)!;
        const gain = offline.createGain();
        gain.gain.value = effectiveGain(getChannel(stem.name), soloActive);
        gain.connect(offline.destination);
        const src = offline.createBufferSource();
        src.buffer = buf;
        src.connect(gain);
        src.start(0);
      });
      const rendered = await offline.startRendering();

      // Trim to shortest stem across ALL loaded buffers (see computeBounceFrameCount).
      const FADE_SECS = 0.08; // 80 ms linear fade-out
      const trimmedLength = Math.min(
        computeBounceFrameCount(buffers, rendered.sampleRate),
        rendered.length,
      );
      // Apply a short fade-out ending at the trim point so the export closes cleanly.
      const fadeFrames = Math.ceil(FADE_SECS * rendered.sampleRate);
      const fadeEnd = trimmedLength - 1;
      applyFadeOut(rendered, fadeEnd, Math.min(fadeFrames, trimmedLength));

      const wav = audioBufferToWav(rendered, trimmedLength);
      const url = URL.createObjectURL(wav);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportName.replace(/[^\w\s.-]/g, "").trim() || "remix"} (remix).wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast.success("Remix bounced! Download starting.");
    } catch (e: any) {
      console.error("Bounce failed:", e);
      toast.error(`Bounce failed: ${e?.message ?? e}`);
    } finally {
      setBouncing(false);
    }
  }, [ready, bouncing, stems, getChannel, exportName]);

  if (stems.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-4 bg-black/5 dark:bg-white/[0.04] ${className}`}
      data-testid="stem-mixer"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-xs font-bold opacity-40 uppercase tracking-wider">
          Stem Mixer
        </h4>
        <Button
          size="sm"
          onClick={bounce}
          disabled={!ready || bouncing}
          className="bg-foreground hover:bg-foreground/90 text-background font-bold rounded-xl gap-1.5 h-8"
          data-testid="button-bounce-remix"
        >
          {bouncing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Bounce Remix
        </Button>
      </div>

      {loadError ? (
        <p className="text-xs text-red-400">Mixer unavailable: {loadError}</p>
      ) : (
        <>
          {/* Transport */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
              disabled={!ready}
              aria-label={isPlaying ? "Pause mix" : "Play mix"}
              className="w-10 h-10 rounded-full bg-foreground text-background hover:bg-foreground/90 shrink-0 disabled:opacity-40"
              data-testid="button-mixer-play"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={stop}
              disabled={!ready || (!isPlaying && position === 0)}
              aria-label="Stop"
              className="w-8 h-8 rounded-full shrink-0 disabled:opacity-30"
              data-testid="button-mixer-stop"
            >
              <Square className="w-3 h-3" />
            </Button>
            <span className="text-[10px] font-mono opacity-50 font-bold shrink-0 w-10 text-right">
              {formatTime(position)}
            </span>
            <Slider
              value={[duration > 0 ? (position / duration) * 100 : 0]}
              onValueChange={(val) => seek((val[0] / 100) * duration)}
              max={100}
              step={0.1}
              disabled={!ready}
              className="flex-1 touch-none"
              aria-label="Seek"
              data-testid="slider-mixer-seek"
            />
            <span className="text-[10px] font-mono opacity-50 font-bold shrink-0 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Channel strips */}
          <div className="space-y-3">
            {stems.map((stem) => {
              const ch = getChannel(stem.name);
              const audible = effectiveGain(ch, anySolo) > 0;
              const Icon = stem.icon;
              return (
                <div
                  key={stem.name}
                  className={`flex items-center gap-2 sm:gap-3 transition-opacity ${audible ? "" : "opacity-45"}`}
                  data-testid={`mixer-channel-${stem.name}`}
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold w-20 sm:w-28 shrink-0 truncate opacity-70">
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{stem.label ?? stem.name}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateChannel(stem.name, { solo: !ch.solo })}
                    aria-label={`Solo ${stem.name}`}
                    aria-pressed={ch.solo}
                    title="Solo"
                    className={`w-8 h-8 rounded-lg shrink-0 text-[10px] font-bold ${
                      ch.solo
                        ? "bg-yellow-400/90 text-black border-yellow-400 hover:bg-yellow-400"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    data-testid={`button-solo-${stem.name}`}
                  >
                    <Headphones className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateChannel(stem.name, { mute: !ch.mute })}
                    aria-label={`Mute ${stem.name}`}
                    aria-pressed={ch.mute}
                    title="Mute"
                    className={`w-8 h-8 rounded-lg shrink-0 ${
                      ch.mute
                        ? "bg-red-500/90 text-white border-red-500 hover:bg-red-500"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    data-testid={`button-mute-${stem.name}`}
                  >
                    {ch.mute ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Slider
                    value={[ch.volume]}
                    onValueChange={(val) => updateChannel(stem.name, { volume: val[0] })}
                    max={100}
                    step={1}
                    className="flex-1 touch-none"
                    aria-label={`${stem.name} volume`}
                    data-testid={`slider-volume-${stem.name}`}
                  />
                  <span className="text-[10px] font-mono opacity-40 w-8 text-right shrink-0">
                    {ch.volume}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default StemMixer;
