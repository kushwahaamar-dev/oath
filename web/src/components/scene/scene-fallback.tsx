"use client";

import React from "react";

import { STATE_COPY } from "@/components/scene/scene-copy";
import type { OathVisualState } from "@/components/scene/types";

type SceneFallbackProps = {
  label: string;
  state: string;
  reducedMotion?: boolean;
};

function isKnownState(s: string): s is OathVisualState {
  return s in STATE_COPY;
}

export function SceneFallback({
  label,
  state,
  reducedMotion = false,
}: SceneFallbackProps): JSX.Element {
  const copy = isKnownState(state) ? STATE_COPY[state] : null;
  const title = copy?.title ?? label;
  const description = copy?.description ?? (reducedMotion ? "Reduced motion mode enabled." : "WebGL fallback loaded.");
  const badge = copy?.badge ?? state;

  return (
    <div className="chamber-surface relative overflow-hidden rounded-[2rem] p-6 shadow-[0_40px_120px_-64px_rgba(0,0,0,0.9)]">
      <div aria-hidden className="halo-noise absolute inset-0 opacity-70" />
      <div className="relative flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-ui text-[11px] uppercase tracking-[0.34em] text-muted-foreground">
              Live oath state
            </p>
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">{title}</h2>
            <p className="max-w-md font-ui text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/80">
            {badge}
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center self-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_90px_-36px_rgba(255,255,255,0.4)]">
            <div className="absolute h-32 w-32 rounded-full border border-white/15" />
            <div className="absolute h-24 w-24 rounded-full border border-white/10" />
            <div className="h-24 w-10 rounded-full border border-white/15 bg-white/10 shadow-[0_0_36px_rgba(255,255,255,0.12)]" />
          </div>

          <div className="space-y-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <div>
              <span className="text-foreground/80">Ring</span> = scope boundary
            </div>
            <div>
              <span className="text-foreground/80">Slab</span> = signed oath
            </div>
            <div>
              <span className="text-foreground/80">Fracture</span> = slash event
            </div>
            {reducedMotion && (
              <div className="pt-2 text-muted-foreground/70">Reduced motion mode enabled.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
