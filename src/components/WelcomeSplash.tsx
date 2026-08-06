import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Waves, Music2, Zap, Unlock, X } from "lucide-react";

const STORAGE_KEY = "hs_welcomed_v22b1";

const FEATURES = [
  {
    icon: Waves,
    title: "Waveform Player",
    desc: "Click anywhere on the waveform to seek. BPM gridlines snap to the beat when analysis data is ready.",
    accent: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-400/10",
  },
  {
    icon: Music2,
    title: "Live Stem Mixer",
    desc: "After splitting, remix right here — volume, solo, mute per stem. Bounce your mix to WAV in one click.",
    accent: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10 dark:bg-violet-400/10",
  },
  {
    icon: Zap,
    title: "Instant BPM & Key",
    desc: "BPM and key flash up the moment a track loads. No more hunting for the Analyze button.",
    accent: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-400/10",
  },
  {
    icon: Unlock,
    title: "MDX-Net & BS-Roformer",
    desc: "Both experimental models are now open to everyone — no hidden toggle required.",
    accent: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
  },
];

export function WelcomeSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so the page paints first
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        >
          <motion.div
            key="splash-card"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="theme-card relative w-full max-w-lg p-8 flex flex-col gap-6"
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full opacity-40 hover:opacity-80 transition-opacity"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-[10px] tracking-widest uppercase font-bold bg-violet-500/15 text-violet-500 dark:text-violet-300 border-violet-400/20"
                >
                  v2.2 beta · Reverie
                </Badge>
              </div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight">
                Welcome to Harmonic Studio
              </h1>
              <p className="text-sm opacity-60 leading-relaxed">
                A music theory toolbox that doesn't make you cry. Here's what landed since you last stopped by.
              </p>
            </div>

            {/* What's new */}
            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5"
                >
                  <div className={`shrink-0 p-2 rounded-xl ${f.bg}`}>
                    <f.icon className={`w-4 h-4 ${f.accent}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug">{f.title}</p>
                    <p className="text-xs opacity-55 leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={dismiss}
              className="w-full rounded-2xl font-semibold"
              size="lg"
            >
              Get Started
            </Button>

            <p className="text-center text-[10px] opacity-35 -mt-2">
              This won't show again. Find the changelog at the bottom of the page.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
