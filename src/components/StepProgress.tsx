/**
 * StepProgress — labeled step indicator for long-running split jobs.
 * Frosted-glass aesthetic matching the rest of the app.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { Check, Loader2, AlertCircle, Clock } from "lucide-react";

export interface SplitStep {
  id: string;
  label: string;
}

interface StepProgressProps {
  steps: SplitStep[];
  /** ID of the currently-active step; null means waiting to start */
  activeId: string | null;
  /** ID of the step where an error occurred (optional) */
  errorId?: string | null;
  /** Error message shown inline beneath the failed step */
  errorMessage?: string | null;
  /** Short human-friendly time estimate, e.g. "~2–4 min for a 4-min track" */
  estimateHint?: string;
}

type StepState = "done" | "active" | "error" | "pending";

export function StepProgress({
  steps,
  activeId,
  errorId,
  errorMessage,
  estimateHint,
}: StepProgressProps) {
  const activeIdx = activeId ? steps.findIndex((s) => s.id === activeId) : -1;
  const errorIdx = errorId ? steps.findIndex((s) => s.id === errorId) : -1;

  const getState = (i: number): StepState => {
    if (errorIdx >= 0) {
      if (i < errorIdx) return "done";
      if (i === errorIdx) return "error";
      return "pending";
    }
    if (activeIdx < 0) return "pending";
    if (i < activeIdx) return "done";
    if (i === activeIdx) return "active";
    return "pending";
  };

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 space-y-3">
      {/* Time estimate hint */}
      {estimateHint && errorIdx < 0 && (
        <div className="flex items-center gap-1.5 text-[11px] opacity-50">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{estimateHint}</span>
        </div>
      )}

      {/* Step pills */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {steps.map((step, i) => {
          const state = getState(i);
          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <span className="opacity-20 text-[10px] select-none mx-0.5">
                  →
                </span>
              )}
              <span
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300
                  ${
                    state === "done"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : state === "active"
                      ? "bg-foreground text-background shadow-sm scale-105"
                      : state === "error"
                      ? "bg-red-500/15 text-red-500 dark:text-red-400 ring-1 ring-red-400/40"
                      : "bg-black/5 dark:bg-white/5 opacity-35"
                  }
                `}
              >
                {state === "done" && (
                  <Check className="w-3 h-3 shrink-0" />
                )}
                {state === "active" && (
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                )}
                {state === "error" && (
                  <AlertCircle className="w-3 h-3 shrink-0" />
                )}
                {step.label}
              </span>
            </React.Fragment>
          );
        })}
      </div>

      {/* Inline error message beneath the failed step */}
      {errorIdx >= 0 && errorMessage && (
        <p className="text-[11px] text-red-500 dark:text-red-400 leading-relaxed bg-red-500/8 rounded-xl px-3 py-2 border border-red-400/20">
          <span className="font-bold">Failed at "{steps[errorIdx]?.label}":</span>{" "}
          {errorMessage}
        </p>
      )}
    </div>
  );
}
