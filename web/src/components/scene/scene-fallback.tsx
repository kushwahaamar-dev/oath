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
  const description =
    copy?.description ??
    (reducedMotion
      ? "Reduced motion mode enabled."
      : "WebGL fallback loaded.");
  const badge = copy?.badge ?? state;

  return (
    <section className="chamber-surface relative overflow-hidden rounded-[2rem]">
      <div aria-hidden className="halo-noise pointer-events-none absolute inset-0 opacity-60" />

      <header className="relative z-10 flex items-start justify-between gap-4 border-b border-white/5 p-5 sm:p-6">
        <div className="min-w-0 space-y-2">
          <p className="font-ui text-[11px] uppercase tracking-[0.34em] text-muted-foreground">
            Live oath state
          </p>
          <h2 className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="font-ui max-w-[40ch] text-[12.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/80">
          {badge}
        </div>
      </header>

      <div className="relative flex h-[240px] items-center justify-center overflow-hidden sm:h-[320px]">
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-white/[0.02]">
          <div className="absolute h-32 w-32 rounded-full border border-white/10" />
          <div className="absolute h-24 w-24 rounded-full border border-white/5" />
          <div className="h-24 w-8 rounded-sm border border-white/15 bg-white/10 shadow-[0_0_40px_rgba(255,255,255,0.08)]" />
        </div>
        {reducedMotion && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Reduced motion mode enabled.
          </div>
        )}
      </div>

      <footer className="relative z-10 grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <div className="px-4 py-3 sm:px-5">
          <span className="block text-foreground/80">Ring</span>
          <span className="block">scope boundary</span>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <span className="block text-foreground/80">Slab</span>
          <span className="block">signed oath</span>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <span className="block text-foreground/80">Fracture</span>
          <span className="block">slash event</span>
        </div>
      </footer>
    </section>
  );
}
