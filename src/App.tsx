/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Music, 
  Scissors, 
  Search, 
  Loader2, 
  Play, 
  Pause, 
  Square,
  Info,
  ChevronRight,
  BarChart3,
  Mic2,
  Drum,
  Guitar,
  Piano,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  Repeat,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  History,
  Hand,
  ChevronsUp,
  ChevronsDown,
  Music2,
  Users,
  Github
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { ThemeProvider, useTheme } from "next-themes";
import axios from "axios";
import { CircleOfFifths } from "./CircleOfFifths";
import { PitchShifter } from "./PitchShifter";
import { Chord, Note, Key } from "tonal";
import { Midi } from "@tonejs/midi";
import { PianoRoll } from "./components/PianoRoll";
import { RecentTracksButton, RecentTracksPanel } from "./components/RecentTracks";
import { WaveformPlayer } from "./components/WaveformPlayer";
import { StemMixer, type ChannelState } from "./components/StemMixer";
import { WelcomeSplash } from "./components/WelcomeSplash";
import { Tuner } from "./components/Tuner";
import { Metronome } from "./components/Metronome";
import { StepProgress, type SplitStep } from "./components/StepProgress";
import { addRecentTrack, extractTokenFromUrl } from "@/lib/recentTracks";
import { GoogleGenAI, Type } from "@google/genai";
import { pickProgression, resolveProgression, ALL_MOODS, type ProgScale } from './chordProgressions';
import { 
  createSoundFont2SynthNode, 
  type SoundFont2SynthNode 
} from 'sf2-synth-audio-worklet';
import {
  LatestRunGate,
  runInstantAnalysis,
  autoFetchRemoteAudio,
  fetchSamplesFromAudioUrl,
  type InstantAnalysisResult,
} from './lib/instantAnalysis';

// ─── Model capability registry ───────────────────────────────────────────────
const MODEL_CONFIGS: Record<string, {
  execution: string;
  variants: { id: string; label: string; desc: string; stems: string[] }[];
  defaultVariant: string;
}> = {
  demucs: {
    execution: 'single-pass',
    variants: [
      { id: 'htdemucs',    label: '4-stem', desc: 'Vocals · Drums · Bass · Other',                     stems: ['vocals','drums','bass','other'] },
      { id: 'htdemucs_6s', label: '6-stem', desc: 'Vocals · Drums · Bass · Guitar · Piano · Other',    stems: ['vocals','drums','bass','guitar','piano','other'] },
    ],
    defaultVariant: 'htdemucs',
  },
  spleeter: {
    execution: 'single-pass',
    variants: [
      { id: '2stems', label: '2-stem', desc: 'Vocals · Instrumental',                                  stems: ['vocals','other'] },
      { id: '4stems', label: '4-stem', desc: 'Vocals · Drums · Bass · Other',                         stems: ['vocals','drums','bass','other'] },
      { id: '5stems', label: '5-stem', desc: 'Vocals · Drums · Bass · Piano · Other',                 stems: ['vocals','drums','bass','piano','other'] },
    ],
    defaultVariant: '4stems',
  },
  mdx: {
    execution: 'multi-pass',
    variants: [
      { id: 'inst_hq3', label: 'Inst HQ 3',  desc: 'Vocals · Instrumental',                          stems: ['vocals','other'] },
      { id: 'bvr_mdx',  label: 'BVR · MDX',  desc: 'Lead Vocal · Backing Vocals · lightweight',      stems: ['lead_vocal','backing_vocal'] },
    ],
    defaultVariant: 'inst_hq3',
  },
  'bs-roformer': {
    execution: 'single-target',
    variants: [
      { id: 'vocals_ep317',  label: 'EP317',             desc: 'Vocals · Instrumental · max SDR',    stems: ['vocals','other'] },
      { id: 'karaoke_bsr',   label: 'BVR · BS-RoFormer', desc: 'Lead Vocal · Backing Vocals · 2-pass', stems: ['lead_vocal','backing_vocal'] },
      { id: 'karaoke_mel',   label: 'BVR · MelBand',     desc: 'Lead Vocal · Backing Vocals · 2-pass', stems: ['lead_vocal','backing_vocal'] },
    ],
    defaultVariant: 'vocals_ep317',
  },
};

// Variants that run a 2-pass BVR pipeline
const BVR_VARIANT_IDS = ['karaoke_bsr', 'karaoke_mel', 'bvr_mdx'];

// Models still being trialed in beta — locked to "available soon" outside beta mode
const BETA_ONLY_MODELS: string[] = [];

const DEMO_TRACK_URL = "https://on.soundcloud.com/P1Kx0dxKH277zQS21A";

const SPLIT_STEPS = [
  { id: "download", label: "Download" },
  { id: "convert", label: "Convert" },
  { id: "separate", label: "Split" },
  { id: "package", label: "Package" },
  { id: "done", label: "Ready" },
];
const ALL_STEMS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'vocals',        label: 'Vocals',         icon: Mic2   },
  { id: 'drums',         label: 'Drums',          icon: Drum   },
  { id: 'bass',          label: 'Bass',           icon: Guitar },
  { id: 'guitar',        label: 'Guitar',         icon: Guitar },
  { id: 'piano',         label: 'Piano',          icon: Piano  },
  { id: 'other',         label: 'Other / Inst',   icon: Music2 },
  { id: 'lead_vocal',    label: 'Lead Vocal',     icon: Mic2   },
  { id: 'backing_vocal', label: 'Backing Vocals', icon: Users  },
];

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Error Boundary Component
class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-900/20 text-red-200 rounded-xl border border-red-900/50 m-4">
          <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
          <pre className="text-xs overflow-auto p-4 bg-black/50 rounded">{this.state.error?.toString()}</pre>
          <Button onClick={() => window.location.reload()} className="mt-4">Reload App</Button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

