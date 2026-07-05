import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { History, X, Copy, Check, Trash2, Download, Loader2, Music, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// NOTE: resolved via the "@/*" -> "./*" path alias against project root,
// which maps to /components/ui/* (not /src/components/ui/*).
import { toast } from "sonner";
import {
  getRecentTracks,
  removeRecentTrack,
  type RecentTrack,
} from "@/lib/recentTracks";

function formatTimeLeft(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function CopyTokenButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — clipboard access denied.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      <span className="font-mono tracking-wider text-xs">{token}</span>
    </Button>
  );
}

export function RecentTracksButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="rounded-full bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 backdrop-blur-md hover:bg-black/10 dark:hover:bg-white/10"
      title="My Recent Tracks"
    >
      <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
    </Button>
  );
}

export function RecentTracksPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tracks, setTracks] = useState<RecentTrack[]>([]);
  const [retrieveToken, setRetrieveToken] = useState("");
  const [retrieving, setRetrieving] = useState(false);

  useEffect(() => {
    if (open) setTracks(getRecentTracks());
  }, [open]);

  const handleRemove = (id: string) => {
    removeRecentTrack(id);
    setTracks(getRecentTracks());
  };

  const handleRetrieve = async () => {
    const code = retrieveToken.trim();
    if (!code) {
      toast.info("Paste a code first.");
      return;
    }
    setRetrieving(true);
    try {
      const res = await fetch(`/api/files/token/${encodeURIComponent(code)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const filename = match ? decodeURIComponent(match[1]) : "download";

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success("Download started!");
      setRetrieveToken("");
    } catch (error: any) {
      toast.error(error.message || "Couldn't retrieve that file.");
    } finally {
      setRetrieving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background border-l border-black/10 dark:border-white/10 z-[201] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-4 h-4" />
                My Recent Tracks
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 space-y-2">
              <p className="text-xs font-medium opacity-70">Have a code from another device?</p>
              <div className="flex gap-2">
                <Input
                  value={retrieveToken}
                  onChange={(e) => setRetrieveToken(e.target.value)}
                  placeholder="Paste 12-character code"
                  className="font-mono tracking-wider text-sm"
                  maxLength={12}
                  onKeyDown={(e) => e.key === "Enter" && handleRetrieve()}
                />
                <Button onClick={handleRetrieve} disabled={retrieving} className="shrink-0">
                  {retrieving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {tracks.length === 0 ? (
                <div className="text-sm opacity-60 text-center py-12">
                  Your downloads and stem splits will appear here automatically.
                </div>
              ) : (
                tracks.map((track) => (
                  <div
                    key={track.id}
                    className="rounded-xl border border-black/10 dark:border-white/10 p-3 space-y-2 bg-black/[0.02] dark:bg-white/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate flex items-center gap-1.5">
                          {track.type === "stems" ? (
                            <Package className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          ) : (
                            <Music className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          )}
                          {track.title}
                        </p>
                        <p className="text-xs opacity-50 mt-0.5">
                          {track.format.toUpperCase()} · {formatTimeLeft(track.expiresAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(track.id)}
                        className="w-7 h-7 shrink-0 rounded-full"
                        title="Remove from list"
                      >
                        <Trash2 className="w-3.5 h-3.5 opacity-60" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyTokenButton token={track.token} />
                      <a href={track.url} download className="shrink-0">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
