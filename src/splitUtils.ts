/**
 * Pure helpers for the split pipeline — extracted so they can be unit-tested
 * without spinning up React or the Express server.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import type { SplitStep } from "./components/StepProgress";

// ── Step building ─────────────────────────────────────────────────────────────

/** Build the ordered step list for the split progress indicator. */
export function buildSplitSteps(isLocalFile: boolean, isBvr: boolean): SplitStep[] {
  const steps: SplitStep[] = [];
  if (!isLocalFile) steps.push({ id: "download", label: "Download" });
  steps.push({ id: "convert", label: isLocalFile ? "Prepare" : "Convert" });
  if (isBvr) {
    steps.push({ id: "separate_1", label: "Split · Pass 1" });
    steps.push({ id: "separate_2", label: "Split · Pass 2" });
  } else {
    steps.push({ id: "separate", label: "Split" });
  }
  steps.push({ id: "package", label: "Package" });
  steps.push({ id: "done", label: "Ready" });
  return steps;
}

// ── Stage → step-id mapping ───────────────────────────────────────────────────

/**
 * Map a (stage, pass) SSE event pair onto a step id from buildSplitSteps.
 * Returns null when stage is null (waiting to start).
 */
export function stageToStepId(
  stage: string | null,
  pass: number | null,
  isBvr: boolean,
): string | null {
  if (!stage) return null;
  if (stage === "separate" && isBvr) return pass === 2 ? "separate_2" : "separate_1";
  return stage;
}

// ── Split request payload construction ───────────────────────────────────────

export interface VideoInfo {
  loadedUrl?: string;
  soundcloudUrl?: string;
  title?: string;
}

export interface SplitPayloadParams {
  /** Non-null when the user uploaded a local file; null for remote URLs. */
  uploadedFilename: string | null;
  /** Persisted video/track info from the last successful Analyze call. */
  videoInfo: VideoInfo | null;
  /**
   * Raw value of the URL input field.
   * Used ONLY as a last-resort fallback when videoInfo carries no canonical
   * URL — prevents a stale input value from silently overriding the loaded URL.
   */
  url: string;
  selectedStems: string[];
  splittingModel: string;
  modelVariant: string;
}

export interface SplitPayload {
  stemsToZip: string[];
  model: string;
  modelVariant: string;
  title: string;
  /** Present only for local uploads — mutually exclusive with `url`. */
  filename?: string;
  /** Present only for remote URLs — mutually exclusive with `filename`. */
  url?: string;
}

/**
 * Build the JSON body sent to POST /api/split.
 *
 * Invariants:
 *  - Local upload  → `filename` is set; `url` is absent.
 *  - Remote URL    → `url` is taken from videoInfo.loadedUrl first, then
 *                    videoInfo.soundcloudUrl, then the raw input as a
 *                    last resort. `filename` is absent.
 *  - `filename` and `url` are never both present in the same payload.
 */
export function buildSplitPayload(params: SplitPayloadParams): SplitPayload {
  const { uploadedFilename, videoInfo, url, selectedStems, splittingModel, modelVariant } = params;
  const base: SplitPayload = {
    stemsToZip: selectedStems,
    model: splittingModel,
    modelVariant,
    title: videoInfo?.title || uploadedFilename || "",
  };
  if (uploadedFilename) {
    // Local upload path — server needs the filename, not a URL.
    return { ...base, filename: uploadedFilename };
  }
  // Remote URL path — prefer the persisted canonical URL over the raw input.
  return { ...base, url: videoInfo?.loadedUrl ?? videoInfo?.soundcloudUrl ?? url };
}
