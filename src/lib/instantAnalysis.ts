/**
 * Instant analysis — lightweight first-pass BPM/key detection that runs
 * automatically when a track's audio becomes available, so badges can show
 * without the user clicking Analyze. The full Analyze pipeline is separate
 * and untouched.
 */

export interface InstantAnalysisResult {
  bpm: number;
  key: string;
  scale: string;
}

/** Only the first ~90s are analysed to keep the quick pass fast. */
export const QUICK_MAX_SECONDS = 90;
export const QUICK_TARGET_SR = 44100;

/**
 * Monotonic gate for stale-run protection. Each new track claims a new id;
 * async work started for an older id must not publish results.
 */
export class LatestRunGate {
  private id = 0;
  next(): number {
    return ++this.id;
  }
  isCurrent(id: number): boolean {
    return id === this.id;
  }
}

export interface InstantAnalysisDeps {
  /** Returns an initialised Essentia instance, or null if not ready yet. */
  getEssentia: () => any | null;
  /**
   * Resolves once Essentia initialisation has settled (successfully or not).
   * If Essentia isn't ready yet, the run awaits this — however long startup
   * takes — instead of giving up on a fixed timer. Only an actual init
   * failure (getEssentia still null afterwards) aborts the run.
   */
  waitForEssentia?: () => Promise<void>;
  /** Loads mono samples at QUICK_TARGET_SR for the given audio URL. */
  fetchSamples: (audioUrl: string) => Promise<Float32Array>;
  /** Abort check — return true to stop early (e.g. track changed). */
  isCancelled?: () => boolean;
}

/**
 * Runs the quick BPM/key pass. Resolves to a result, or null on any failure
 * or cancellation — failures are always silent by design (no error toasts).
 */
export async function runInstantAnalysis(
  audioUrl: string,
  deps: InstantAnalysisDeps
): Promise<InstantAnalysisResult | null> {
  const {
    getEssentia,
    waitForEssentia,
    fetchSamples,
    isCancelled = () => false,
  } = deps;

  try {
    // If Essentia is still initialising, wait for it to settle — a track
    // loaded right after page load must still get badges once startup ends.
    let essentia = getEssentia();
    if (!essentia && waitForEssentia) {
      await waitForEssentia();
      if (isCancelled()) return null;
      essentia = getEssentia();
    }
    // Still unavailable means initialisation actually failed — silent skip.
    if (!essentia) return null;

    const samples = await fetchSamples(audioUrl);
    if (isCancelled()) return null;

    const vector = essentia.arrayToVector(samples);
    const bpmResult = essentia.PercivalBpmEstimator(
      vector,
      undefined, undefined, undefined, undefined, undefined, undefined,
      QUICK_TARGET_SR
    );
    const keyData = essentia.KeyExtractor(vector);
    if (isCancelled()) return null;

    const scale = keyData.scale
      ? keyData.scale.charAt(0).toUpperCase() + keyData.scale.slice(1)
      : "Major";
    return { bpm: Math.round(bpmResult.bpm), key: keyData.key, scale };
  } catch {
    // Silent failure — the badges simply don't appear.
    return null;
  }
}

export interface AutoFetchDeps {
  /** Gate shared with the track-load flow; loadId must be minted at load start. */
  gate: LatestRunGate;
  /** Requests server-side download and resolves to the file URL. */
  requestDownloadUrl: (trackUrl: string, title?: string) => Promise<string>;
  /** Fetches the audio blob and its content type. */
  fetchBlob: (downloadUrl: string) => Promise<{ data: Blob; contentType: string }>;
  /** True if the user already produced audio (Download/Analyze) meanwhile. */
  hasManualAudio: () => boolean;
  /** Installs the fetched blob as the current playable audio. */
  installAudio: (blob: Blob) => void;
}

/**
 * Background audio fetch for remote tracks so instant analysis can run right
 * after track info loads. `loadId` must be claimed from `deps.gate` at the
 * START of the track-load flow (before any awaits), so a superseded load can
 * never install audio over a newer track. Returns true if audio was installed;
 * all failures are silent.
 */
export async function autoFetchRemoteAudio(
  loadId: number,
  trackUrl: string,
  title: string | undefined,
  deps: AutoFetchDeps
): Promise<boolean> {
  const { gate, requestDownloadUrl, fetchBlob, hasManualAudio, installAudio } = deps;
  try {
    if (!gate.isCurrent(loadId)) return false;
    const downloadUrl = await requestDownloadUrl(trackUrl, title);
    if (!gate.isCurrent(loadId)) return false;
    const { data, contentType } = await fetchBlob(downloadUrl);
    if (!gate.isCurrent(loadId)) return false;
    if (contentType.toLowerCase().includes("text/html")) return false;
    // Don't clobber audio the user already produced via Download/Analyze.
    if (hasManualAudio()) return false;
    installAudio(data);
    return true;
  } catch {
    // Silent — badges just won't appear; Download/Analyze still work.
    return false;
  }
}

/**
 * Browser implementation of sample loading: fetch the blob, decode it, and
 * downmix/resample to mono at QUICK_TARGET_SR, capped at QUICK_MAX_SECONDS.
 */
export async function fetchSamplesFromAudioUrl(audioUrl: string): Promise<Float32Array> {
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const duration = Math.min(audioBuffer.duration, QUICK_MAX_SECONDS);
    const offlineCtx = new OfflineAudioContext(
      1,
      Math.ceil(duration * QUICK_TARGET_SR),
      QUICK_TARGET_SR
    );
    const src = offlineCtx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(offlineCtx.destination);
    src.start();
    const rendered = await offlineCtx.startRendering();
    return rendered.getChannelData(0);
  } finally {
    audioCtx.close().catch(() => {});
  }
}