function MainApp() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("composer");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [splitLogs, setSplitLogs] = useState<string[]>([]);
  const splitLogRef = useRef<HTMLDivElement>(null);
  const [splitStage, setSplitStage] = useState<string | null>(null);
  const [splitPass, setSplitPass] = useState<number | null>(null);
  /** Set when a split job fails — tracks which step failed + the error message. */
  const [splitError, setSplitError] = useState<{ stage: string | null; pass: number | null; message: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [chords, setChords] = useState<string[] | null>(null);
  const [generatingChords, setGeneratingChords] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [stemPreviews, setStemPreviews] = useState<{ name: string; url: string }[]>([]);
  // Mixer channel state keyed by stem name — lifted here so settings persist
  // across stem-variant switches and re-splits.
  const [mixerChannels, setMixerChannels] = useState<Record<string, ChannelState>>({});
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [selectedStems, setSelectedStems] = useState<string[]>(["vocals", "drums", "bass", "other"]);
  const [splittingModel, setSplittingModel] = useState<'demucs' | 'mdx' | 'spleeter' | 'bs-roformer'>('demucs');
  const [modelVariant, setModelVariant] = useState<string>('htdemucs');
  const [splitterAvailability, setSplitterAvailability] = useState<Record<string, boolean> | null>(null);
  const [splitterRepoUrl, setSplitterRepoUrl] = useState<string>("https://github.com/airiharuki/Harmonic-Studio-V2");
  const [recentTracksOpen, setRecentTracksOpen] = useState(false);
  // Beta mode is only available in the dev environment — hidden on the public build.
  const IS_DEV = import.meta.env.DEV;
  const [betaMode, setBetaMode] = useState<boolean>(() => {
    if (!import.meta.env.DEV) return false;
    try { return localStorage.getItem('beta-mode') === 'true'; } catch { return false; }
  });
  const [betaLabOpen, setBetaLabOpen] = useState(false);
  const [titleClickCount, setTitleClickCount] = useState(0);

  useEffect(() => {
    try { localStorage.setItem('beta-mode', String(betaMode)); } catch {}
    document.body.classList.toggle('beta-active', betaMode);
    // BVR/karaoke variants and beta-only models are locked while they're
    // being trialed — bounce back to a stable default if beta mode switches off.
    if (!betaMode) {
      if (BETA_ONLY_MODELS.includes(splittingModel)) {
        setSplittingModel('demucs');
        setModelVariant(MODEL_CONFIGS.demucs.defaultVariant);
        setSelectedStems(MODEL_CONFIGS.demucs.variants.find(v => v.id === MODEL_CONFIGS.demucs.defaultVariant)?.stems ?? ['vocals','drums','bass','other']);
      } else if (BVR_VARIANT_IDS.includes(modelVariant)) {
        const cfg = MODEL_CONFIGS[splittingModel];
        const defaultVar = cfg?.defaultVariant ?? 'default';
        setModelVariant(defaultVar);
        const variantStems = cfg?.variants.find(v => v.id === defaultVar)?.stems ?? ['vocals','drums','bass','other'];
        setSelectedStems(variantStems);
      }
    }
  }, [betaMode]);

  // 🥚 Easter egg #1 — Konami code: ↑↑↓↓←→←→
  useEffect(() => {
    const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight'];
    let idx = 0;
    const handler = (e: KeyboardEvent) => {
      if (e.key === KONAMI[idx]) {
        idx++;
        if (idx === KONAMI.length) {
          idx = 0;
          setBetaMode(true);
          toast('🎮 Konami code accepted. Beta mode unlocked.', { icon: '⚗️', duration: 4000 });
        }
      } else {
        idx = e.key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 🥚 Easter egg #2 — type "studio" anywhere
  useEffect(() => {
    const SECRET = 'studio';
    let typed = '';
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      typed += e.key.toLowerCase();
      if (typed.length > SECRET.length) typed = typed.slice(-SECRET.length);
      clearTimeout(timer);
      timer = setTimeout(() => { typed = ''; }, 1500);
      if (typed === SECRET) {
        typed = '';
        setBetaMode(true);
        toast('🎹 You know the word. Beta mode unlocked.', { icon: '🔑', duration: 4000 });
      }
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(timer); };
  }, []);

  // 🥚 Easter egg #3 — click the title 7× within 3 s (handled via titleClickCount state)
  useEffect(() => {
    if (titleClickCount === 0) return;
    if (titleClickCount >= 7) {
      setTitleClickCount(0);
      setBetaMode(true);
      toast('🫙 Seven taps. You found it. Beta mode unlocked.', { icon: '⚗️', duration: 4000 });
      return;
    }
    const timer = setTimeout(() => setTitleClickCount(0), 3000);
    return () => clearTimeout(timer);
  }, [titleClickCount]);

  // Ask the server which stem-splitter binaries are actually installed.
  // Models the server can't run get greyed out in the picker and link to the
  // local-install instructions on GitHub.
  useEffect(() => {
    axios.get("/api/splitters")
      .then(r => {
        setSplitterAvailability(r.data.available);
        if (r.data.repoUrl) setSplitterRepoUrl(r.data.repoUrl);
      })
      .catch(() => setSplitterAvailability({ demucs: false, mdx: false, spleeter: false, "bs-roformer": false }));
  }, []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  const [stemVolumes, setStemVolumes] = useState({
    vocals: 80,
    drums: 80,
    bass: 80,
    other: 80
  });

  // PitchShifter State
  const [sourceKey, setSourceKey] = useState('D');
  const [sourceScale, setSourceScale] = useState('Major');
  const [targetKey, setTargetKey] = useState('A');
  const [targetScale, setTargetScale] = useState('Minor');

  // Highlighted key on the Circle of Fifths — set when navigating from Analyzer → Composer
  const [composerHighlightKey, setComposerHighlightKey] = useState<{ key: string; scale: string } | null>(null);

  // Loop Studio State
  const [loopBars, setLoopBars] = useState(4);
  const [loopBpm, setLoopBpm] = useState(120);
  const [loopTimeSig, setLoopTimeSig] = useState("4/4");
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [isMidiPlaying, setIsMidiPlaying] = useState(false);
  const [isMidiPaused, setIsMidiPaused] = useState(false);
  const [midiData, setMidiData] = useState<{tracks: any[], duration: number} | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [midiCurrentTime, setMidiCurrentTime] = useState(0);
  const [midiBpm, setMidiBpm] = useState<number | null>(null);
  const [midiTimeSig, setMidiTimeSig] = useState<string | null>(null);
  const [midiMode, setMidiMode] = useState<'soundfont' | 'sine'>('soundfont');
  const [parsedLyrics, setParsedLyrics] = useState<{time: number, text: string}[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const midiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const midiAudioCtxRef = useRef<AudioContext | null>(null);
  const midiStartTimeRef = useRef<number>(0);
  const midiPausedTimeRef = useRef<number>(0);
  const midiActiveNotesRef = useRef<any[]>([]);
  const currentMidiRef = useRef<any>(null);
  const activeLyricRef = useRef<HTMLParagraphElement | null>(null);

  const releaseDownloadedAudioBlobUrl = () => {
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
  };

  const setPlayableAudioFromBlob = (blob: Blob) => {
    releaseDownloadedAudioBlobUrl();
    const blobUrl = URL.createObjectURL(blob);
    audioBlobUrlRef.current = blobUrl;
    setAudioUrl(blobUrl);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setIsPlaying(false);
    setStemPreviews([]);
    return blobUrl;
  };

  useEffect(() => {
    const index = parsedLyrics.findIndex((lyric, idx) => 
      midiCurrentTime >= lyric.time && (idx === parsedLyrics.length - 1 || midiCurrentTime < parsedLyrics[idx + 1].time)
    );
    if (index !== activeLyricIndex) {
      setActiveLyricIndex(index);
    }
  }, [midiCurrentTime, parsedLyrics, activeLyricIndex]);

  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex]);

  useEffect(() => {
    return () => {
      releaseDownloadedAudioBlobUrl();
    };
  }, []);

  // Keep the browser chrome (iOS status/toolbar tint, Android status bar)
  // matched to whichever theme is actually active, since the user can force
  // light/dark independently of the OS's prefers-color-scheme.
  useEffect(() => {
    const color = resolvedTheme === "dark" ? "#1c1620" : "#c9a3ab";
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute("content", color);
    });
  }, [resolvedTheme]);

  const stopMidi = () => {
    if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
    midiActiveNotesRef.current.forEach(stop => stop && stop());
    midiActiveNotesRef.current = [];
    setIsMidiPlaying(false);
    setIsMidiPaused(false);
    setMidiCurrentTime(0);
    if (midiAudioCtxRef.current) {
      midiAudioCtxRef.current.close().catch(console.error);
      midiAudioCtxRef.current = null;
    }
    setSynth(null);
  };

  const pauseMidi = () => {
    if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
    midiActiveNotesRef.current = [];
    if (midiAudioCtxRef.current) {
      // Record how far through the MIDI we are before destroying the context.
      midiPausedTimeRef.current = midiAudioCtxRef.current.currentTime - midiStartTimeRef.current;
      // Close entirely — this kills the AudioWorklet node and cancels every
      // note the Wasm engine had queued internally. suspend() is NOT enough
      // because the sf2-synth schedules notes inside Wasm and they fire even
      // while the AudioContext is "suspended".
      midiAudioCtxRef.current.close().catch(console.error);
      midiAudioCtxRef.current = null;
    }
    setSynth(null);
    setIsMidiPaused(true);
  };

  const resumeMidi = async () => {
    if (!currentMidiRef.current) return;

    const pausedTime = midiPausedTimeRef.current;

    // Fresh AudioContext + synth — clean slate, nothing pre-scheduled.
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    midiAudioCtxRef.current = audioCtx;
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    let currentSynth: SoundFont2SynthNode | null = null;
    try {
      let sfArrayBuffer = sfData;
      if (!sfArrayBuffer) {
        let sfResponse = await fetch('/epiano.sf2');
        if (!sfResponse.ok) sfResponse = await fetch('https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/refs/heads/main/public/epiano.sf2');
        if (!sfResponse.ok) throw new Error("Soundfont not found");
        sfArrayBuffer = await sfResponse.arrayBuffer();
        setSfData(sfArrayBuffer);
      }
      const blob = new Blob([sfArrayBuffer], { type: 'application/octet-stream' });
      const sfUrl = URL.createObjectURL(blob);
      currentSynth = await createSoundFont2SynthNode(audioCtx, sfUrl);
      currentSynth.connect(audioCtx.destination);

      (currentSynth as any).play = (noteName: string, time: number, options: any) => {
        const midiNote = Note.midi(noteName);
        if (midiNote === undefined) return { stop: () => {} };
        const velocity = Math.floor((options.gain || 0.8) * 127);
        const duration = options.duration || 1;
        const delay = Math.max(0, time - audioCtx.currentTime);
        currentSynth!.noteOn(0, midiNote, velocity, delay);
        currentSynth!.noteOff(0, midiNote, delay + duration);
        return { stop: () => { currentSynth!.noteOff(0, midiNote, 0); } };
      };

      currentSynth.setProgram(0, 0, 4);
      setSynth(currentSynth);
    } catch (e) {
      console.error("SF2 resume error:", e);
      toast.error("Failed to resume soundfont.");
      return;
    }

    // Schedule only notes that haven't played yet, offset to start now + small buffer.
    midiStartTimeRef.current = audioCtx.currentTime + 0.15 - pausedTime;
    const startTime = midiStartTimeRef.current;

    midiActiveNotesRef.current = [];
    currentMidiRef.current.tracks.forEach((track: any) => {
      track.notes.forEach((note: any) => {
        if (note.time >= pausedTime) {
          const node = (currentSynth as any).play(note.name, startTime + note.time, { duration: note.duration, gain: note.velocity });
          midiActiveNotesRef.current.push(() => { if (node?.stop) node.stop(); });
        }
      });
    });

    if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
    midiIntervalRef.current = setInterval(() => {
      const elapsed = audioCtx.currentTime - startTime;
      if (elapsed >= currentMidiRef.current.duration) {
        if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
        setMidiCurrentTime(currentMidiRef.current.duration);
        setIsMidiPlaying(false);
      } else if (elapsed >= 0) {
        setMidiCurrentTime(elapsed);
      }
    }, 50);

    setIsMidiPaused(false);
  };

  const playMidi = async (file: File) => {
    if (isMidiPaused && midiMode === 'soundfont') {
      resumeMidi();
      return;
    }

    setMidiMode('soundfont');
    // Safari requires AudioContext to be created and resumed synchronously in the click handler
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    midiAudioCtxRef.current = audioCtx;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    setIsMidiPlaying(true);
    setIsMidiPaused(false);
    setMidiCurrentTime(0);
    const arrayBuffer = await file.arrayBuffer();
    const midi = new Midi(arrayBuffer);
    currentMidiRef.current = midi;
    setMidiData({ tracks: midi.tracks, duration: midi.duration });
    
    // Extract BPM and Time Signature
    if (midi.header.tempos.length > 0) {
      setMidiBpm(Math.round(midi.header.tempos[0].bpm));
    }
    if (midi.header.timeSignatures.length > 0) {
      setMidiTimeSig(`${midi.header.timeSignatures[0].timeSignature[0]}/${midi.header.timeSignatures[0].timeSignature[1]}`);
    }

    // Check if it's the specific file
    setShowLyrics(file.name === "想念你想我_周兴哲.mid" || file.name.includes("想念你想我"));
    
    if (file.name === "想念你想我_周兴哲.mid" || file.name.includes("想念你想我")) {
      try {
        const response = await fetch('/lyrics.txt');
        const text = await response.text();
        const lines = text.split('\n');
        const lyrics: {time: number, text: string}[] = [];
        lines.forEach(line => {
          const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
          if (match) {
            const mins = parseInt(match[1]);
            const secs = parseFloat(match[2]);
            const time = mins * 60 + secs;
            lyrics.push({ time, text: match[3].trim() });
          }
        });
        setParsedLyrics(lyrics);
      } catch (e) {
        console.error("Failed to load lyrics:", e);
      }
    }
    
    let currentSynth = synth;
    if (!currentSynth) {
        try {
            let sfArrayBuffer = sfData;
            if (!sfArrayBuffer) {
                toast.info("Loading custom e-piano soundfont...");
                let sfResponse = await fetch('/epiano.sf2');
                if (!sfResponse.ok) {
                    sfResponse = await fetch('https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/refs/heads/main/public/epiano.sf2');
                }
                if (!sfResponse.ok) {
                    sfResponse = await fetch('https://raw.githubusercontent.com/spessas/SpessaSynth/main/examples/soundfont.sf2');
                }
                if (!sfResponse.ok) throw new Error("Soundfont not found");
                sfArrayBuffer = await sfResponse.arrayBuffer();
                setSfData(sfArrayBuffer);
            }
            
            const blob = new Blob([sfArrayBuffer], { type: 'application/octet-stream' });
            const sfUrl = URL.createObjectURL(blob);
            currentSynth = await createSoundFont2SynthNode(audioCtx, sfUrl);
            currentSynth.connect(audioCtx.destination);
            
            // Add compatibility layer for the app's play method
            (currentSynth as any).play = (noteName: string, time: number, options: any) => {
                const midiNote = Note.midi(noteName);
                if (midiNote === undefined) return { stop: () => {} };
                const velocity = Math.floor((options.gain || 0.8) * 127);
                const duration = options.duration || 1;
                const delay = Math.max(0, time - audioCtx.currentTime);
                
                currentSynth!.noteOn(0, midiNote, velocity, delay);
                currentSynth!.noteOff(0, midiNote, delay + duration);

                return {
                    stop: () => {
                        currentSynth!.noteOff(0, midiNote, 0);
                    }
                };
            };

            (currentSynth as any).stopAllNotes = () => {
                for (let i = 0; i < 128; i++) {
                    currentSynth!.noteOff(0, i, 0);
                }
            };
            
            setSynth(currentSynth);
        } catch (e) {
            console.error("SF2 Synth load error:", e);
            toast.error("Failed to load soundfont.");
            return;
        }
    }

    midiStartTimeRef.current = audioCtx.currentTime + 0.5;
    const startTime = midiStartTimeRef.current;

    if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
    midiIntervalRef.current = setInterval(() => {
        const elapsed = audioCtx.currentTime - startTime;
        if (elapsed >= midi.duration) {
            if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
            setMidiCurrentTime(midi.duration);
            setIsMidiPlaying(false);
        } else if (elapsed >= 0) {
            setMidiCurrentTime(elapsed);
        }
    }, 50);

    currentSynth.setProgram(0, 0, 4);
    midiActiveNotesRef.current = [];
    midi.tracks.forEach(track => {
        track.notes.forEach(note => {
            const node = currentSynth.play(note.name, startTime + note.time, { duration: note.duration, gain: note.velocity });
            midiActiveNotesRef.current.push(() => {
              if (node && typeof node.stop === 'function') node.stop();
            });
        });
    });
  };

  const playMidiSine = async (file: File) => {
    if (isMidiPaused && midiMode === 'sine') {
      resumeMidi();
      return;
    }

    setMidiMode('sine');
    // Safari requires AudioContext to be created and resumed synchronously in the click handler
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    midiAudioCtxRef.current = audioCtx;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    setIsMidiPlaying(true);
    setIsMidiPaused(false);
    setMidiCurrentTime(0);
    const arrayBuffer = await file.arrayBuffer();
    const midi = new Midi(arrayBuffer);
    currentMidiRef.current = midi;
    setMidiData({ tracks: midi.tracks, duration: midi.duration });
    
    // Extract BPM and Time Signature
    if (midi.header.tempos.length > 0) {
      setMidiBpm(Math.round(midi.header.tempos[0].bpm));
    }
    if (midi.header.timeSignatures.length > 0) {
      setMidiTimeSig(`${midi.header.timeSignatures[0].timeSignature[0]}/${midi.header.timeSignatures[0].timeSignature[1]}`);
    }

    setShowLyrics(file.name === "想念你想我_周兴哲.mid" || file.name.includes("想念你想我"));
    
    if (file.name === "想念你想我_周兴哲.mid" || file.name.includes("想念你想我")) {
      try {
        const response = await fetch('/lyrics.txt');
        const text = await response.text();
        const lines = text.split('\n');
        const lyrics: {time: number, text: string}[] = [];
        lines.forEach(line => {
          const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
          if (match) {
            const mins = parseInt(match[1]);
            const secs = parseFloat(match[2]);
            const time = mins * 60 + secs;
            lyrics.push({ time, text: match[3].trim() });
          }
        });
        setParsedLyrics(lyrics);
      } catch (e) {
        console.error("Failed to load lyrics:", e);
      }
    }
    
    midiStartTimeRef.current = audioCtx.currentTime + 0.5;
    const startTime = midiStartTimeRef.current;

    if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
    midiIntervalRef.current = setInterval(() => {
        const elapsed = audioCtx.currentTime - startTime;
        if (elapsed >= midi.duration) {
            if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
            setMidiCurrentTime(midi.duration);
            setIsMidiPlaying(false);
        } else if (elapsed >= 0) {
            setMidiCurrentTime(elapsed);
        }
    }, 50);

    const A4 = 432; // The magic frequency
    midiActiveNotesRef.current = [];

    midi.tracks.forEach(track => {
        track.notes.forEach(note => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = A4 * Math.pow(2, (note.midi - 69) / 12);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const noteStartTime = startTime + note.time;
            const noteEndTime = noteStartTime + note.duration;
            
            gainNode.gain.setValueAtTime(0, noteStartTime);
            gainNode.gain.linearRampToValueAtTime(note.velocity * 0.3, noteStartTime + 0.05);
            gainNode.gain.setValueAtTime(note.velocity * 0.3, Math.max(noteStartTime + 0.05, noteEndTime - 0.05));
            gainNode.gain.linearRampToValueAtTime(0, noteEndTime);
            
            osc.start(noteStartTime);
            osc.stop(noteEndTime);
            midiActiveNotesRef.current.push(() => {
              try { osc.stop(); } catch(e) {}
            });
        });
    });
  };

  const [loopKey, setLoopKey] = useState('D');
  const [loopScale, setLoopScale] = useState('Major');
  const [loopChords, setLoopChords] = useState<string[] | null>(null);
  const [generatingLoop, setGeneratingLoop] = useState(false);
  const [isLoopPlaying, setIsLoopPlaying] = useState(false);
  const [loopCurrentTime, setLoopCurrentTime] = useState(0);
  const [synth, setSynth] = useState<SoundFont2SynthNode | null>(null);
  const [sfData, setSfData] = useState<ArrayBuffer | null>(null);
  const [isSfLoading, setIsSfLoading] = useState(false);

  // Refs so async playback callbacks always see the latest values
  const isLoopPlayingRef = useRef(false);
  const loopAudioCtxRef = useRef<AudioContext | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const preloadSF = async () => {
      setIsSfLoading(true);
      try {
        let sfResponse = await fetch('/epiano.sf2');
        if (!sfResponse.ok) {
          sfResponse = await fetch('https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/refs/heads/main/public/epiano.sf2');
        }
        if (!sfResponse.ok) {
          sfResponse = await fetch('https://raw.githubusercontent.com/spessas/SpessaSynth/main/examples/soundfont.sf2');
        }
        if (sfResponse.ok) {
          const buffer = await sfResponse.arrayBuffer();
          setSfData(buffer);
          console.log("Soundfont preloaded successfully");
        }
      } catch (e) {
        console.error("Failed to preload soundfont:", e);
      } finally {
        setIsSfLoading(false);
      }
    };
    preloadSF();
  }, []);

  const [bpmError, setBpmError] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState<string>('');
  const [lastProgInfo, setLastProgInfo] = useState<{ raw: string; moods: string[] } | null>(null);

  // ── Tap Tempo ──────────────────────────────────────────────────────────────
  const tapTimesRef = useRef<number[]>([]);
  const tapResetRef = useRef<ReturnType<typeof setTimeout>>();
  const [tapCount, setTapCount] = useState(0); // visual feedback only

  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    clearTimeout(tapResetRef.current);
    tapTimesRef.current = [...tapTimesRef.current, now].slice(-8);
    setTapCount(c => c + 1);
    if (tapTimesRef.current.length >= 2) {
      const intervals = tapTimesRef.current.slice(1).map((t, i) => t - tapTimesRef.current[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avg);
      if (bpm >= 30 && bpm <= 300) { setLoopBpm(bpm); setBpmError(null); }
    }
    tapResetRef.current = setTimeout(() => { tapTimesRef.current = []; setTapCount(0); }, 2000);
  }, []);

  // ── Chord History ──────────────────────────────────────────────────────────
  const [chordHistory, setChordHistory] = useState<{ chords: string[]; key: string; scale: string; bpm: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem('chord-history') || '[]'); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!loopChords || loopChords.length === 0) return;
    const entry = { chords: loopChords, key: loopKey, scale: loopScale, bpm: loopBpm };
    setChordHistory(prev => {
      const next = [entry, ...prev].slice(0, 10);
      try { localStorage.setItem('chord-history', JSON.stringify(next)); } catch {}
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopChords]);

  // ── Semitone Transpose ─────────────────────────────────────────────────────
  const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const normaliseRoot = (r: string) =>
    r.replace('Db','C#').replace('Eb','D#').replace('Gb','F#').replace('Ab','G#').replace('Bb','A#');

  const transposeRoot = useCallback((root: string, semitones: number): string => {
    const norm = normaliseRoot(root);
    const idx = CHROMATIC.indexOf(norm);
    if (idx === -1) return root;
    return CHROMATIC[((idx + semitones) % 12 + 12) % 12];
  }, []);

  const transposeChords = useCallback((semitones: number) => {
    if (!loopChords) return;
    const transposed = loopChords.map(chord => {
      const m = chord.match(/^[A-G][b#]?/);
      if (!m) return chord;
      return transposeRoot(m[0], semitones) + chord.slice(m[0].length);
    });
    setLoopChords(transposed);
    setLoopKey(prev => transposeRoot(prev, semitones));
    toast.success(`Transposed ${semitones > 0 ? '+' : ''}${semitones} semitone${Math.abs(semitones) !== 1 ? 's' : ''}`, { duration: 1500 });
  }, [loopChords, transposeRoot]);

  // ── Send to Loop Studio ───────────────────────────────────────────────────
  const sendToLoopStudio = useCallback(() => {
    if (!analysis) return;
    setLoopKey(analysis.key);
    setLoopScale(analysis.scale);
    setLoopBpm(analysis.bpm);
    setBpmError(null);
    setActiveTab('loopstudio');
    toast.success(`Sent ${analysis.key} ${analysis.scale} @ ${analysis.bpm} BPM → Loop Studio`);
  }, [analysis]);

  useEffect(() => {
    // Initialize Eruda for mobile debugging
    if (typeof window !== "undefined" && (window as any).eruda) {
      (window as any).eruda.init();
    }

    // Load and fully initialise Essentia.js
    const loadEssentia = async () => {
      const win = window as any;
      if (win.__EssentiaReady) return; // already loaded

      const loadScript = (src: string) =>
        new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = src;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error(`Failed to load: ${src}`));
          document.head.appendChild(s);
        });

      try {
        // 1. Load the WASM bootstrap (web build, NOT module.js — that file doesn't exist)
        await loadScript("https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.web.js");
        // 2. Load the high-level Essentia API
        await loadScript("https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia.js-core.js");

        // 3. EssentiaWASM is an Emscripten factory — call it and await the resolved module.
        //    Pass locateFile so it can find the .wasm binary on the same CDN path.
        const wasmModule = await win.EssentiaWASM({
          locateFile: (path: string) =>
            `https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/${path}`,
        });

        win.__EssentiaModule = wasmModule;
        win.__EssentiaReady = true;
        console.log("Essentia.js ready");
      } catch (e) {
        console.error("Failed to load Essentia:", e);
      }
    };
    // Shared init promise so instant analysis can await startup instead of
    // giving up if a track loads before Essentia finishes initialising.
    // loadEssentia catches its own errors, so this always settles.
    (window as any).__EssentiaInitPromise = loadEssentia();
  }, []);

  const isSoundCloudUrl = (raw: string): boolean => {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      return host === "soundcloud.com" || host.endsWith(".soundcloud.com");
    } catch {
      return false;
    }
  };

  // Map cryptic downloader/network errors to messages a human can act on.
  const friendlyError = (msg: string): string => {
    const m = (msg || "").toLowerCase();
    if (m.includes("sign in") || m.includes("log in") || m.includes("bot"))
      return "This site is blocking automated downloads right now. Try another link or upload the file directly.";
    if (m.includes("too long") || m.includes("duration"))
      return "That track is too long to process. Try something under ~15 minutes.";
    if (m.includes("region") || m.includes("unavailable") || m.includes("not available") || m.includes("private"))
      return "This track is region-blocked or unavailable. Try another source, or upload the file directly.";
    if (m.includes("429") || m.includes("too many") || m.includes("cooldown") || m.includes("wait"))
      return "Easy there — the server is catching its breath. Give it a few seconds and retry.";
    if (m.includes("network") || m.includes("econnreset") || m.includes("epipe") || m.includes("timeout") || m.includes("socket"))
      return "Connection hiccup mid-transfer. Give it another go.";
    if (m.includes("copyright") || m.includes("drm") || m.includes("protected"))
      return "This track is copy-protected and can't be pulled. Try another source.";
    return msg;
  };

  const handleFetchInfo = async (overrideUrl?: string) => {
    const effectiveUrl = overrideUrl ?? url;
    if (!effectiveUrl && !file) return;
    setLoading(true);
    setVideoInfo(null);
    setAnalysis(null);
    setAudioUrl(null);
    // Release the previous track's blob so the new track's auto-fetch can
    // install audio, and claim a fresh load generation — this invalidates any
    // in-flight info/audio fetches from a previous track.
    releaseDownloadedAudioBlobUrl();
    const loadId = autoFetchGateRef.current.next();
    try {
      if (file) {
        // Handle local file upload
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const uploadedAudioResponse = await axios.get(response.data.url, { responseType: "blob" });
        const uploadedContentType = String(uploadedAudioResponse.headers["content-type"] || "").toLowerCase();
        if (uploadedContentType.includes("text/html")) {
          throw new Error("Server returned HTML instead of expected audio data.");
        }
        setPlayableAudioFromBlob(uploadedAudioResponse.data);
        setUploadedFilename(response.data.filename);
        setVideoInfo({
          title: response.data.originalName,
          uploader: "Local File",
          thumbnail: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=800&auto=format&fit=crop",
          duration: 0,
          view_count: 0,
          isLocal: true
        });
        toast.success("File uploaded successfully!");
      } else if (isSoundCloudUrl(effectiveUrl)) {
        // SoundCloud: stream via official widget — artwork-forward player, no download.
        const sc = await axios.get(`/api/sc/resolve?url=${encodeURIComponent(effectiveUrl)}`);
        setVideoInfo({
          title: sc.data.title,
          uploader: sc.data.author,
          thumbnail: sc.data.thumbnail,
          duration: 0,
          view_count: 0,
          soundcloudUrl: effectiveUrl,
          loadedUrl: effectiveUrl,
        });
        toast.success("SoundCloud track loaded — streaming, no download needed.");
      } else {
        const response = await axios.get(`/api/info?url=${encodeURIComponent(effectiveUrl)}`);

        let videoId = '';
        if (effectiveUrl.includes('youtube.com') || effectiveUrl.includes('youtu.be')) {
          if (effectiveUrl.includes('youtu.be/')) {
            videoId = effectiveUrl.split('youtu.be/')[1].split('?')[0];
          } else if (effectiveUrl.includes('v=')) {
            videoId = effectiveUrl.split('v=')[1].split('&')[0];
          }
        }
        
        setVideoInfo({
          ...response.data,
          targetVideoId: videoId,
          loadedUrl: effectiveUrl,
        });
        
        toast.success("Video info fetched!");

        // Kick off a background audio fetch so BPM/key badges can appear
        // automatically — no Download or Analyze click needed. Tied to this
        // load generation, so a stale info response can't overwrite a newer
        // track's audio.
        autoFetchTrackAudio(loadId, effectiveUrl, response.data.title);
      }
    } catch (error: any) {
      toast.error("Couldn't load that track: " + friendlyError(error.response?.data?.error || error.message), {
        duration: 8000,
        action: { label: "Retry", onClick: () => handleFetchInfo() },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewFile = (selectedFile: File) => {
    setFile(selectedFile);
    setUrl(""); // Clear URL if file is selected
    if (selectedFile.name.toLowerCase().endsWith(".mp3")) {
      toast.warning("Warning: MP3s are compressed and may reduce the quality of stem splitting and analysis. WAV or FLAC is recommended.", { duration: 5000 });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleNewFile(e.target.files[0]);
  };

  const handleDownload = async (format: "mp3" | "wav" | "flac") => {
    setDownloading(format);
    try {
      const response = await axios.post("/api/download", { url: videoInfo?.loadedUrl ?? videoInfo?.soundcloudUrl ?? url, format, title: videoInfo?.title });
      const downloadUrl = response.data.url;
      const fileResponse = await axios.get(downloadUrl, { responseType: "blob" });
      const contentType = String(fileResponse.headers["content-type"] || "").toLowerCase();
      if (contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of expected audio data.");
      }
      const blobUrl = setPlayableAudioFromBlob(fileResponse.data);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      const safeTitle = videoInfo?.title ? videoInfo.title.replace(/[^a-zA-Z0-9 \-_]/g, '') : "audio";
      link.setAttribute("download", `${safeTitle}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addRecentTrack({
        title: videoInfo?.title || safeTitle,
        type: "download",
        format,
        token: extractTokenFromUrl(downloadUrl),
        url: downloadUrl,
        expiresAt: Date.now() + response.data.expiresIn,
      });
      
      toast.success(`Download started for ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`Download failed: ${friendlyError(error.response?.data?.error || error.message)}`, {
        duration: 8000,
        action: { label: "Retry", onClick: () => handleDownload(format) },
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleSplit = async () => {
    if (selectedStems.length === 0) {
      toast.error("Please select at least one stem to download.");
      return;
    }

    if (splitterAvailability && splitterAvailability[splittingModel] === false) {
      toast.error(`${splittingModel.toUpperCase()} isn't installed on this server. Run the project locally to use it.`, {
        action: { label: "Install guide", onClick: () => window.open(splitterRepoUrl, "_blank") },
        duration: 6000,
      });
      return;
    }

    setSplitting(true);
    setSplitLogs([]);
    setStemPreviews([]);
    setSplitStage(null);
    setSplitPass(null);
    setSplitError(null);

    // Declared outside try so the catch block can read the last-known values.
    let lastStage: string | null = null;
    let lastPass: number | null = null;

    try {
      const payload = buildSplitPayload({
        uploadedFilename,
        videoInfo,
        url,
        selectedStems,
        splittingModel,
        modelVariant,
      });

      const response = await fetch("/api/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let downloadUrl = "";
      let expiresIn = 0;
      let downloadFilename = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "log") {
              setSplitLogs(prev => [...prev, event.line]);
            } else if (event.type === "stage") {
              lastStage = event.stage;
              if (event.pass) lastPass = event.pass;
              setSplitStage(event.stage);
              if (event.pass) setSplitPass(event.pass);
            } else if (event.type === "done") {
              downloadUrl = event.url;
              expiresIn = event.expiresIn;
              downloadFilename = event.filename;
              if (Array.isArray(event.stems)) setStemPreviews(event.stems);
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr;
          }
        }
      }

      if (!downloadUrl) throw new Error("No download URL received");

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "stems.zip");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addRecentTrack({
        title: videoInfo?.title || uploadedFilename || "Stems",
        type: "stems",
        format: "zip",
        token: extractTokenFromUrl(downloadUrl),
        url: downloadUrl,
        expiresAt: Date.now() + expiresIn,
      });

      toast.success("Stem splitting complete! Download started.");
    } catch (error: any) {
      // Capture which step was active when the failure happened so the
      // StepProgress component can highlight it with the error message.
      setSplitError({
        stage: lastStage,
        pass: lastPass,
        message: friendlyError(error.message),
      });
      toast.error(`Splitting failed: ${friendlyError(error.message)}`, {
        duration: 8000,
        action: { label: "Retry", onClick: () => handleSplit() },
      });
      setSplitLogs(prev => [...prev, `ERROR: ${error.message}`]);
    } finally {
      setSplitting(false);
      setSplitStage(null);
      setSplitPass(null);
    }
  };

  // Auto-scroll the split log to the bottom as new lines arrive
  useEffect(() => {
    if (splitLogRef.current) {
      splitLogRef.current.scrollTop = splitLogRef.current.scrollHeight;
    }
  }, [splitLogs]);

  // Smooth-scroll to the results panel the moment stems are ready
  useEffect(() => {
    if (stemPreviews.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [stemPreviews]);

  const toggleStem = (stem: string) => {
    setSelectedStems(prev => 
      prev.includes(stem) ? prev.filter(s => s !== stem) : [...prev, stem]
    );
  };

  const toggleAllStems = () => {
    const cfg = MODEL_CONFIGS[splittingModel];
    const available = cfg?.variants.find(v => v.id === modelVariant)?.stems ?? ['vocals','drums','bass','other'];
    const allSelected = available.every(s => selectedStems.includes(s));
    setSelectedStems(allSelected ? [] : available);
  };

  // ── Instant analysis — lightweight auto BPM/key detection ─────────────────
  // Runs a fast first-pass as soon as a track's audio is available so BPM/key
  // badges appear without clicking Analyze. Full Analyze flow is untouched.
  const [quickAnalysis, setQuickAnalysis] = useState<InstantAnalysisResult | null>(null);
  const [quickAnalyzing, setQuickAnalyzing] = useState(false);
  const quickGateRef = useRef(new LatestRunGate());
  const analyzingRef = useRef(false);
  useEffect(() => { analyzingRef.current = analyzing; }, [analyzing]);

  useEffect(() => {
    const runId = quickGateRef.current.next();
    // New track (or track cleared) — reset badge state immediately.
    setQuickAnalysis(null);
    setQuickAnalyzing(false);
    if (!audioUrl) return;
    // If a full Analyze run is already in flight (it may have just fetched
    // this audio itself), don't double-run detection.
    if (analyzingRef.current) return;

    let cancelled = false;
    const run = async () => {
      setQuickAnalyzing(true);
      const result = await runInstantAnalysis(audioUrl, {
        getEssentia: () => {
          const win = window as any;
          return win.__EssentiaReady && win.Essentia
            ? new win.Essentia(win.__EssentiaModule)
            : null;
        },
        waitForEssentia: async () => {
          const p = (window as any).__EssentiaInitPromise;
          if (p) await p.catch(() => {});
        },
        fetchSamples: fetchSamplesFromAudioUrl,
        isCancelled: () => cancelled || !quickGateRef.current.isCurrent(runId),
      });
      if (cancelled || !quickGateRef.current.isCurrent(runId)) return;
      // Failure is silent by design — result is simply null, no badges shown.
      setQuickAnalysis(result);
      setQuickAnalyzing(false);
    };
    run();
    return () => { cancelled = true; };
  }, [audioUrl]);

  // Auto-fetch playable audio for remote (yt-dlp) tracks so instant analysis
  // can run right after info loads, without the user clicking Download/Analyze.
  // The gate id is minted at the START of each track load (handleFetchInfo),
  // so a superseded load can never install audio over a newer track.
  const autoFetchGateRef = useRef(new LatestRunGate());
  const autoFetchTrackAudio = (loadId: number, trackUrl: string, title?: string) => {
    autoFetchRemoteAudio(loadId, trackUrl, title, {
      gate: autoFetchGateRef.current,
      requestDownloadUrl: async (u, t) => {
        const response = await axios.post("/api/download", { url: u, format: "mp3", title: t });
        return response.data.url;
      },
      fetchBlob: async (downloadUrl) => {
        const fileResponse = await axios.get(downloadUrl, { responseType: "blob" });
        return {
          data: fileResponse.data,
          contentType: String(fileResponse.headers["content-type"] || ""),
        };
      },
      hasManualAudio: () => !!audioBlobUrlRef.current,
      installAudio: (blob) => { setPlayableAudioFromBlob(blob); },
    });
  };

  const handleAnalyze = async () => {
    let targetBlobUrl = audioUrl;

    if (!targetBlobUrl) {
      if (!url) {
        toast.info("Please provide a track or video URL to analyze.");
        return;
      }
      
      // Auto-fetch the MP3 for analysis so the user doesn't have to manually download it first.
      setAnalyzing(true);
      toast.info("Fetching raw audio (MP3) for analysis...");
      try {
        const response = await axios.post("/api/download", { url, format: 'mp3', title: videoInfo?.title });
        const downloadUrl = response.data.url;
        const fileResponse = await axios.get(downloadUrl, { responseType: "blob" });
        const contentType = String(fileResponse.headers["content-type"] || "").toLowerCase();
        
        if (contentType.includes("text/html")) {
            throw new Error("Server returned HTML. Failed to retrieve audio.");
        }
        
        targetBlobUrl = setPlayableAudioFromBlob(fileResponse.data);
      } catch (err: any) {
        toast.error(`Failed to fetch raw audio: ${err.message}`);
        setAnalyzing(false);
        return;
      }
    }

    setAnalyzing(true);
    try {
      // Try to use real Essentia if fully initialised
      const win = window as any;
      if (win.__EssentiaReady && win.Essentia) {
        console.log("Using real Essentia.js");
        // __EssentiaModule is the resolved WASM module (not the factory function)
        const essentia = new win.Essentia(win.__EssentiaModule);

        const response = await fetch(targetBlobUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // Downsample to mono at 44100 Hz if needed (Essentia's default SR)
        const TARGET_SR = 44100;
        let samples: Float32Array;
        if (audioBuffer.sampleRate !== TARGET_SR) {
          const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * TARGET_SR), TARGET_SR);
          const src = offlineCtx.createBufferSource();
          src.buffer = audioBuffer;
          src.connect(offlineCtx.destination);
          src.start();
          const resampled = await offlineCtx.startRendering();
          samples = resampled.getChannelData(0);
        } else {
          // Mix down to mono
          const ch0 = audioBuffer.getChannelData(0);
          if (audioBuffer.numberOfChannels > 1) {
            const ch1 = audioBuffer.getChannelData(1);
            samples = new Float32Array(ch0.length);
            for (let i = 0; i < ch0.length; i++) samples[i] = (ch0[i] + ch1[i]) / 2;
          } else {
            samples = ch0;
          }
        }

        const vector = essentia.arrayToVector(samples);

        const bpmResult = essentia.PercivalBpmEstimator(
          vector,
          undefined, undefined, undefined, undefined, undefined, undefined,
          TARGET_SR
        );
        const keyData = essentia.KeyExtractor(vector);

        const scale = keyData.scale
          ? keyData.scale.charAt(0).toUpperCase() + keyData.scale.slice(1)
          : "Major";

        // Compute RMS loudness in dBFS from the first 10 seconds of samples
        const sampleSlice = samples.slice(0, Math.min(samples.length, TARGET_SR * 10));
        let rms = 0;
        for (let i = 0; i < sampleSlice.length; i++) rms += sampleSlice[i] * sampleSlice[i];
        rms = Math.sqrt(rms / sampleSlice.length);
        const loudnessDb = rms > 0 ? Math.round(20 * Math.log10(rms) * 10) / 10 : -60;

        setAnalysis({
          bpm: Math.round(bpmResult.bpm),
          rawBpm: Math.round(bpmResult.bpm * 10) / 10,
          key: keyData.key,
          scale,
          keyStrength: Math.round((keyData.strength ?? 0) * 100),
          energy: Math.random(),
          danceability: Math.random(),
          loudness: loudnessDb,
          mood: ["Happy", "Energetic", "Calm"][Math.floor(Math.random() * 3)]
        });

        toast.success("Real-time analysis complete!");
      } else {
        throw new Error("Essentia.js not fully initialised yet. Please wait a moment and try again.");
      }
    } catch (error: any) {
      console.warn("Real analysis failed, falling back to simulation:", error.message);
      // Simulation fallback
      await new Promise(resolve => setTimeout(resolve, 2000));
      const simBpm = Math.floor(Math.random() * (140 - 80) + 80);
      setAnalysis({
        bpm: simBpm,
        rawBpm: simBpm + Math.round(Math.random() * 9) / 10,
        key: ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"][Math.floor(Math.random() * 12)],
        scale: Math.random() > 0.5 ? "Major" : "Minor",
        keyStrength: Math.round((Math.random() * 0.4 + 0.4) * 100),
        energy: Math.random(),
        danceability: Math.random(),
        loudness: Math.round((-20 + Math.random() * 14) * 10) / 10,
        mood: ["Happy", "Sad", "Energetic", "Calm", "Aggressive"][Math.floor(Math.random() * 5)]
      });
      toast.success("Analysis complete (Simulated)!");
    } finally {
      setAnalyzing(false);
    }
  };

  /** Theory-based fallback when the AI quota is exhausted. */
  const buildFallbackChords = (key: string, scale: string, mood?: string): string[] => {
    try {
      const isMinor = /minor/i.test(scale);
      const isDark  = /dark|sad|melancholy|tense|angry/i.test(mood ?? "");
      if (isMinor) {
        const k = Key.minorKey(key);
        const c = k.natural.chords; // [i, iidim, III, iv, v, VI, VII]
        // i-VI-III-VII or i-iv-VII-III
        return isDark
          ? [c[0], c[3], c[6], c[2]]
          : [c[0], c[5], c[2], c[6]];
      } else {
        const k = Key.majorKey(key);
        const c = k.chords; // [I, ii, iii, IV, V, vi, viidim]
        // I-V-vi-IV or vi-IV-I-V (darker feel)
        return isDark
          ? [c[5], c[3], c[0], c[4]]
          : [c[0], c[4], c[5], c[3]];
      }
    } catch {
      return ["C", "Am", "F", "G"];
    }
  };

  const handleGenerateChords = async () => {
    if (!analysis) return;
    setGeneratingChords(true);
    try {
      const res = await fetch("/api/generate-chords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: analysis.key,
          scale: analysis.scale,
          mood: analysis.mood,
          bpm: analysis.bpm,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        if (res.status === 429) {
          // Quota exhausted — fall back to theory-based chords silently
          const fallback = buildFallbackChords(analysis.key, analysis.scale, analysis.mood);
          setChords(fallback);
          toast("AI quota hit — using theory-based chords instead", { icon: "⚗️" });
          return;
        }
        throw new Error(errData.error || res.statusText);
      }
      const { chords } = await res.json();
      setChords(chords);
      toast.success("AI generated chords based on the vibe!");
    } catch (error: any) {
      toast.error("Failed to generate chords — " + (error.message ?? "please try again."));
    } finally {
      setGeneratingChords(false);
    }
  };

  const handleGenerateLoop = () => {
    if (loopBpm > 300) { toast.error("We're not making extra tone today"); return; }
    if (loopBpm < 30)  { toast.error("BPM too low! Minimum is 30."); return; }

    // Map UI scale to ProgScale — treat Modal as Minor for key resolution
    const progScale: ProgScale =
      loopScale === 'Major' ? 'Major' :
      loopScale === 'Minor' ? 'Minor' : 'Minor';

    const prog = pickProgression(progScale, moodFilter || undefined);
    const chords = resolveProgression(prog.raw, loopKey, prog.scale, loopBars);

    setLoopChords(chords);
    setLastProgInfo({ raw: prog.raw, moods: prog.moods });
    toast.success(
      `${loopKey} ${loopScale}${prog.moods.length ? ` · ${prog.moods.join(' ')}` : ''}`,
      { icon: '🎵', duration: 3000 }
    );
  };

  const playLoop = async () => {
    if (!loopChords) return;
    
    // ── Stop ──────────────────────────────────────────────────────────────────
    if (isLoopPlayingRef.current) {
      isLoopPlayingRef.current = false;
      setIsLoopPlaying(false);
      if (loopTimerRef.current) { clearTimeout(loopTimerRef.current); loopTimerRef.current = null; }
      // silence all notes on the cached synth
      if (synth) { for (let n = 0; n < 128; n++) synth.noteOff(0, n, 0); }
      setLoopCurrentTime(0);
      return;
    }

    // ── Start ─────────────────────────────────────────────────────────────────
    // Reuse existing AudioContext so the synth stays connected to it.
    // Only create a new one (and therefore a new synth) when the old one is gone.
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    let audioCtx = loopAudioCtxRef.current;
    let needNewSynth = false;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
      loopAudioCtxRef.current = audioCtx;
      needNewSynth = true;
    }
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    isLoopPlayingRef.current = true;
    setIsLoopPlaying(true);
    setLoopCurrentTime(0);

    try {
      let currentSynth = needNewSynth ? null : synth;
      if (!currentSynth) {
        try {
          let sfArrayBuffer = sfData;
          if (!sfArrayBuffer) {
            toast.info("Loading soundfont…");
            let sfResponse = await fetch('/epiano.sf2');
            if (!sfResponse.ok) sfResponse = await fetch('https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/refs/heads/main/public/epiano.sf2');
            if (!sfResponse.ok) sfResponse = await fetch('https://raw.githubusercontent.com/spessas/SpessaSynth/main/examples/soundfont.sf2');
            if (!sfResponse.ok) throw new Error("Soundfont not found");
            sfArrayBuffer = await sfResponse.arrayBuffer();
            setSfData(sfArrayBuffer);
          }
          const blob = new Blob([sfArrayBuffer], { type: 'application/octet-stream' });
          const sfUrl = URL.createObjectURL(blob);
          currentSynth = await createSoundFont2SynthNode(audioCtx, sfUrl);
          currentSynth.connect(audioCtx.destination);
          setSynth(currentSynth);
        } catch (e) {
          console.error("SF2 Synth load error:", e);
          toast.error("Failed to load soundfont.");
          isLoopPlayingRef.current = false;
          setIsLoopPlaying(false);
          return;
        }
      }

      currentSynth.setProgram(0, 0, 4);
      const barDuration = (60 / loopBpm) * 4;
      const totalDuration = loopChords.length * barDuration;
      let chordIdx = 0;
      const playStart = Date.now();

      const tick = () => {
        if (!isLoopPlayingRef.current) return;

        // Update piano-roll playhead
        const elapsed = (Date.now() - playStart) / 1000;
        setLoopCurrentTime(elapsed % totalDuration);

        // Fire chord
        const chordName = loopChords[chordIdx];
        const notes = Chord.get(chordName).notes;
        notes.forEach(noteName => {
          const midiNote = Note.midi(noteName + "4");
          if (midiNote != null) {
            currentSynth!.noteOn(0, midiNote, 100, 0);
            currentSynth!.noteOff(0, midiNote, barDuration * 0.88);
          }
        });

        chordIdx = (chordIdx + 1) % loopChords.length;
        loopTimerRef.current = setTimeout(tick, barDuration * 1000);
      };

      tick();
    } catch (error) {
      console.error("Playback error:", error);
      toast.error("Playback error. Check console.");
      isLoopPlayingRef.current = false;
      setIsLoopPlaying(false);
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    }
  };

  // ── MIDI helpers ────────────────────────────────────────────────────────────

  const buildLoopPianoRoll = (chords: string[], bpm: number) => {
    const barDuration = (60 / bpm) * 4;
    const notes: { midi: number; time: number; duration: number; velocity: number }[] = [];
    chords.forEach((chordName, i) => {
      Chord.get(chordName).notes.forEach(noteName => {
        const midiNote = Note.midi(noteName + "4");
        if (midiNote != null) notes.push({ midi: midiNote, time: i * barDuration, duration: barDuration * 0.88, velocity: 100 });
      });
    });
    return { tracks: [{ name: 'Chord Progression', notes }], duration: chords.length * barDuration };
  };

  const exportLoopMidi = () => {
    if (!loopChords) return;
    const barDuration = (60 / loopBpm) * 4;
    const midi = new Midi();
    midi.header.setTempo(loopBpm);
    const track = midi.addTrack();
    track.name = 'Loop Studio';
    loopChords.forEach((chordName, i) => {
      Chord.get(chordName).notes.forEach(noteName => {
        const midiNote = Note.midi(noteName + "4");
        if (midiNote != null) track.addNote({ midi: midiNote, time: i * barDuration, duration: barDuration * 0.88, velocity: 0.8 });
      });
    });
    const bytes = midi.toArray();
    const blob = new Blob([bytes], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${loopKey}_${loopScale}_${loopBpm}bpm.mid`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('MIDI exported!', { icon: '🎹' });
  };

  return (
    <>
      <div className="vhs-grain" />
      <div className="min-h-screen font-sans selection:bg-orange-500/30 relative z-10">
        {/* Beta mode banner */}
        <AnimatePresence>
          {betaMode && (
            <motion.div
              initial={{ opacity: 0, y: -32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -32 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed top-0 left-0 right-0 z-[300] flex items-center justify-center gap-2 px-4 py-1.5 bg-violet-600/90 backdrop-blur-md text-white text-[10px] font-mono font-bold tracking-widest uppercase shadow-lg"
            >
              <FlaskConical className="w-3 h-3 animate-pulse shrink-0" />
              <span className="sm:hidden truncate">BETA MODE ACTIVE — v2.1 &quot;Prism&quot;</span>
              <span className="hidden sm:inline">BETA MODE ACTIVE — v2.1 &quot;Prism&quot; — here be dragons. you asked for this.</span>
              <button
                onClick={() => setBetaMode(false)}
                className="ml-2 sm:ml-4 opacity-60 hover:opacity-100 transition-opacity text-white leading-none shrink-0"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`absolute right-4 flex items-center gap-2 transition-all duration-300 ${betaMode ? 'top-9 sm:top-11' : 'top-2 sm:top-6'}`}>
          <RecentTracksButton onClick={() => setRecentTracksOpen(true)} />
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 backdrop-blur-md hover:bg-black/10 dark:hover:bg-white/10"
            asChild
            title="Star on GitHub"
          >
            <a
              href="https://github.com/airiharuki/Harmonic-Studio-V2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </a>
          </Button>
          {IS_DEV && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setBetaMode(b => !b);
              if (!betaMode) toast.success("⚗️ Beta mode activated. Tread lightly.", { duration: 3000 });
              else toast.info("Beta mode deactivated. Back to safety.", { duration: 2000 });
            }}
            className={`rounded-full backdrop-blur-md border transition-all duration-300 ${
              betaMode
                ? 'bg-violet-500/20 border-violet-400/50 hover:bg-violet-500/30 shadow-[0_0_14px_rgba(139,92,246,0.5)]'
                : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title={betaMode ? "Beta mode ON — click to disable" : "Enable beta mode"}
          >
            <FlaskConical className={`w-5 h-5 transition-colors duration-300 ${betaMode ? 'text-violet-400' : 'text-gray-500 dark:text-gray-400'}`} />
          </Button>
          )}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              if (theme === 'system') setTheme('dark');
              else if (theme === 'dark') setTheme('light');
              else setTheme('system');
            }}
            className="rounded-full bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 backdrop-blur-md hover:bg-black/10 dark:hover:bg-white/10"
            title={`Current theme: ${theme}. Click to change.`}
          >
            {theme === 'system' ? <Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" /> :
             theme === 'dark' ? <Moon className="w-5 h-5 text-blue-400" /> : 
             <Sun className="w-5 h-5 text-orange-400" />}
          </Button>
        </div>
        <RecentTracksPanel open={recentTracksOpen} onClose={() => setRecentTracksOpen(false)} />
        <div className={`max-w-5xl mx-auto px-4 sm:px-6 pb-4 sm:py-12 transition-[padding] duration-300 ${betaMode ? 'pt-9 sm:pt-12' : 'pt-4 sm:pt-12'}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mt-11 sm:mt-0 mb-6 sm:mb-12 relative z-[100]">
            {/* Mobile icon + label tab bar */}
            <div className="sm:hidden w-full">
              <div className="relative flex items-center justify-around px-1 py-1 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border border-black/10 dark:border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                {([
                  { id: 'composer',   Icon: Piano,    label: 'Compose' },
                  { id: 'loopstudio', Icon: Repeat,   label: 'Loop'    },
                  { id: 'analyzer',   Icon: BarChart3, label: 'Analyze'},
                  { id: 'tuner',      Icon: Guitar,   label: 'Tuner'   },
                  { id: 'metronome',  Icon: Drum,     label: 'Metro'   },
                ] as const).map(({ id, Icon, label }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 z-10 transition-all duration-200 active:scale-95"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="cam-pill"
                          className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/15 backdrop-blur-md shadow-sm"
                          transition={{ type: "spring", damping: 26, stiffness: 340 }}
                        />
                      )}
                      <Icon
                        className={`relative w-5 h-5 transition-all duration-200 ${isActive ? 'text-foreground' : 'text-foreground/35'}`}
                        style={isActive ? { color: 'var(--pill-active)' } : {}}
                      />
                      <span
                        className={`relative text-[10px] font-bold tracking-tight leading-none transition-opacity duration-200 ${isActive ? '' : 'opacity-35'}`}
                        style={isActive ? { color: 'var(--pill-active)' } : {}}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Tabs */}
            <TabsList className="hidden sm:inline-flex pill-tabs-list">
              <TabsTrigger value="composer" className="pill-tab-trigger">Composer</TabsTrigger>
              <TabsTrigger value="loopstudio" className="pill-tab-trigger">Loop Studio</TabsTrigger>
              <TabsTrigger value="analyzer" className="pill-tab-trigger">Analyzer</TabsTrigger>
              <TabsTrigger value="tuner" className="pill-tab-trigger">Tuner</TabsTrigger>
              <TabsTrigger value="metronome" className="pill-tab-trigger">Metronome</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="composer" className="space-y-6 sm:space-y-12 outline-none">
            <header className="text-center mb-6 sm:mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-5xl font-bold tracking-tight mb-2 sm:mb-4 drop-shadow-md cursor-default select-none"
                onClick={() => setTitleClickCount(c => c + 1)}
                title={titleClickCount > 0 && titleClickCount < 7 ? `${7 - titleClickCount} more...` : undefined}
              >
                Vibe Composer
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg max-w-2xl mx-auto opacity-80"
              >
                Tools for the modern producer. Calculate shifts and explore harmonic relationships.
              </motion.p>
            </header>

            <div className="flex flex-col gap-8">
              <Card className="theme-card max-w-2xl mx-auto w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-foreground" />
                    Pitch Shift Calculator
                  </CardTitle>
                  <CardDescription className="opacity-80">Calculate semitone shifts for your DAW</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                      <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Base Key</p>
                      <p className="text-xl font-bold">{sourceKey} {sourceScale}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                      <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Target Key</p>
                      <p className="text-xl font-bold">{targetKey} {targetScale}</p>
                    </div>
                  </div>
                  <PitchShifter 
                    sourceKey={sourceKey} setSourceKey={setSourceKey}
                    sourceScale={sourceScale} setSourceScale={setSourceScale}
                    targetKey={targetKey} setTargetKey={setTargetKey}
                    targetScale={targetScale} setTargetScale={setTargetScale}
                  />
                </CardContent>
              </Card>

              <CircleOfFifths 
                onSetBaseKey={(k: string, s: string) => { setSourceKey(k); setSourceScale(s); }}
                onSetTargetKey={(k: string, s: string) => { setTargetKey(k); setTargetScale(s); }}
                highlightKey={composerHighlightKey}
                onHighlightCleared={() => setComposerHighlightKey(null)}
              />
            </div>
          </TabsContent>

          <TabsContent value="loopstudio" className="space-y-6 sm:space-y-12 outline-none">
            <header className="text-center mb-6 sm:mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-5xl font-bold tracking-tight mb-2 sm:mb-4 drop-shadow-md"
              >
                Loop Studio
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg max-w-2xl mx-auto opacity-80"
              >
                Create custom chord loops. Set your parameters and let AI compose.
              </motion.p>
            </header>

            <div className="max-w-4xl mx-auto space-y-8">
              <Card className="theme-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-foreground" />
                    Loop Parameters
                  </CardTitle>
                  <CardDescription className="opacity-80">
                    Configure your loop settings (Key is synced with Circle of Fifths) · Progressions from{' '}
                    <a href="https://github.com/ldrolez/free-midi-chords" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-100 transition-opacity">ldrolez/free-midi-chords</a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-70">Bars (4-16)</label>
                      <select 
                        value={loopBars} 
                        onChange={(e) => setLoopBars(parseInt(e.target.value))}
                        className="theme-input w-full p-2 rounded-lg border border-foreground/20 bg-background"
                      >
                        {[4, 8, 12, 16].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-70">BPM</label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          value={loopBpm} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setLoopBpm(val);
                            if (val > 300) {
                              setBpmError("We're not making extra tone today");
                            } else {
                              setBpmError(null);
                            }
                          }}
                          className={`theme-input ${bpmError ? 'border-red-500' : ''}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTapTempo}
                          className={`shrink-0 h-10 px-3 font-bold text-xs border-foreground/20 transition-all duration-75 select-none ${tapCount > 0 ? 'bg-orange-500/20 border-orange-500/40 text-orange-500 scale-95' : ''}`}
                          title="Tap to the beat to set BPM"
                        >
                          <Hand className="w-3.5 h-3.5 mr-1" />
                          TAP
                        </Button>
                      </div>
                      {bpmError && <p className="text-[10px] text-red-500 font-bold">{bpmError}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-70">Time Signature</label>
                      <select 
                        value={loopTimeSig} 
                        onChange={(e) => setLoopTimeSig(e.target.value)}
                        className="theme-input w-full p-2 rounded-lg border border-foreground/20 bg-background"
                      >
                        {["4/4", "3/4", "6/8"].map(ts => <option key={ts} value={ts}>{ts}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-70">Key</label>
                      <select 
                        value={loopKey} 
                        onChange={(e) => setLoopKey(e.target.value)}
                        className="theme-input w-full p-2 rounded-lg border border-foreground/20 bg-background"
                      >
                        {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-70">Scale</label>
                      <select 
                        value={loopScale} 
                        onChange={(e) => setLoopScale(e.target.value)}
                        className="theme-input w-full p-2 rounded-lg border border-foreground/20 bg-background"
                      >
                        {["Major", "Minor"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-bold opacity-70">Circle of Fifths Sync</p>
                      <p className="text-sm font-bold">Base Key: {sourceKey} {sourceScale}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { setLoopKey(sourceKey); setLoopScale(sourceScale); }}
                    >
                      Sync
                    </Button>
                  </div>

                  {/* Mood filter + generate row */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-bold uppercase opacity-70">Mood</label>
                        <select
                          value={moodFilter}
                          onChange={e => setMoodFilter(e.target.value)}
                          className="theme-input w-full p-2 rounded-lg border border-foreground/20 bg-background text-sm"
                        >
                          <option value="">Any mood</option>
                          {ALL_MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={handleGenerateLoop}
                        disabled={!!bpmError}
                        className="h-14 bg-foreground text-background hover:bg-foreground/90 font-bold text-lg rounded-2xl shadow-lg"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Roll Progression
                      </Button>
                      <Button
                        onClick={playLoop}
                        disabled={!loopChords}
                        variant="outline"
                        className="h-14 border-foreground/20 hover:bg-foreground/5 font-bold text-lg rounded-2xl"
                      >
                        {isLoopPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isLoopPlaying ? "Stop Loop" : "Play Loop"}
                      </Button>
                    </div>

                    {/* Last progression info */}
                    {lastProgInfo && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10">
                        <span className="text-[10px] font-mono opacity-40 flex-1 truncate">{lastProgInfo.raw}</span>
                        <div className="flex gap-1 shrink-0">
                          {lastProgInfo.moods.map(m => (
                            <span key={m} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-foreground/10 opacity-60">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 space-y-4">
                    <label className="text-xs font-bold uppercase opacity-70">MIDI Preview</label>
                    <Input 
                      type="file" 
                      accept=".mid" 
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setMidiFile(file);
                        setMidiData(null);
                        setMidiBpm(null);
                        setMidiTimeSig(null);
                        setParsedLyrics([]);
                        setShowLyrics(false);
                      }}
                      className="theme-input"
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          if (isMidiPlaying && !isMidiPaused && midiMode === 'soundfont') {
                            pauseMidi();
                          } else if (isMidiPaused && midiMode === 'soundfont') {
                            resumeMidi();
                          } else if (midiFile) {
                            playMidi(midiFile);
                          }
                        }}
                        disabled={!midiFile || (isMidiPlaying && midiMode === 'sine')}
                        className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl"
                      >
                        {isMidiPlaying && !isMidiPaused && midiMode === 'soundfont' ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isMidiPlaying && !isMidiPaused && midiMode === 'soundfont' ? "Pause MIDI" : (isMidiPaused && midiMode === 'soundfont') ? "Resume MIDI" : "Play MIDI"}
                      </Button>
                      {isMidiPlaying || isMidiPaused ? (
                        <Button 
                          onClick={stopMidi}
                          variant="destructive"
                          className="h-12 w-12 rounded-xl flex items-center justify-center"
                        >
                          <Square className="w-5 h-5" />
                        </Button>
                      ) : null}
                      <Button 
                        onClick={() => {
                          if (isMidiPlaying && !isMidiPaused && midiMode === 'sine') {
                            pauseMidi();
                          } else if (isMidiPaused && midiMode === 'sine') {
                            resumeMidi();
                          } else if (midiFile) {
                            playMidiSine(midiFile);
                          }
                        }}
                        disabled={!midiFile || (isMidiPlaying && midiMode === 'soundfont')}
                        variant="outline"
                        className="flex-1 h-12 font-bold rounded-xl border-primary/30 hover:bg-primary/10"
                      >
                        {isMidiPlaying && !isMidiPaused && midiMode === 'sine' ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isMidiPlaying && !isMidiPaused && midiMode === 'sine' ? "Pause Sine" : (isMidiPaused && midiMode === 'sine') ? "Resume Sine" : "Play Sine (432Hz)"}
                      </Button>
                    </div>
                    {midiData && (
                      <div className="flex items-center gap-4 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                        {midiBpm && (
                          <div className="flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">BPM:</span>
                            <span className="text-xs font-mono font-bold text-primary">{midiBpm}</span>
                          </div>
                        )}
                        {midiTimeSig && (
                          <div className="flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Time:</span>
                            <span className="text-xs font-mono font-bold text-primary">{midiTimeSig}</span>
                          </div>
                        )}
                        <div className="flex-1" />
                        <div className="text-[10px] font-mono opacity-40 uppercase font-bold">MIDI Metadata</div>
                      </div>
                    )}
                    {midiData && <PianoRoll tracks={midiData.tracks} duration={midiData.duration} currentTime={midiCurrentTime} />}
                    
                    {showLyrics && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 backdrop-blur-md shadow-xl"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <h3 className="font-bold text-lg">想念你想我 (When You Missed Me)</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10 relative">
                          {parsedLyrics.length > 0 ? (
                            parsedLyrics.map((lyric, idx) => {
                              const isActive = midiCurrentTime >= lyric.time && (idx === parsedLyrics.length - 1 || midiCurrentTime < parsedLyrics[idx + 1].time);
                              return (
                                <motion.p 
                                  key={idx}
                                  ref={isActive ? activeLyricRef : null}
                                  animate={{ 
                                    opacity: isActive ? 1 : 0.4,
                                    scale: isActive ? 1.02 : 1,
                                    color: isActive ? "#fff" : "rgba(255,255,255,0.5)"
                                  }}
                                  className={`text-sm font-medium leading-relaxed transition-all duration-300 ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : ''}`}
                                >
                                  {lyric.text}
                                </motion.p>
                              );
                            })
                          ) : (
                            <p className="text-sm text-white/40 italic">Loading lyrics...</p>
                          )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/10">
                          <p className="text-center font-serif italic text-primary/80 text-sm tracking-wide">
                            "Even after 8 years, I'm still stuck in your orbit. Like a satellite that lost its signal, I keep circling our memories, playing this melody and hoping it reaches you somewhere in the universe..."
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {loopChords && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  {/* Transpose + History toolbar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => transposeChords(-1)}
                        className="h-8 px-3 text-xs font-bold border-foreground/20 hover:bg-foreground/10"
                        title="Transpose down 1 semitone"
                      >
                        <ChevronsDown className="w-3.5 h-3.5 mr-1" />−1 st
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => transposeChords(1)}
                        className="h-8 px-3 text-xs font-bold border-foreground/20 hover:bg-foreground/10"
                        title="Transpose up 1 semitone"
                      >
                        <ChevronsUp className="w-3.5 h-3.5 mr-1" />+1 st
                      </Button>
                    </div>
                    {chordHistory.length > 0 && (
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setShowHistory(h => !h)}
                        className="h-8 px-3 text-xs font-bold border-foreground/20 hover:bg-foreground/10"
                      >
                        <History className="w-3.5 h-3.5 mr-1" />
                        History ({chordHistory.length})
                        {showHistory ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                      </Button>
                    )}
                  </div>

                  {/* Chord History Panel */}
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-2xl border border-foreground/10 bg-foreground/5 space-y-2">
                          <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider mb-3">Recent Progressions</p>
                          {chordHistory.map((entry, hi) => (
                            <div
                              key={hi}
                              onClick={() => { setLoopChords(entry.chords); setLoopKey(entry.key); setLoopScale(entry.scale); setLoopBpm(entry.bpm); setShowHistory(false); toast.success('Loaded from history'); }}
                              className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-foreground/10 cursor-pointer hover:bg-foreground/10 transition-colors group"
                            >
                              <div className="text-[10px] font-bold opacity-40 w-4 shrink-0">#{hi + 1}</div>
                              <div className="flex-1 flex flex-wrap gap-1.5">
                                {entry.chords.map((c, ci) => (
                                  <span key={ci} className="text-xs font-bold px-2 py-0.5 rounded-md bg-foreground/10">{c}</span>
                                ))}
                              </div>
                              <div className="text-[10px] opacity-40 shrink-0 text-right">
                                <div>{entry.key} {entry.scale}</div>
                                <div>{entry.bpm} BPM</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Chord cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {loopChords.map((chord, i) => (
                      <div key={i} className="theme-card p-6 flex flex-col items-center justify-center gap-2 min-h-[120px] relative overflow-hidden group">
                        <div className="absolute top-2 left-2 text-[10px] font-bold opacity-20">BAR {i + 1}</div>
                        <span className="text-3xl font-bold tracking-tighter group-hover:scale-110 transition-transform">{chord}</span>
                      </div>
                    ))}
                  </div>

                  {/* Piano Roll preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase opacity-50 tracking-wider">Piano Roll</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportLoopMidi}
                        className="h-7 px-3 text-xs font-bold border-foreground/20 hover:bg-foreground/10 gap-1.5"
                      >
                        <Download className="w-3 h-3" />
                        Export MIDI
                      </Button>
                    </div>
                    {(() => {
                      const { tracks, duration } = buildLoopPianoRoll(loopChords, loopBpm);
                      return <PianoRoll tracks={tracks} duration={duration} currentTime={loopCurrentTime} />;
                    })()}
                  </div>
                </motion.div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analyzer" className="space-y-6 sm:space-y-8 outline-none">
            <header className="text-center mb-6 sm:mb-8">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-5xl font-bold tracking-tight mb-2 sm:mb-4 drop-shadow-md"
              >
                Music Analyzer
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg max-w-2xl mx-auto opacity-80"
              >
                Extract stems, analyze theory, and download from anywhere.
              </motion.p>
            </header>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-2xl mx-auto mb-8"
            >
              <div className="flex flex-col gap-4 p-4 rounded-[32px] bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 backdrop-blur-[40px] dark:backdrop-blur-[60px] backdrop-saturate-[150%] dark:backdrop-saturate-[100%] shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Paste URL here..." 
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (e.target.value) setFile(null);
                    }}
                    className="bg-black/5 dark:bg-white/10 border-transparent focus-visible:ring-foreground focus-visible:border-black/20 dark:focus-visible:border-white/20 text-lg h-14 rounded-[20px] px-6 placeholder:text-foreground/40 transition-all font-medium"
                  />
                  <Button 
                    onClick={handleFetchInfo} 
                    disabled={loading || (!url && !file)}
                    className="h-14 px-8 bg-foreground hover:bg-foreground/90 text-background rounded-[20px] transition-all active:scale-[0.97] font-bold text-lg shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    <span className="ml-2">Load</span>
                  </Button>
                </div>
                {!videoInfo && !loading && !file && (
                  <button
                    onClick={() => { setUrl(DEMO_TRACK_URL); handleFetchInfo(DEMO_TRACK_URL); }}
                    className="self-center text-xs opacity-50 hover:opacity-90 transition-opacity underline underline-offset-4 decoration-dotted"
                  >
                    No track handy? Try a demo from SoundCloud →
                  </button>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-black/10 dark:bg-white/10"></div>
                  <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">OR</span>
                  <div className="flex-1 h-px bg-black/10 dark:bg-white/10"></div>
                </div>
                <div
                  className="flex items-center justify-center w-full"
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) handleNewFile(dropped);
                  }}
                >
                  <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-[24px] cursor-pointer transition-all active:scale-[0.98] ${
                    dragActive
                      ? "border-violet-400/60 bg-violet-500/10 ring-4 ring-violet-400/20 scale-[1.01]"
                      : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <p className="mb-1 text-sm opacity-60">
                            <span className="font-semibold">{dragActive ? "Drop it!" : "Click to upload"}</span>
                            {dragActive ? "" : " local audio — or drag & drop"}
                          </p>
                          <p className="text-xs opacity-40 font-mono">WAV, FLAC, or MP3</p>
                          {file && <p className="mt-2 text-sm text-foreground font-medium">{file.name}</p>}
                      </div>
                      <input id="dropzone-file" type="file" className="hidden" accept=".mp3,.wav,.flac,audio/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold mb-2">Supported Sites</p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs opacity-60">
                  <span>YouTube</span>
                  <span>SoundCloud</span>
                  <span>Bandcamp</span>
                  <span>Vimeo</span>
                  <span>Mixcloud</span>
                  <span>Twitch</span>
                  <span className="opacity-40">+ 1000s more via yt-dlp</span>
                </div>
              </div>
            </motion.div>

        <AnimatePresence mode="wait">
          {loading && !videoInfo ? (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              aria-hidden="true"
            >
              <div className="lg:col-span-5 space-y-6">
                <div className="theme-card aspect-video animate-pulse bg-black/5 dark:bg-white/5" />
                <div className="theme-card h-24 animate-pulse bg-black/5 dark:bg-white/5" />
              </div>
              <div className="lg:col-span-7 space-y-6">
                <div className="theme-card h-12 animate-pulse bg-black/5 dark:bg-white/5" />
                <div className="theme-card h-72 animate-pulse bg-black/5 dark:bg-white/5" />
              </div>
            </motion.div>
          ) : videoInfo ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-5 space-y-6">
                <Card className="theme-card relative overflow-hidden">
                  <div className="aspect-video relative group bg-black">
                    {videoInfo.soundcloudUrl ? (
                      <iframe
                        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(videoInfo.soundcloudUrl)}&visual=true&auto_play=false&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false`}
                        title="SoundCloud player"
                        className="w-full h-full border-0"
                        allow="autoplay"
                      />
                    ) : videoInfo.targetVideoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoInfo.targetVideoId}`}
                        title="YouTube video player"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <img 
                          src={videoInfo.thumbnail} 
                          alt={videoInfo.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                          <h3 className="font-bold text-lg line-clamp-2 text-white">{videoInfo.title}</h3>
                          <p className="text-white opacity-80 text-sm mt-1">{videoInfo.uploader}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex flex-wrap gap-2">
                      {videoInfo.soundcloudUrl ? (
                        <Badge variant="secondary" className="bg-black/10 dark:bg-white/10 opacity-80 border-none">
                          SoundCloud · streaming
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="secondary" className="bg-black/10 dark:bg-white/10 opacity-80 border-none">
                            {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                          </Badge>
                          <Badge variant="secondary" className="bg-black/10 dark:bg-white/10 opacity-80 border-none">
                            {videoInfo.view_count?.toLocaleString()} views
                          </Badge>
                        </>
                      )}
                    </div>

                    {!videoInfo.isLocal && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold opacity-40 uppercase tracking-wider">Download Raw Audio</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <Button 
                            variant="outline" 
                            className="border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 opacity-80"
                            onClick={() => handleDownload("mp3")}
                            disabled={!!downloading}
                          >
                            {downloading === "mp3" ? <Loader2 className="w-4 h-4 animate-spin" /> : "MP3"}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 opacity-80"
                            onClick={() => handleDownload("wav")}
                            disabled={!!downloading}
                          >
                            {downloading === "wav" ? <Loader2 className="w-4 h-4 animate-spin" /> : "WAV"}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 opacity-80"
                            onClick={() => handleDownload("flac")}
                            disabled={!!downloading}
                          >
                            {downloading === "flac" ? <Loader2 className="w-4 h-4 animate-spin" /> : "FLAC"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {videoInfo.isLocal && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold opacity-40 uppercase tracking-wider">Local File</h4>
                        <Button 
                          variant="outline" 
                          className="w-full border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 opacity-80"
                          onClick={() => {
                            if (audioUrl) {
                              const link = document.createElement("a");
                              link.href = audioUrl;
                              link.setAttribute("download", videoInfo.title);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Original File
                        </Button>
                      </div>
                    )}

                    {audioUrl && (
                      <div className="pt-4 border-t border-black/10 dark:border-white/10">
                        <WaveformPlayer url={audioUrl} bpm={analysis?.bpm ?? quickAnalysis?.bpm ?? null} />
                        {(quickAnalyzing || quickAnalysis || analysis) && (
                          <div className="flex items-center gap-2 mt-3" data-testid="instant-badges">
                            {quickAnalyzing && !quickAnalysis && !analysis ? (
                              <>
                                <span className="quick-badge-shimmer w-16" aria-hidden="true" />
                                <span className="quick-badge-shimmer w-24" aria-hidden="true" />
                              </>
                            ) : (
                              <>
                                <Badge variant="secondary" className="bg-black/10 dark:bg-white/10 opacity-90 border-none" data-testid="badge-bpm">
                                  {analysis?.bpm ?? quickAnalysis?.bpm} BPM
                                </Badge>
                                <Badge variant="secondary" className="bg-black/10 dark:bg-white/10 opacity-90 border-none" data-testid="badge-key">
                                  {analysis?.key ?? quickAnalysis?.key} {analysis?.scale ?? quickAnalysis?.scale}
                                </Badge>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-7">
                <Tabs defaultValue="split" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/10 dark:border-white/10 mb-6">
                    <TabsTrigger value="split" className="rounded-xl data-[state=active]:bg-foreground data-[state=active]:text-background">Split</TabsTrigger>
                    <TabsTrigger value="analyze" className="rounded-xl data-[state=active]:bg-foreground data-[state=active]:text-background">Analyze</TabsTrigger>
                    <TabsTrigger value="vibestudio" className="rounded-xl data-[state=active]:bg-foreground data-[state=active]:text-background">Vibe</TabsTrigger>
                  </TabsList>

                  <TabsContent value="split" className="mt-0">
                    <Card className="theme-card">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Scissors className="w-5 h-5 text-foreground" />
                          Stem Separation
                        </CardTitle>
                        <CardDescription className="opacity-80">
                          Split the track into individual components.
                          <p className="text-[10px] mt-1 font-bold opacity-70">Powered by {splittingModel.toUpperCase()} - Stem Separation</p>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className={`p-4 rounded-2xl bg-black/5 dark:bg-white/10 border transition-all duration-500 space-y-4 ${
                          betaMode
                            ? 'border-violet-400/30 shadow-[0_0_24px_rgba(139,92,246,0.12)]'
                            : 'border-black/10 dark:border-white/10'
                        }`}>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold opacity-70 uppercase tracking-wider">
                              Select Model {betaMode && <span className="text-violet-400 ml-1">— Beta Tiers</span>}
                            </h4>
                            {splitterAvailability && Object.values(splitterAvailability).every(v => !v) && (
                              <span className="text-[10px] opacity-60">hosted: none installed</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'demucs',      name: 'Demucs',      beta: false, tier: 'stable'       },
                              { id: 'mdx',         name: 'MDX-Net',     beta: false, tier: 'experimental' },
                              { id: 'spleeter',    name: 'Spleeter',    beta: false, tier: 'legacy'       },
                              { id: 'bs-roformer', name: 'BS-Roformer', beta: false, tier: 'experimental' },
                            ].map((modelObj) => {
                              const isAvailable = splitterAvailability?.[modelObj.id] ?? true;
                              const isBetaLocked = !betaMode && modelObj.beta;
                              const isSelected = splittingModel === modelObj.id;
                              const showBeta = betaMode ? modelObj.tier === 'experimental' : modelObj.beta;
                              const isLegacy = modelObj.tier === 'legacy';
                              const cfg = MODEL_CONFIGS[modelObj.id];
                              const handleClick = () => {
                                if (isBetaLocked) {
                                  toast.info(`${modelObj.name} is still being trialed in beta mode — available soon.`, {
                                    icon: '🔒',
                                    duration: 5000,
                                  });
                                } else if (isAvailable) {
                                  setSplittingModel(modelObj.id as any);
                                  const defaultVar = cfg?.defaultVariant ?? 'default';
                                  setModelVariant(defaultVar);
                                  const variantStems = cfg?.variants.find(v => v.id === defaultVar)?.stems ?? ['vocals','drums','bass','other'];
                                  setSelectedStems(variantStems);
                                } else {
                                  toast.info(`${modelObj.name} isn't installed on this server. Run the project locally to use it.`, {
                                    action: { label: "Install guide", onClick: () => window.open(splitterRepoUrl, "_blank") },
                                    duration: 6000,
                                  });
                                }
                              };
                              return (
                                <div
                                  key={modelObj.id}
                                  onClick={handleClick}
                                  title={
                                    isBetaLocked ? `${modelObj.name} — available soon (currently trialing in beta mode)`
                                      : isLegacy ? 'Legacy model — use Demucs first; choose Spleeter only if another model is troublesome.'
                                      : isAvailable ? modelObj.name
                                      : `${modelObj.name} requires a local install — click for setup`
                                  }
                                  className={`relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all overflow-hidden ${
                                    !isAvailable || isBetaLocked
                                      ? "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 opacity-40 cursor-not-allowed hover:opacity-60"
                                      : isSelected && betaMode && modelObj.tier === 'experimental'
                                        ? "cursor-pointer bg-violet-500/10 border-violet-400/40 text-foreground shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                                        : isSelected
                                          ? "cursor-pointer bg-foreground/10 border-foreground/30 text-foreground"
                                          : "cursor-pointer bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10 opacity-70 hover:bg-black/10 dark:hover:bg-white/10"
                                  }`}
                                >
                                  {/* β corner ribbon */}
                                  {showBeta && isAvailable && (
                                    <span className="absolute top-0 right-0 px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase rounded-bl-lg bg-violet-500/15 text-violet-500 dark:text-violet-300 border-b border-l border-violet-400/25 leading-tight select-none">
                                      β
                                    </span>
                                  )}
                                  <span className="text-sm font-medium">{modelObj.name}</span>
                                  {isAvailable && !isBetaLocked && (
                                    <span className="text-[9px] opacity-50 font-mono">{cfg?.execution}</span>
                                  )}
                                   {isAvailable && isLegacy && (
                                     <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300 opacity-90">
                                       Legacy · fallback
                                     </span>
                                   )}
                                   {betaMode && isAvailable && !isLegacy && (
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                      modelObj.tier === 'stable' ? 'text-green-500 dark:text-green-400 opacity-70' : 'text-violet-400 opacity-80'
                                    }`}>
                                      {modelObj.tier === 'stable' ? '✓ stable' : '⚗ experimental'}
                                    </span>
                                  )}
                                  {!isAvailable && (
                                    <span className="text-[10px] opacity-70">Local install</span>
                                  )}
                                  {isAvailable && isBetaLocked && (
                                    <span className="text-[10px] opacity-70 text-violet-400">Available soon</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {splitterAvailability && Object.values(splitterAvailability).every(v => !v) && (
                            <p className="text-[11px] opacity-70 leading-relaxed">
                              Stem splitting needs heavy ML runtimes (PyTorch / ONNX) that aren't on the hosted version.
                              {" "}
                              <a
                                href={splitterRepoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline hover:opacity-100 opacity-90"
                              >
                                Install locally from GitHub →
                              </a>
                            </p>
                          )}
                        </div>

                        {/* Variant selector — shown when the active model has multiple variants */}
                        {(() => {
                          const cfg = MODEL_CONFIGS[splittingModel];
                          if (!cfg || cfg.variants.length <= 1) return null;
                          return (
                            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 space-y-3">
                              <h4 className="text-sm font-bold opacity-70 uppercase tracking-wider">Variant</h4>
                              <div className="flex flex-col gap-2">
                                {cfg.variants.filter(v => betaMode || !BVR_VARIANT_IDS.includes(v.id)).map(v => {
                                  const isBvr = BVR_VARIANT_IDS.includes(v.id);
                                  return (
                                    <button
                                      key={v.id}
                                      onClick={() => {
                                        setModelVariant(v.id);
                                        const kept = selectedStems.filter(s => v.stems.includes(s));
                                        setSelectedStems(kept.length > 0 ? kept : v.stems);
                                      }}
                                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                                        modelVariant === v.id
                                          ? isBvr
                                            ? 'bg-pink-500/10 border-pink-400/40 text-foreground'
                                            : 'bg-foreground/10 border-foreground/30 text-foreground'
                                          : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 opacity-60 hover:opacity-90'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        {isBvr && <Users className="w-3 h-3 text-pink-400 shrink-0" />}
                                        {v.label}
                                      </span>
                                      <span className="font-normal opacity-60">{v.desc}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* BVR pipeline info card — shown when a karaoke/BVR variant is active */}
                        {BVR_VARIANT_IDS.includes(modelVariant) && (
                          <div className="p-4 rounded-2xl border border-pink-400/20 bg-pink-500/5 space-y-3">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-pink-400 shrink-0" />
                              <h4 className="text-sm font-bold text-pink-400 uppercase tracking-wider">Backing Vocal Removal</h4>
                            </div>
                            <p className="text-[11px] opacity-70 leading-relaxed">
                              Runs a <span className="font-semibold opacity-90">2-pass pipeline</span> — modelled after the professional LALAL.AI workflow.
                            </p>
                            <div className="flex items-center gap-1 text-[10px] font-mono opacity-60 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">Full Track</span>
                              <span>→</span>
                              <span className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">Pass 1: Vocal Isolation</span>
                              <span>→</span>
                              <span className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">All Vocals</span>
                              <span>→</span>
                              <span className="px-2 py-0.5 rounded bg-pink-500/15 border border-pink-400/20">Pass 2: Lead / Backing Split</span>
                            </div>
                            <div className="flex gap-3 text-[10px] opacity-60">
                              <span>⏱ ~2× processing time</span>
                              <span>·</span>
                              <span>🖥 requires local install</span>
                            </div>
                          </div>
                        )}

                        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 space-y-4">
                          {(() => {
                            const cfg = MODEL_CONFIGS[splittingModel];
                            const availableStems = cfg?.variants.find(v => v.id === modelVariant)?.stems ?? ['vocals','drums','bass','other'];
                            const allAvailableSelected = availableStems.every(s => selectedStems.includes(s));
                            return (
                              <>
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-bold opacity-70 uppercase tracking-wider">Select Stems</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleAllStems}
                                    className="text-xs hover:bg-black/5 dark:hover:bg-white/5"
                                  >
                                    {allAvailableSelected ? "Deselect All" : "Select All"}
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  {ALL_STEMS.map((stem) => {
                                    const isLocked = !availableStems.includes(stem.id);
                                    return (
                                      <div
                                        key={stem.id}
                                        onClick={() => !isLocked && toggleStem(stem.id)}
                                        title={isLocked ? `Not available with the selected model/variant` : undefined}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                          isLocked
                                            ? 'opacity-20 cursor-not-allowed bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5'
                                            : selectedStems.includes(stem.id)
                                              ? 'cursor-pointer bg-foreground/10 border-foreground/30 text-foreground'
                                              : 'cursor-pointer bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10 opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
                                        }`}
                                      >
                                        <stem.icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{stem.label}</span>
                                        {isLocked && <span className="ml-auto text-[9px] opacity-60">N/A</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        <Button 
                          onClick={handleSplit} 
                          disabled={splitting || selectedStems.length === 0}
                          className="w-full h-14 bg-foreground hover:bg-foreground/90 text-background font-bold text-lg rounded-2xl shadow-lg"
                        >
                          {splitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Stemming...
                            </>
                          ) : (
                            <>
                              <Scissors className="w-5 h-5 mr-2" />
                              Stem it!
                            </>
                          )}
                        </Button>
                        {/* Step-by-step progress — shown while splitting or on error */}
                        {(splitting || splitError) && (() => {
                          const isBvr = BVR_VARIANT_IDS.includes(modelVariant);
                          const isLocalFile = !!uploadedFilename;
                          const steps = buildSplitSteps(isLocalFile, isBvr);
                          const activeId = stageToStepId(splitStage, splitPass, isBvr);
                          const errorId = splitError
                            ? stageToStepId(splitError.stage, splitError.pass, isBvr)
                            : null;
                          return (
                            <StepProgress
                              steps={steps}
                              activeId={activeId}
                              errorId={errorId}
                              errorMessage={splitError?.message}
                              estimateHint={getSplitEstimate(splittingModel, isBvr)}
                            />
                          );
                        })()}

                        {/* Split log panel — visible while splitting or after it finishes */}
                        {splitLogs.length > 0 && (
                          <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-black/10 dark:bg-white/5 border-b border-black/10 dark:border-white/10">
                              <span className={`w-2 h-2 rounded-full ${splitting ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                              <span className="text-[11px] font-mono font-bold opacity-60 uppercase tracking-widest">
                                {splitting ? 'Processing...' : 'Done'}
                              </span>
                            </div>
                            <div
                              ref={splitLogRef}
                              className="font-mono text-[11px] leading-relaxed p-4 max-h-48 overflow-y-auto bg-black/5 dark:bg-black/30 space-y-0.5"
                            >
                              {splitLogs.map((line, i) => (
                                <div
                                  key={i}
                                  className={`${line.startsWith('ERROR') ? 'text-red-400' : 'opacity-80'}`}
                                >
                                  <span className="opacity-40 mr-2 select-none">›</span>{line}
                                </div>
                              ))}
                              {splitting && (
                                <div className="opacity-40 animate-pulse">
                                  <span className="mr-2 select-none">›</span>▌
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Live stem mixer — volume / solo / mute + bounce */}
                        {stemPreviews.length > 0 && (
                          <div ref={resultsRef} className="scroll-mt-24">
                          <StemMixer
                            stems={stemPreviews.map((stem) => {
                              const meta = ALL_STEMS.find(s => s.id === stem.name);
                              return {
                                name: stem.name,
                                url: stem.url,
                                label: meta?.label ?? stem.name,
                                icon: meta?.icon ?? Music2,
                              };
                            })}
                            channels={mixerChannels}
                            onChannelsChange={setMixerChannels}
                            exportName={videoInfo?.title ?? uploadedFilename ?? "remix"}
                          />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analyze" className="mt-0">
                    <Card className="theme-card">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-foreground" />
                          Music Theory Analysis
                        </CardTitle>
                        <CardDescription className="opacity-80">
                          Extract key, BPM, scale, and mood from the audio.
                          <p className="text-[10px] mt-1 font-bold opacity-70">Powered by Essentia.js - Music Analysis</p>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {!analysis ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/10 dark:border-white/10">
                              <BarChart3 className="w-10 h-10 text-foreground opacity-70" />
                            </div>
                            <div className="space-y-2">
                              <p className="opacity-80">Ready to analyze the harmonic and rhythmic structure.</p>
                              <Button 
                                onClick={handleAnalyze} 
                                disabled={analyzing || (!audioUrl && !url)}
                                className="bg-foreground hover:bg-foreground/90 text-background font-bold px-8 h-12 rounded-xl"
                              >
                                {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                                Start Analysis
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                                <p className="text-[10px] opacity-70 uppercase font-bold mb-1">Tempo</p>
                                <p className="text-3xl font-bold text-foreground">
                                  {betaMode ? analysis.rawBpm ?? analysis.bpm : analysis.bpm}{' '}
                                  <span className="text-sm font-normal opacity-40">BPM</span>
                                </p>
                              </div>
                              <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                                <p className="text-[10px] opacity-70 uppercase font-bold mb-1">Key & Scale</p>
                                <p className="text-3xl font-bold text-foreground">{analysis.key} <span className="text-sm font-normal opacity-40">{analysis.scale}</span></p>
                              </div>
                              <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                                <p className="text-[10px] opacity-70 uppercase font-bold mb-1">Mood</p>
                                <p className="text-3xl font-bold text-foreground">{analysis.mood}</p>
                              </div>
                              <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                                <p className="text-[10px] opacity-70 uppercase font-bold mb-1">Energy</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <Progress value={analysis.energy * 100} className="h-2 bg-black/10 dark:bg-white/10" />
                                  <span className="text-sm font-bold">{Math.round(analysis.energy * 100)}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Cross-tab jumps — bridge analysis into the other tools */}
                            <div className="flex flex-wrap gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs"
                                onClick={() => {
                                  const normScale = analysis.scale?.toLowerCase() === 'minor' ? 'Minor' : 'Major';
                                  setSourceKey(analysis.key);
                                  setSourceScale(normScale);
                                  setComposerHighlightKey({ key: analysis.key, scale: normScale });
                                  setActiveTab('composer');
                                  toast.success(`Sent ${analysis.key} ${analysis.scale} → Composer`);
                                }}
                              >
                                → Open key in Composer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs"
                                onClick={sendToLoopStudio}
                              >
                                → Send to Loop Studio
                              </Button>
                            </div>

                            {/* Extended raw analysis — beta mode only */}
                            <AnimatePresence>
                              {betaMode && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 rounded-2xl border border-violet-400/25 bg-violet-500/5 space-y-3">
                                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                                      <FlaskConical className="w-3 h-3" />
                                      Raw Data — Extended Analysis
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <p className="text-[9px] opacity-50 uppercase tracking-wider mb-0.5">Danceability</p>
                                        <p className="text-xl font-bold font-mono text-foreground">{Math.round((analysis.danceability ?? 0) * 100)}<span className="text-xs font-normal opacity-40">%</span></p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] opacity-50 uppercase tracking-wider mb-0.5">Key Strength</p>
                                        <p className="text-xl font-bold font-mono text-foreground">{analysis.keyStrength ?? '—'}<span className="text-xs font-normal opacity-40">%</span></p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] opacity-50 uppercase tracking-wider mb-0.5">Loudness</p>
                                        <p className="text-xl font-bold font-mono text-foreground">{analysis.loudness ?? '—'}<span className="text-xs font-normal opacity-40"> dBFS</span></p>
                                      </div>
                                    </div>
                                    <p className="text-[9px] opacity-40 italic">⚠ BPM + Key via real Essentia when available. Danceability, mood, and energy are estimated.</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold opacity-40 uppercase tracking-wider">Stem Preview (Mockup)</h4>
                          <div className="space-y-4 p-5 bg-black/5 dark:bg-white/10 rounded-2xl border border-black/10 dark:border-white/10">
                            {[
                              { id: "vocals", label: "Vocals", icon: Mic2, color: "text-blue-400" },
                              { id: "drums", label: "Drums", icon: Drum, color: "text-red-400" },
                              { id: "bass", label: "Bass", icon: Guitar, color: "text-yellow-400" },
                              { id: "other", label: "Other", icon: Piano, color: "text-green-400" },
                            ].map((stem) => (
                              <div key={stem.id} className="flex items-center gap-4">
                                <stem.icon className={`w-4 h-4 ${stem.color}`} />
                                <span className="text-xs font-bold w-16 opacity-60">{stem.label}</span>
                                <Slider 
                                  value={[stemVolumes[stem.id as keyof typeof stemVolumes]]} 
                                  onValueChange={(val) => setStemVolumes(prev => ({...prev, [stem.id]: val[0]}))}
                                  max={100} 
                                  step={1} 
                                  className="flex-1" 
                                />
                                <span className="text-[10px] font-mono opacity-40 w-8 text-right">{stemVolumes[stem.id as keyof typeof stemVolumes]}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="vibestudio" className="mt-0">
                    <Card className="theme-card">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                          Vibe Studio
                        </CardTitle>
                        <CardDescription className="opacity-80">
                          Generate AI chord progressions based on the track's vibe.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-8">
                        {!analysis ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center">
                              <Info className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="opacity-60">Analyze a track first to extract its vibe.</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                              <div className="flex-1">
                                <p className="text-[10px] opacity-70 uppercase font-bold mb-1">Current Vibe</p>
                                <p className="text-xl font-bold">{analysis.key} {analysis.scale} • {analysis.mood} • {analysis.bpm} BPM</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={sendToLoopStudio}
                                className="shrink-0 font-bold border-foreground/20 hover:bg-foreground/10 gap-1.5"
                                title="Copy key + BPM to Loop Studio and switch tabs"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                Loop Studio
                              </Button>
                            </div>

                            <div className="p-6 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                              <div className="flex justify-between items-center mb-6">
                                <div>
                                  <h4 className="font-bold text-lg">AI Chord Progression</h4>
                                  <p className="text-sm opacity-80">Powered by Gemini</p>
                                </div>
                                <Button 
                                  onClick={handleGenerateChords}
                                  disabled={generatingChords}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                                >
                                  {generatingChords ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                  Generate Magic
                                </Button>
                              </div>
                              
                              {chords ? (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                                >
                                  {chords.map((chord, i) => (
                                    <div key={i} className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-xl p-6 flex items-center justify-center text-3xl font-bold shadow-lg backdrop-blur-md">
                                      {chord}
                                    </div>
                                  ))}
                                </motion.div>
                              ) : (
                                <div className="h-32 flex items-center justify-center border-2 border-dashed border-black/20 dark:border-white/20 rounded-xl bg-black/5 dark:bg-white/10">
                                  <p className="opacity-70 italic">Waiting for inspiration...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

          <TabsContent value="tuner" className="space-y-6 sm:space-y-12 outline-none">
            <header className="text-center mb-6 sm:mb-12">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-5xl font-bold tracking-tight mb-2 sm:mb-4 drop-shadow-md"
              >
                Tuner
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg max-w-2xl mx-auto opacity-80"
              >
                Real-time chromatic tuning from your mic. Voice, guitar, kazoo — if it holds a pitch, we can tune it.
              </motion.p>
            </header>
            <Tuner />
          </TabsContent>

          <TabsContent value="metronome" className="space-y-6 sm:space-y-12 outline-none">
            <header className="text-center mb-6 sm:mb-12">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-5xl font-bold tracking-tight mb-2 sm:mb-4 drop-shadow-md"
              >
                Metronome
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg max-w-2xl mx-auto opacity-80"
              >
                Drift-free Web Audio timing. Tap to detect tempo, or dial it in.
              </motion.p>
            </header>
            <Metronome />
          </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/10 dark:border-white/10">
                <Music className="w-12 h-12 opacity-40" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold opacity-70">No track loaded</h2>
                <p className="opacity-70 max-w-sm">Paste a URL or upload a file above to start your music analysis journey.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Beta Lab Notes — collapsible, only visible in beta mode */}
        <AnimatePresence>
          {betaMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="mt-6"
            >
              <div className="rounded-2xl border border-violet-400/25 bg-violet-500/5 overflow-hidden">
                <button
                  onClick={() => setBetaLabOpen(o => !o)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-violet-500/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-bold text-violet-400 uppercase tracking-wider">Beta Lab Notes</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">v2-beta</span>
                  </div>
                  {betaLabOpen
                    ? <ChevronUp className="w-4 h-4 text-violet-400 opacity-60" />
                    : <ChevronDown className="w-4 h-4 text-violet-400 opacity-60" />
                  }
                </button>

                <AnimatePresence>
                  {betaLabOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-violet-400/15">
                        <p className="text-[11px] opacity-50 pt-3 italic">What's cooking in the lab. No guarantees. Fully vibes-driven engineering.</p>

                        <div className="space-y-2">
                          {[
                            { icon: "✦", label: "MDX-Net stem splitting", note: "ONNX runtime — no CUDA, no 700MB torch packages, no drama." },
                            { icon: "✦", label: "BS-Roformer stem splitting", note: "Transformer-based. Sounds intimidating. Kind of is." },
                            { icon: "✦", label: "Live split log via SSE", note: "Watch the model work in real time. Very satisfying. Very terminal-coded." },
                            { icon: "✦", label: "Song-named ZIP downloads", note: "No more job_172abc... filenames. You get Song_Name_stems.zip. Like a civilised person." },
                            { icon: "✦", label: "Extended analysis panel", note: "Raw key strength, loudness in dBFS, danceability %. Real values where Essentia provides them." },
                            { icon: "✦", label: "Demucs torchaudio fix", note: "Patched audio.py to write via soundfile directly — torchaudio 2.11 removed every non-CUDA backend and chose violence." },
                            { icon: "✦", label: "This beta mode toggle", note: "Meta. We know. But here we are, and you clicked it, so." },
                          ].map((item, i) => (
                            <div key={i} className="flex gap-3 text-sm">
                              <span className="text-violet-400 mt-0.5 shrink-0">{item.icon}</span>
                              <div>
                                <span className="font-semibold text-foreground">{item.label}</span>
                                <span className="opacity-50 ml-2 text-[11px]">{item.note}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="text-[10px] opacity-40 border-t border-violet-400/10 pt-3">
                          ⚠ BETA = "Best Effort, Technically Available". Models marked experimental require a local install. Use at your own risk and enjoy the chaos.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>
    </Tabs>
      </div>
      {/* Footer */}
      <footer className="text-center pb-6 pt-2 space-y-1 select-none">
        <div className="text-[11px] opacity-35 hover:opacity-60 transition-opacity">
          <a
            href="https://github.com/airiharuki/Harmonic-Studio-V2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline underline-offset-2"
          >
            <Github className="w-3 h-3" />
            airiharuki/Harmonic-Studio-V2
          </a>
          {" · "}
          <span>
            <s>Sponsored by Replit</s>
            {" "}
            <span className="italic">(or maybe not)</span>
          </span>
        </div>
      </footer>

      <Toaster position="bottom-right" theme={theme as any} />
      <WelcomeSplash />
    </div>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      {/* @ts-ignore */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <MainApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
/** Return a short time-estimate hint for the UI. */
function getSplitEstimate(model: string, isBvr: boolean): string {
  if (isBvr) return "BVR runs 2 passes — typically 4–8 min for a 4-min track";
  if (model === "spleeter") return "Spleeter typically finishes in ~1 min";
  if (model === "mdx") return "MDX-Net typically takes 2–3 min for a 4-min track";
  if (model === "bs-roformer") return "BS-RoFormer typically takes 2–4 min for a 4-min track";
  return "Demucs typically takes 2–4 min for a 4-min track";
}
