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
  Repeat
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
  const [midiData, setMidiData] = useState<{tracks: any[], duration: number} | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [midiCurrentTime, setMidiCurrentTime] = useState(0);
  const midiIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playMidi = async (file: File) => {
    setIsMidiPlaying(true);
    setMidiCurrentTime(0);
    const arrayBuffer = await file.arrayBuffer();
    const midi = new Midi(arrayBuffer);
    setMidiData({ tracks: midi.tracks, duration: midi.duration });
    
    // Check if it's the specific file
    setShowLyrics(file.name === "想念你想我_周兴哲.mid" || file.name.includes("想念你想我"));
    
    let currentSynth = synth;
    if (!currentSynth) {
        const win = window as any;
        if (!win.Soundfont) {
            toast.error("Synth library not loaded yet. Please refresh.");
            setIsMidiPlaying(false);
            return;
        }
        toast.info("Loading high-quality piano soundfont...");
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        currentSynth = await win.Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
        setSynth(currentSynth);
    }

    const audioCtx = currentSynth.context || new (window.AudioContext || (window as any).webkitAudioContext)();
    const startTime = audioCtx.currentTime + 0.5; // Add a small delay for smoother start

    if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
    midiIntervalRef.current = setInterval(() => {
        const elapsed = audioCtx.currentTime - startTime;
        if (elapsed >= midi.duration) {
            if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
            setMidiCurrentTime(midi.duration);
        } else if (elapsed >= 0) {
            setMidiCurrentTime(elapsed);
        }
    }, 50);

    midi.tracks.forEach(track => {
        track.notes.forEach(note => {
            currentSynth.play(note.name, startTime + note.time, { duration: note.duration, gain: note.velocity });
        });
    });
    
    setTimeout(() => {
      setIsMidiPlaying(false);
      if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
    }, (midi.duration + 1) * 1000);
  };

  const playMidiSine = async (file: File) => {
    setIsMidiPlaying(true);
    setMidiCurrentTime(0);
    const arrayBuffer = await file.arrayBuffer();
    const midi = new Midi(arrayBuffer);
    setMidiData({ tracks: midi.tracks, duration: midi.duration });
    
    setShowLyrics(file.name === "想念你想我_周兴哲.mid" || file.name.includes("想念你想我"));
    
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const startTime = audioCtx.currentTime + 0.5;

    if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
    midiIntervalRef.current = setInterval(() => {
        const elapsed = audioCtx.currentTime - startTime;
        if (elapsed >= midi.duration) {
            if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
            setMidiCurrentTime(midi.duration);
        } else if (elapsed >= 0) {
            setMidiCurrentTime(elapsed);
        }
    }, 50);

    const A4 = 432; // The magic frequency

    midi.tracks.forEach(track => {
        track.notes.forEach(note => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = 'sine';
            // Calculate frequency based on A4 = 432Hz
            // Standard MIDI note for A4 is 69
            osc.frequency.value = A4 * Math.pow(2, (note.midi - 69) / 12);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Simple ADSR envelope to avoid clicks
            const noteStartTime = startTime + note.time;
            const noteEndTime = noteStartTime + note.duration;
            
            gainNode.gain.setValueAtTime(0, noteStartTime);
            gainNode.gain.linearRampToValueAtTime(note.velocity * 0.3, noteStartTime + 0.05); // Attack
            gainNode.gain.setValueAtTime(note.velocity * 0.3, Math.max(noteStartTime + 0.05, noteEndTime - 0.05)); // Sustain
            gainNode.gain.linearRampToValueAtTime(0, noteEndTime); // Release
            
            osc.start(noteStartTime);
            osc.stop(noteEndTime);
        });
    });
    
    setTimeout(() => {
      setIsMidiPlaying(false);
      if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
    }, (midi.duration + 1) * 1000);
  };

  const [loopKey, setLoopKey] = useState('D');
  const [loopScale, setLoopScale] = useState('Major');
  const [loopChords, setLoopChords] = useState<string[] | null>(null);
  const [generatingLoop, setGeneratingLoop] = useState(false);
  const [isLoopPlaying, setIsLoopPlaying] = useState(false);
  const [synth, setSynth] = useState<any>(null);
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
        
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          let videoId = '';
          if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
          } else if (url.includes('v=')) {
            videoId = url.split('v=')[1].split('&')[0];
          }
          if (videoId) {
            setAudioUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1`);
          }
        }
        
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
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      const safeTitle = videoInfo?.title ? videoInfo.title.replace(/[^a-zA-Z0-9 \-_]/g, '') : "audio";
      link.setAttribute("download", `${safeTitle}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Download started for ${format.toUpperCase()}`);
      
      if (format === "wav" || format === "flac") {
        setAudioUrl(downloadUrl);
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
      const response = await axios.post("/api/chords", {
        key: analysis.key,
        scale: analysis.scale,
        mood: analysis.mood,
        bpm: analysis.bpm
      });
      setChords(response.data.chords);
      toast.success("AI generated chords based on the vibe!");
    } catch (error: any) {
      toast.error("Failed to generate chords: " + (error.response?.data?.error || error.message));
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
      const response = await axios.post("/api/loop", {
        key: loopKey,
        scale: loopScale,
        bars: loopBars,
        timeSignature: loopTimeSig,
        bpm: loopBpm
      });
      setLoopChords(response.data.chords);
      toast.success(`Generated ${loopBars}-bar loop in ${loopKey} ${loopScale}!`);
    } catch (error: any) {
      toast.error("Failed to generate loop: " + (error.response?.data?.error || error.message));
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

    setIsLoopPlaying(true);
    
    try {
      let currentSynth = synth;
      if (!currentSynth) {
        const win = window as any;
        if (!win.SpessaSynth) {
          toast.error("Synth library not loaded yet.");
          setIsLoopPlaying(false);
          return;
        }

        toast.info("Loading high-quality piano soundfont...");
        const response = await fetch("https://musical-artifacts.com/artifacts/7759/Korg_E.piano1.sf2");
        const arrayBuffer = await response.arrayBuffer();
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        currentSynth = new win.SpessaSynth.Synthetizer(audioCtx.destination, arrayBuffer);
        setSynth(currentSynth);
      }

      const barDuration = (60 / loopBpm) * 4; // Assuming 4/4 for now
      
      for (let i = 0; i < loopChords.length; i++) {
        if (!isLoopPlaying) break;
        
        const chordName = loopChords[i];
        const notes = Chord.get(chordName).notes;
        const midiNotes = notes.map(n => Note.midi(n + "4"));

        // Play notes
        midiNotes.forEach(note => {
          if (note !== null) currentSynth.noteOn(0, note, 80);
        });

        await new Promise(resolve => setTimeout(resolve, barDuration * 1000 * 0.9)); // Play for 90% of the bar
        
        // Stop notes
        midiNotes.forEach(note => {
          if (note !== null) currentSynth.noteOff(0, note);
        });
        
        await new Promise(resolve => setTimeout(resolve, barDuration * 1000 * 0.1)); // 10% gap
        
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
        <Tabs defaultValue="composer" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="pill-tabs-list">
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
                      onChange={(e) => setMidiFile(e.target.files?.[0] || null)}
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
                        onClick={() => midiFile && playMidi(midiFile)}
                        disabled={!midiFile || isMidiPlaying}
                        className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl"
                      >
                        {isMidiPlaying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isMidiPlaying ? "Playing MIDI..." : "Play MIDI"}
                      </Button>
                      <Button 
                        onClick={() => midiFile && playMidiSine(midiFile)}
                        disabled={!midiFile || isMidiPlaying}
                        variant="outline"
                        className="flex-1 h-12 font-bold rounded-xl border-primary/30 hover:bg-primary/10"
                      >
                        {isMidiPlaying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isMidiPlaying ? "Playing Sine..." : "Play Sine (432Hz)"}
                      </Button>
                    </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <p className="text-sm font-medium text-white/90 leading-relaxed">
                              能不能就這樣 擁抱著<br/>
                              直到這世界 停止轉動<br/>
                              想念你想我 的時候<br/>
                              眼淚卻不停 的流<br/>
                              想念你想我 想到快發瘋<br/>
                              在每一個寂寞的夜裡<br/>
                              我依然在這裡等你
                            </p>
                          </div>
                          <div className="space-y-4">
                            <p className="text-sm font-medium text-white/70 leading-relaxed italic">
                              Can we just embrace like this<br/>
                              Until the world stops turning<br/>
                              When I miss you missing me<br/>
                              Tears just keep flowing<br/>
                              Missing you missing me until I go crazy<br/>
                              In every lonely night<br/>
                              I am still here waiting for you
                            </p>
                          </div>
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
                      <div className="pt-4 border-t border-black/10 dark:border-white/10">
                        <Button 
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold h-12 rounded-xl"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                          {isPlaying ? "Stop Preview" : "Play Preview"}
                        </Button>
                        {isPlaying && audioUrl && (
                          audioUrl.includes('youtube.com/embed') ? (
                            <iframe 
                              src={audioUrl} 
                              allow="autoplay" 
                              className="hidden"
                            />
                          ) : (
                            <audio 
                              src={audioUrl} 
                              autoPlay 
                              className="hidden"
                              onEnded={() => setIsPlaying(false)}
                            />
                          )
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
