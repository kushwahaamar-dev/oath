"use client";

import * as React from "react";

import { SceneShell } from "@/components/scene/scene-shell";
import type { OathVisualState } from "@/components/scene/types";

const STAGE_MARKERS = [
  { id: "01", label: "Draft", hint: "Agent proposes terms" },
  { id: "02", label: "Sign", hint: "User signs on-chain" },
  { id: "03", label: "Record", hint: "Every action verified" },
  { id: "04", label: "Slash", hint: "Scope violation → stake forfeit" },
] as const;

interface ChatStageProps {
  state: OathVisualState;
  title: string;
}

export function ChatStage({ state, title }: ChatStageProps): JSX.Element {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/20">
      <SceneShell label={title} state={state} />

      <div className="grid gap-px border-t border-border/60 bg-border/60 sm:grid-cols-4">
        {STAGE_MARKERS.map((marker) => (
          <div key={marker.id} className="space-y-1 bg-card/60 px-4 py-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
              {marker.id} / {marker.label}
            </div>
            <div className="font-ui text-[11px] leading-relaxed text-muted-foreground/70">
              {marker.hint}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
