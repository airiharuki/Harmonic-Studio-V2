import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { autoCorrelate, frequencyToNote, type NoteInfo } from "../lib/pitch";

const A4_OPTIONS = [432, 440, 442];
const IN_TUNE_CENTS = 5;
const HOLD_MS = 350; // keep the last note on screen briefly when detection drops

interface DisplayPitch extends NoteInfo {
  smoothedCents: number;
}

export function Tuner() {
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [a4, setA4] = useState(440);
  const [pitch, setPitch] = useState<DisplayPitch | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const a4Ref = useRef(a4);
  const lastSeenRef = useRef(0);
  const emaRef = useRef<number | null>(null);
  a4Ref.current = a4;

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close().catch(() => {});
    }
    ctxRef.current = null;
    analyserRef.current = null;
    emaRef.current = null;
    setRunning(false);
    setPitch(null);
  }, []);

  // Always leave the mic off when the component unmounts.
  useEffect(() => stop, [stop]);

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      streamRef.current = stream;
      ctxRef.current = ctx;
      analyserRef.current = analyser;

      const buffer = new Float32Array(analyser.fftSize);
      const tick = () => {
        const an = analyserRef.current;
        if (!an) return;
        an.getFloatTimeDomainData(buffer);
        const freq = autoCorrelate(buffer, ctx.sampleRate);
        if (freq > 0) {
          const note = frequencyToNote(freq, a4Ref.current);
          // Exponential smoothing kills needle jitter without feeling laggy.
          emaRef.current = emaRef.current === null ? note.cents : emaRef.current * 0.65 + note.cents * 0.35;
          lastSeenRef.current = performance.now();
          setPitch({ ...note, smoothedCents: Math.round(emaRef.current) });
        } else if (performance.now() - lastSeenRef.current > HOLD_MS) {
          setPitch(null);
          emaRef.current = null;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      setRunning(true);
    } catch (e: any) {
      if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
        setError("Microphone access was denied. Allow mic permission in your browser and try again.");
      } else if (e?.name === "NotFoundError") {
        setError("No microphone found on this device.");
      } else {
        setError("Couldn't start the microphone: " + (e?.message ?? "unknown error"));
      }
      stop();
    } finally {
      setStarting(false);
    }
  };

  const cents = pitch?.smoothedCents ?? 0;
  const absCents = Math.abs(cents);
  const status = !pitch ? "idle" : absCents <= IN_TUNE_CENTS ? "in-tune" : cents > 0 ? "sharp" : "flat";
  const needleLeft = `${50 + Math.max(-50, Math.min(50, cents))}%`;

  return (
    <div className="theme-card max-w-xl mx-auto p-6 sm:p-10 space-y-8">
      {/* Readout */}
      <div className="flex flex-col items-center gap-1 min-h-[120px] justify-center">
        {pitch ? (
          <>
            <div className="flex items-start">
              <span
                className={`text-7xl sm:text-8xl font-black tracking-tight leading-none transition-colors duration-150 ${
                  status === "in-tune" ? "text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_24px_rgba(16,185,129,0.45)]" : ""
                }`}
              >
                {pitch.name}
              </span>
              <span className="text-2xl font-bold opacity-50 mt-2 ml-1">{pitch.octave}</span>
            </div>
            <p className="text-sm font-mono opacity-50">
              {pitch.frequency.toFixed(1)} Hz · {cents > 0 ? "+" : ""}{cents}¢
            </p>
          </>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-4xl font-black opacity-15 tracking-widest">— ♪ —</p>
            <p className="text-sm opacity-40">
              {running ? "Play a note — instrument or voice" : "Start the mic to tune"}
            </p>
          </div>
        )}
      </div>

      {/* Cents needle */}
      <div className="space-y-2">
        <div className="relative h-3 rounded-full bg-black/5 dark:bg-white/10 overflow-visible">
          {/* zone markers */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/30 -translate-x-1/2" />
          <div className="absolute left-[45%] top-0 bottom-0 w-px bg-foreground/15" />
          <div className="absolute left-[55%] top-0 bottom-0 w-px bg-foreground/15" />
          {/* needle */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-[left,background-color] duration-100 ${
              status === "in-tune"
                ? "bg-emerald-500 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                : status === "sharp" || status === "flat"
                  ? "bg-amber-500 border-amber-300"
                  : "bg-foreground/20 border-foreground/10"
            }`}
            style={{ left: needleLeft }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono opacity-40 uppercase tracking-wider">
          <span>♭ flat −50</span>
          <span
            className={`font-bold ${
              status === "in-tune" ? "text-emerald-500 dark:text-emerald-400 opacity-100" : ""
            }`}
          >
            {status === "in-tune" ? "✓ in tune" : status === "sharp" ? "sharp ♯" : status === "flat" ? "flat ♭" : "in tune"}
          </span>
          <span>+50 sharp ♯</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={running ? stop : start}
          disabled={starting}
          size="lg"
          className={`rounded-2xl font-bold px-8 ${
            running ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-400/30" : ""
          }`}
          variant={running ? "outline" : "default"}
        >
          {starting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : running ? (
            <MicOff className="w-4 h-4 mr-2" />
          ) : (
            <Mic className="w-4 h-4 mr-2" />
          )}
          {starting ? "Starting mic…" : running ? "Stop" : "Start tuning"}
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mr-1">A4 =</span>
          {A4_OPTIONS.map((ref) => (
            <button
              key={ref}
              onClick={() => setA4(ref)}
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all ${
                a4 === ref
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-black/5 dark:bg-white/10 opacity-60 hover:opacity-100"
              }`}
            >
              {ref}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 text-center max-w-sm">{error}</p>
        )}
      </div>
    </div>
  );
}

export default Tuner;
