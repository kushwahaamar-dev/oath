"use client";

import React from "react";

type SceneFallbackProps = {
  label: string;
  state: string;
  reducedMotion?: boolean;
};

export function SceneFallback({
  label,
  state,
  reducedMotion = false,
}: SceneFallbackProps): JSX.Element {
  return (
    <div className="chamber-surface relative overflow-hidden rounded-[2rem] p-6 shadow-[0_40px_120px_-64px_rgba(0,0,0,0.9)]">
      <div aria-hidden className="halo-noise absolute inset-0 opacity-70" />
      <div className="relative flex flex-col gap-6">
        <div className="space-y-2">
          <p className="font-ui text-[11px] uppercase tracking-[0.34em] text-muted-foreground">
            Scene fallback
          </p>
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">{label}</h2>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center self-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_90px_-36px_rgba(255,255,255,0.4)]">
            <div className="absolute h-32 w-32 rounded-full border border-white/15" />
            <div className="absolute h-24 w-24 rounded-full border border-white/10" />
            <div className="h-24 w-10 rounded-full border border-white/15 bg-white/10 shadow-[0_0_36px_rgba(255,255,255,0.12)]" />
          </div>

          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              State
            </div>
            <div className="inline-flex items-center rounded-full border border-border/70 bg-background/30 px-3 py-1 font-mono text-xs text-foreground">
              {state}
            </div>
            <p className="font-ui max-w-md text-sm text-muted-foreground">
              {reducedMotion ? "Reduced motion mode enabled." : "WebGL fallback loaded."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
