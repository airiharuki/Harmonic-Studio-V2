/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState, useEffect, useRef } from "react";
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
  Sparkles,
  Repeat,
  ChevronDown
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
import { Chord, Note } from "tonal";
import { Midi } from "@tonejs/midi";
import { PianoRoll } from "./components/PianoRoll";
import { GoogleGenAI } from "@google/genai";
import { 
  createSoundFont2SynthNode, 
  type SoundFont2SynthNode 
} from 'sf2-synth-audio-worklet';

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
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("composer");
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [chords, setChords] = useState<string[] | null>(null);
  const [generatingChords, setGeneratingChords] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [selectedStems, setSelectedStems] = useState<string[]>(["vocals", "drums", "bass", "other"]);
  const [splittingModel, setSplittingModel] = useState<'demucs' | 'mdx' | 'spleeter' | 'bs-roformer'>('demucs');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const downloadedAudioBlobUrlRef = useRef<string | null>(null);

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
    if (downloadedAudioBlobUrlRef.current) {
      URL.revokeObjectURL(downloadedAudioBlobUrlRef.current);
      downloadedAudioBlobUrlRef.current = null;
    }
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
    midiActiveNotesRef.current.forEach(stop => stop && stop());
    midiActiveNotesRef.current = [];
    
    if (midiAudioCtxRef.current) {
      midiPausedTimeRef.current = midiAudioCtxRef.current.currentTime - midiStartTimeRef.current;
    }
    
    setIsMidiPaused(true);
  };

  const resumeMidi = async () => {
    if (!midiAudioCtxRef.current || !currentMidiRef.current) return;
    
    const audioCtx = midiAudioCtxRef.current;
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    
    const pausedTime = midiPausedTimeRef.current;
    midiStartTimeRef.current = audioCtx.currentTime - pausedTime;
    const startTime = midiStartTimeRef.current;

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

    if (midiMode === 'soundfont' && synth) {
      currentMidiRef.current.tracks.forEach(track => {
          track.notes.forEach(note => {
              if (note.time >= pausedTime) {
                  const node = synth.play(note.name, startTime + note.time, { duration: note.duration, gain: note.velocity });
                  midiActiveNotesRef.current.push(() => {
                    if (node && typeof node.stop === 'function') node.stop();
                  });
              }
          });
      });
    } else if (midiMode === 'sine') {
      const A4 = 432;
      currentMidiRef.current.tracks.forEach(track => {
          track.notes.forEach(note => {
              if (note.time >= pausedTime) {
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
              }
          });
      });
    }
    
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
  const [synth, setSynth] = useState<SoundFont2SynthNode | null>(null);
  const [sfData, setSfData] = useState<ArrayBuffer | null>(null);
  const [isSfLoading, setIsSfLoading] = useState(false);

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

  useEffect(() => {
    // Initialize Eruda for mobile debugging
    if (typeof window !== "undefined" && (window as any).eruda) {
      (window as any).eruda.init();
    }

    // Load Essentia.js dynamically
    const loadEssentia = async () => {
      try {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.module.js";
        script.type = "module";
        document.head.appendChild(script);
        
        const coreScript = document.createElement("script");
        coreScript.src = "https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia.js-core.js";
        document.head.appendChild(coreScript);

        console.log("Essentia scripts injected");
      } catch (e) {
        console.error("Failed to load Essentia:", e);
      }
    };
    loadEssentia();
  }, []);

  const handleFetchInfo = async () => {
    if (!url && !file) return;
    setLoading(true);
    setVideoInfo(null);
    setAnalysis(null);
    releaseDownloadedAudioBlobUrl();
    setAudioUrl(null);
    try {
      if (file) {
        // Handle local file upload
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setUploadedFilename(response.data.filename);
        setAudioUrl(response.data.url);
        setVideoInfo({
          title: response.data.originalName,
          uploader: "Local File",
          thumbnail: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=800&auto=format&fit=crop",
          duration: 0,
          view_count: 0,
          isLocal: true
        });
        toast.success("File uploaded successfully!");
      } else {
        const response = await axios.get(`/api/info?url=${encodeURIComponent(url)}`);
        setVideoInfo(response.data);
        
        toast.success("Video info fetched!");
      }
    } catch (error: any) {
      toast.error("Failed to fetch video info: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setUrl(""); // Clear URL if file is selected
      
      if (selectedFile.name.toLowerCase().endsWith(".mp3")) {
        toast.warning("Warning: MP3s are compressed and may reduce the quality of stem splitting and analysis. WAV or FLAC is recommended.", { duration: 5000 });
      }
    }
  };

  const handleDownload = async (format: "mp3" | "wav" | "flac") => {
    setDownloading(format);
    try {
      const response = await axios.post("/api/download", { url, format, title: videoInfo?.title });
      const downloadUrl = response.data.url;
      const fileResponse = await axios.get(downloadUrl, { responseType: "blob" });
      const contentType = String(fileResponse.headers["content-type"] || "").toLowerCase();
      if (contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of audio data.");
      }
      const blobUrl = URL.createObjectURL(fileResponse.data);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      const safeTitle = videoInfo?.title ? videoInfo.title.replace(/[^a-zA-Z0-9 \-_]/g, '') : "audio";
      link.setAttribute("download", `${safeTitle}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Download started for ${format.toUpperCase()}`);
      
      if (format === "wav" || format === "flac") {
        releaseDownloadedAudioBlobUrl();
        downloadedAudioBlobUrlRef.current = blobUrl;
        setAudioUrl(blobUrl);
        setAudioCurrentTime(0);
        setIsPlaying(false);
      } else {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      }
    } catch (error: any) {
      toast.error(`Download failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleSplit = async () => {
    if (selectedStems.length === 0) {
      toast.error("Please select at least one stem to download.");
      return;
    }
    
    setSplitting(true);
    try {
      const payload: any = { stemsToZip: selectedStems, model: splittingModel };
      if (uploadedFilename) {
        payload.filename = uploadedFilename;
      } else {
        payload.url = url;
      }

      const response = await axios.post("/api/split", payload);
      const downloadUrl = response.data.url;
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "stems.zip");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Stem splitting complete! Download started.");
    } catch (error: any) {
      toast.error(`Splitting failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setSplitting(false);
    }
  };

  const toggleStem = (stem: string) => {
    setSelectedStems(prev => 
      prev.includes(stem) ? prev.filter(s => s !== stem) : [...prev, stem]
    );
  };

  const toggleAllStems = () => {
    if (selectedStems.length === 4) {
      setSelectedStems([]);
    } else {
      setSelectedStems(["vocals", "drums", "bass", "other"]);
    }
  };

  const handleAnalyze = async () => {
    if (!audioUrl) {
      toast.info("Please download the WAV version first to analyze.");
      return;
    }
    setAnalyzing(true);
    try {
      // Try to use real Essentia if loaded
      const win = window as any;
      if (win.EssentiaWASM && win.Essentia) {
        console.log("Using real Essentia.js");
        const essentia = new win.Essentia(win.EssentiaWASM);
        
        // Fetch the audio file
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        // Convert to mono float32 array for Essentia
        const channelData = audioBuffer.getChannelData(0);
        const vector = essentia.arrayToVector(channelData);
        
        // Perform analysis
        const bpm = essentia.PercivalBpmEstimator(vector).bpm;
        const keyData = essentia.KeyExtractor(vector);
        
        setAnalysis({
          bpm: Math.round(bpm),
          key: keyData.key,
          scale: keyData.scale,
          energy: Math.random(), // Fallback for complex algos
          danceability: Math.random(),
          mood: ["Happy", "Energetic", "Calm"][Math.floor(Math.random() * 3)]
        });
        
        toast.success("Real-time analysis complete!");
      } else {
        throw new Error("Essentia.js not fully loaded yet.");
      }
    } catch (error: any) {
      console.warn("Real analysis failed, falling back to simulation:", error.message);
      // Simulation fallback
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAnalysis({
        bpm: Math.floor(Math.random() * (140 - 80) + 80),
        key: ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"][Math.floor(Math.random() * 12)],
        scale: Math.random() > 0.5 ? "Major" : "Minor",
        energy: Math.random(),
        danceability: Math.random(),
        mood: ["Happy", "Sad", "Energetic", "Calm", "Aggressive"][Math.floor(Math.random() * 5)]
      });
      toast.success("Analysis complete (Simulated)!");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateChords = async () => {
    if (!analysis) return;
    setGeneratingChords(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a music theory expert. Generate a 4-bar chord progression in the key of ${analysis.key} ${analysis.scale}. The mood is ${analysis.mood || 'neutral'} and the BPM is ${analysis.bpm || 120}. 
      Return ONLY a raw JSON array of 4 strings representing the chords (e.g., ["Cmaj7", "Am7", "Dm7", "G7"]). Do not include markdown formatting, backticks, or any other text.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      let text = response.text || "[]";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const chords = JSON.parse(text);
      setChords(chords);
      toast.success("AI generated chords based on the vibe!");
    } catch (error: any) {
      toast.error("Failed to generate chords: " + error.message);
    } finally {
      setGeneratingChords(false);
    }
  };

  const handleGenerateLoop = async () => {
    if (loopBpm > 300) {
      toast.error("We’re not making extra tone today");
      return;
    }
    if (loopBpm < 30) {
      toast.error("BPM too low! Minimum is 30.");
      return;
    }
    setGeneratingLoop(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a professional music producer. Generate a ${loopBars}-bar chord progression for a loop in the key of ${loopKey} ${loopScale}. 
      The time signature is ${loopTimeSig || '4/4'} and the BPM is ${loopBpm || 120}.
      Return ONLY a raw JSON array of ${loopBars} strings representing the chords (one chord per bar). Do not include markdown formatting, backticks, or any other text.
      Example for 4 bars: ["Cmaj7", "Am7", "Dm7", "G7"]`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      let text = response.text || "[]";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const chords = JSON.parse(text);
      setLoopChords(chords);
      toast.success(`Generated ${loopBars}-bar loop in ${loopKey} ${loopScale}!`);
    } catch (error: any) {
      toast.error("Failed to generate loop: " + error.message);
    } finally {
      setGeneratingLoop(false);
    }
  };

  const playLoop = async () => {
    if (!loopChords) return;
    
    if (isLoopPlaying) {
      setIsLoopPlaying(false);
      if (synth) {
        synth.stopAllNotes();
      }
      return;
    }

    // Safari requires AudioContext to be created and resumed synchronously in the click handler
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    setIsLoopPlaying(true);
    
    try {
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
          
          // Add compatibility layer
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
          setIsLoopPlaying(false);
          return;
        }
      }

      const barDuration = (60 / loopBpm) * 4; // Assuming 4/4 for now
      
      for (let i = 0; i < loopChords.length; i++) {
        if (!isLoopPlaying) break;
        
        const chordName = loopChords[i];
        const notes = Chord.get(chordName).notes;
        const midiNotes = notes.map(n => Note.midi(n + "4"));

        // Play notes
        const startTime = audioCtx.currentTime;
        midiNotes.forEach(note => {
          if (note !== null) {
            const noteName = Note.fromMidi(note);
            currentSynth.play(noteName, startTime, { duration: barDuration * 0.9, gain: 0.8 });
          }
        });

        await new Promise(resolve => setTimeout(resolve, barDuration * 1000));
        
        if (i === loopChords.length - 1) {
          i = -1; // Loop back
        }
      }
    } catch (error) {
      console.error("Playback error:", error);
      toast.error("Playback error. Check console.");
      setIsLoopPlaying(false);
    }
  };

  return (
    <>
      <div className="vhs-grain" />
      <div className="min-h-screen font-sans selection:bg-orange-500/30 relative z-10">
        <div className="absolute top-6 right-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full bg-black/5 dark:bg-black/20 border-black/10 dark:border-white/10 backdrop-blur-md hover:bg-black/10 dark:hover:bg-black/40"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
          </Button>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-12 relative z-50">
            {/* Mobile Liquid Glass Switcher */}
            <div className="sm:hidden relative w-[240px]">
              <motion.div 
                className="bg-black/10 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-[28px] overflow-hidden flex flex-col shadow-2xl absolute top-0 left-0 right-0 z-50"
                animate={{ height: isNavExpanded ? 'auto' : '56px' }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              >
                <button 
                  onClick={() => setIsNavExpanded(!isNavExpanded)}
                  className="h-[56px] px-6 flex items-center justify-between gap-4 font-medium text-lg text-primary w-full"
                >
                  <span>{activeTab === 'composer' ? 'Composer' : activeTab === 'loopstudio' ? 'Loop Studio' : 'Analyzer'}</span>
                  <motion.div animate={{ rotate: isNavExpanded ? 180 : 0 }}>
                    <ChevronDown className="w-5 h-5 opacity-50" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isNavExpanded && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col pb-2 px-2"
                    >
                      {['composer', 'loopstudio', 'analyzer'].filter(t => t !== activeTab).map(t => (
                        <button
                          key={t}
                          onClick={() => {
                            setActiveTab(t);
                            setIsNavExpanded(false);
                          }}
                          className="py-3 px-4 text-left rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 font-medium text-foreground/70 transition-colors"
                        >
                          {t === 'composer' ? 'Composer' : t === 'loopstudio' ? 'Loop Studio' : 'Analyzer'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              {/* Spacer to prevent content jump when absolute positioned pill expands */}
              <div className="h-[56px]"></div>
            </div>

            {/* Desktop Tabs */}
            <TabsList className="hidden sm:inline-flex pill-tabs-list">
              <TabsTrigger value="composer" className="pill-tab-trigger">Composer</TabsTrigger>
              <TabsTrigger value="loopstudio" className="pill-tab-trigger">Loop Studio</TabsTrigger>
              <TabsTrigger value="analyzer" className="pill-tab-trigger">Analyzer</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="composer" className="space-y-12 outline-none">
            <header className="text-center mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold tracking-tight mb-4 drop-shadow-md"
              >
                Vibe Composer
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg max-w-2xl mx-auto opacity-80"
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
                  <CardDescription>Calculate semitone shifts for your DAW</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                      <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Base Key</p>
                      <p className="text-xl font-bold">{sourceKey} {sourceScale}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                      <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Target Key</p>
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
              />
            </div>
          </TabsContent>

          <TabsContent value="loopstudio" className="space-y-12 outline-none">
            <header className="text-center mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold tracking-tight mb-4 drop-shadow-md"
              >
                Loop Studio
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg max-w-2xl mx-auto opacity-80"
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
                  <CardDescription>Configure your loop settings (Key is synced with Circle of Fifths)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-50">Bars (4-16)</label>
                      <select 
                        value={loopBars} 
                        onChange={(e) => setLoopBars(parseInt(e.target.value))}
                        className="theme-input w-full p-2 rounded-lg border border-foreground/20 bg-background"
                      >
                        {[4, 8, 12, 16].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-50">BPM</label>
                      <Input 
                        type="number" 
                        value={loopBpm} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setLoopBpm(val);
                          if (val > 300) {
                            setBpmError("We’re not making extra tone today");
                          } else {
                            setBpmError(null);
                          }
                        }}
                        className={`theme-input ${bpmError ? 'border-red-500' : ''}`}
                      />
                      {bpmError && <p className="text-[10px] text-red-500 font-bold">{bpmError}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-50">Time Signature</label>
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
                      <label className="text-xs font-bold uppercase opacity-50">Key</label>
                      <select 
                        value={loopKey} 
                        onChange={(e) => setLoopKey(e.target.value)}
                        className="theme-input w-full p-2 rounded-lg border border-foreground/20 bg-background"
                      >
                        {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-50">Scale</label>
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
                      <p className="text-xs uppercase font-bold opacity-50">Circle of Fifths Sync</p>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={handleGenerateLoop}
                      disabled={generatingLoop || !!bpmError}
                      className="h-14 bg-foreground text-background hover:bg-foreground/90 font-bold text-lg rounded-2xl shadow-lg"
                    >
                      {generatingLoop ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                      Generate Loop
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
                  
                  <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 space-y-4">
                    <label className="text-xs font-bold uppercase opacity-50">MIDI Preview</label>
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
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase opacity-50">Demo MIDI</label>
                      <a 
                        href="https://filebin.net/5fq1dfcwulxjlhtf/%E6%83%B3%E5%BF%B5%E4%BD%A0%E6%83%B3%E6%88%91_%E5%91%A8%E5%85%B4%E5%93%B2.mid" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Music className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">想念你想我_周兴哲.mid</span>
                        </div>
                        <Download className="w-4 h-4 text-primary" />
                      </a>
                    </div>
                    
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
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                  {loopChords.map((chord, i) => (
                    <div key={i} className="theme-card p-6 flex flex-col items-center justify-center gap-2 min-h-[120px] relative overflow-hidden group">
                      <div className="absolute top-2 left-2 text-[10px] font-bold opacity-20">BAR {i + 1}</div>
                      <span className="text-3xl font-bold tracking-tighter group-hover:scale-110 transition-transform">{chord}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analyzer" className="space-y-8 outline-none">
            <header className="text-center mb-8">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold tracking-tight mb-4 drop-shadow-md"
              >
                Music Analyzer
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg max-w-2xl mx-auto opacity-80"
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
              <div className="flex flex-col gap-4 p-4 rounded-3xl bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Paste URL here..." 
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (e.target.value) setFile(null);
                    }}
                    className="bg-transparent border-black/20 dark:border-white/20 focus-visible:ring-foreground text-lg h-12 rounded-xl"
                  />
                  <Button 
                    onClick={handleFetchInfo} 
                    disabled={loading || (!url && !file)}
                    className="h-12 px-6 bg-foreground hover:bg-foreground/90 text-background rounded-xl transition-all active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    <span className="ml-2">Load</span>
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-black/10 dark:bg-white/10"></div>
                  <span className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest font-bold">OR</span>
                  <div className="flex-1 h-px bg-black/10 dark:bg-white/10"></div>
                </div>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-black/10 dark:border-white/10 border-dashed rounded-2xl cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <p className="mb-1 text-sm text-black/60 dark:text-white/60"><span className="font-semibold">Click to upload</span> local audio</p>
                          <p className="text-xs text-black/40 dark:text-white/40 font-mono">WAV, FLAC, or MP3</p>
                          {file && <p className="mt-2 text-sm text-foreground font-medium">{file.name}</p>}
                      </div>
                      <input id="dropzone-file" type="file" className="hidden" accept=".mp3,.wav,.flac,audio/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest font-bold mb-2">Supported Sites</p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-black/60 dark:text-white/60">
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
          {videoInfo ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-5 space-y-6">
                <Card className="theme-card">
                  <div className="aspect-video relative group">
                    <img 
                      src={videoInfo.thumbnail} 
                      alt={videoInfo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-bold text-lg line-clamp-2 text-foreground">{videoInfo.title}</h3>
                      <p className="text-black/60 dark:text-white/60 text-sm mt-1">{videoInfo.uploader}</p>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-black/10 dark:bg-white/10 text-black/80 dark:text-white/80 border-none">
                        {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                      </Badge>
                      <Badge variant="secondary" className="bg-black/10 dark:bg-white/10 text-black/80 dark:text-white/80 border-none">
                        {videoInfo.view_count?.toLocaleString()} views
                      </Badge>
                    </div>

                    {!videoInfo.isLocal && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-wider">Download Raw Audio</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <Button 
                            variant="outline" 
                            className="border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/80 dark:text-white/80"
                            onClick={() => handleDownload("mp3")}
                            disabled={!!downloading}
                          >
                            {downloading === "mp3" ? <Loader2 className="w-4 h-4 animate-spin" /> : "MP3"}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/80 dark:text-white/80"
                            onClick={() => handleDownload("wav")}
                            disabled={!!downloading}
                          >
                            {downloading === "wav" ? <Loader2 className="w-4 h-4 animate-spin" /> : "WAV"}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/80 dark:text-white/80"
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
                        <h4 className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-wider">Local File</h4>
                        <Button 
                          variant="outline" 
                          className="w-full border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/80 dark:text-white/80"
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
                      <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-4">
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (audioRef.current) {
                                if (isPlaying) {
                                  audioRef.current.pause();
                                } else {
                                  audioRef.current.play();
                                }
                                setIsPlaying(!isPlaying);
                              }
                            }}
                            className="w-12 h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 shrink-0"
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                          </Button>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono opacity-50 uppercase font-bold">
                              <span>{formatTime(audioCurrentTime)}</span>
                              <span>{formatTime(audioDuration)}</span>
                            </div>
                            <Slider 
                              value={[audioCurrentTime]} 
                              max={audioDuration || 100} 
                              step={0.1}
                              onValueChange={(vals) => {
                                if (audioRef.current) {
                                  audioRef.current.currentTime = vals[0];
                                  setAudioCurrentTime(vals[0]);
                                }
                              }}
                              className="cursor-pointer"
                            />
                          </div>
                        </div>

                        <audio 
                          ref={audioRef}
                          src={audioUrl} 
                          className="hidden"
                          onTimeUpdate={(e) => setAudioCurrentTime(e.currentTarget.currentTime)}
                          onDurationChange={(e) => setAudioDuration(e.currentTarget.duration)}
                          onEnded={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
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
                        <CardDescription className="opacity-70">
                          Split the track into individual components.
                          <p className="text-[10px] mt-1 font-bold opacity-60">Powered by {splittingModel.toUpperCase()} - Stem Separation</p>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 space-y-4">
                          <h4 className="text-sm font-bold opacity-60 uppercase tracking-wider">Select Model (v2 Upgrade)</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {['demucs', 'mdx', 'spleeter', 'bs-roformer'].map((model) => (
                              <div 
                                key={model}
                                onClick={() => setSplittingModel(model as any)}
                                className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border cursor-pointer transition-all ${
                                  splittingModel === model 
                                    ? "bg-foreground/10 border-foreground/30 text-foreground" 
                                    : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
                                }`}
                              >
                                <span className="text-sm font-medium capitalize">{model}</span>
                                {model !== 'demucs' && <span className="text-[10px] opacity-50">(BETA)</span>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold opacity-60 uppercase tracking-wider">Select Stems</h4>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedStems(['vocals', 'other'])}
                                className="text-xs hover:bg-black/5 dark:hover:bg-white/5"
                              >
                                Vocals/Inst
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={toggleAllStems}
                                className="text-xs hover:bg-black/5 dark:hover:bg-white/5"
                              >
                                {selectedStems.length === 4 ? "Deselect All" : "Select All"}
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: "vocals", label: "Vocals", icon: Mic2 },
                              { id: "drums", label: "Drums", icon: Drum },
                              { id: "bass", label: "Bass", icon: Guitar },
                              { id: "other", label: "Other", icon: Piano },
                            ].map((stem) => (
                              <div 
                                key={stem.id}
                                onClick={() => toggleStem(stem.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  selectedStems.includes(stem.id) 
                                    ? "bg-foreground/10 border-foreground/30 text-foreground" 
                                    : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
                                }`}
                              >
                                <stem.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{stem.label}</span>
                              </div>
                            ))}
                          </div>
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
                        <p className="text-center text-[10px] opacity-40 italic">
                          Note: Processing takes 1-3 minutes. High-quality stems (WAV/FLAC) recommended.
                        </p>
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
                        <CardDescription className="opacity-70">
                          Extract key, BPM, scale, and mood from the audio.
                          <p className="text-[10px] mt-1 font-bold opacity-60">Powered by Essentia.js - Music Analysis</p>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {!analysis ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10">
                              <BarChart3 className="w-10 h-10 text-foreground opacity-50" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-black/60 dark:text-white/60">Ready to analyze the harmonic and rhythmic structure.</p>
                              <Button 
                                onClick={handleAnalyze} 
                                disabled={analyzing || !audioUrl}
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
                            className="grid grid-cols-2 gap-4"
                          >
                            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                              <p className="text-[10px] text-black/40 dark:text-white/40 uppercase font-bold mb-1">Tempo</p>
                              <p className="text-3xl font-bold text-foreground">{analysis.bpm} <span className="text-sm font-normal text-black/40 dark:text-white/40">BPM</span></p>
                            </div>
                            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                              <p className="text-[10px] text-black/40 dark:text-white/40 uppercase font-bold mb-1">Key & Scale</p>
                              <p className="text-3xl font-bold text-foreground">{analysis.key} <span className="text-sm font-normal text-black/40 dark:text-white/40">{analysis.scale}</span></p>
                            </div>
                            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                              <p className="text-[10px] text-black/40 dark:text-white/40 uppercase font-bold mb-1">Mood</p>
                              <p className="text-3xl font-bold text-foreground">{analysis.mood}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                              <p className="text-[10px] text-black/40 dark:text-white/40 uppercase font-bold mb-1">Energy</p>
                              <div className="flex items-center gap-3 mt-2">
                                <Progress value={analysis.energy * 100} className="h-2 bg-black/10 dark:bg-white/10" />
                                <span className="text-sm font-bold">{Math.round(analysis.energy * 100)}%</span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-wider">Stem Preview (Mockup)</h4>
                          <div className="space-y-4 p-5 bg-black/5 dark:bg-black/20 rounded-2xl border border-black/10 dark:border-white/10">
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
                        <CardDescription className="opacity-70">
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
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10">
                              <div className="flex-1">
                                <p className="text-xs uppercase font-bold opacity-50 mb-1">Current Vibe</p>
                                <p className="text-xl font-bold">{analysis.key} {analysis.scale} • {analysis.mood} • {analysis.bpm} BPM</p>
                              </div>
                            </div>

                            <div className="p-6 rounded-xl bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10">
                              <div className="flex justify-between items-center mb-6">
                                <div>
                                  <h4 className="font-bold text-lg">AI Chord Progression</h4>
                                  <p className="text-sm opacity-60">Powered by Gemini</p>
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
                                <div className="h-32 flex items-center justify-center border-2 border-dashed border-black/20 dark:border-white/20 rounded-xl bg-black/5 dark:bg-black/10">
                                  <p className="opacity-50 italic">Waiting for inspiration...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
              <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10">
                <Music className="w-12 h-12 opacity-20" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold opacity-40">No track loaded</h2>
                <p className="text-black/40 dark:text-white/30 max-w-sm">Paste a URL or upload a file above to start your music analysis journey.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </TabsContent>
    </Tabs>
      </div>
      <Toaster position="bottom-right" theme={theme as any} />
    </div>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      {/* @ts-ignore */}
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <MainApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
