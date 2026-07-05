export interface RecentTrack {
  id: string;
  title: string;
  type: "download" | "stems";
  format: string;
  token: string;
  url: string;
  createdAt: number;
  expiresAt: number;
}

const STORAGE_KEY = "vibecoded_recent_tracks";
const MAX_TRACKS = 20;

function readAll(): RecentTrack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAll(tracks: RecentTrack[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — fail silently.
  }
}

export function getRecentTracks(): RecentTrack[] {
  const now = Date.now();
  const tracks = readAll().filter((t) => t.expiresAt > now);
  writeAll(tracks);
  return tracks.sort((a, b) => b.createdAt - a.createdAt);
}

export function addRecentTrack(input: Omit<RecentTrack, "id" | "createdAt">) {
  const tracks = getRecentTracks();
  const track: RecentTrack = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const next = [track, ...tracks].slice(0, MAX_TRACKS);
  writeAll(next);
  return track;
}

export function removeRecentTrack(id: string) {
  const tracks = readAll().filter((t) => t.id !== id);
  writeAll(tracks);
}

export function extractTokenFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1];
}
