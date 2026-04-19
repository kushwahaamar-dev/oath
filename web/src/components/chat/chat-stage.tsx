"use client";

import * as React from "react";

import { SceneShell } from "@/components/scene/scene-shell";
import type { OathVisualState } from "@/components/scene/types";

const STAGE_MARKERS = [
  { id: "01", label: "Draft" },
  { id: "02", label: "Sign" },
  { id: "03", label: "Record" },
  { id: "04", label: "Slash" },
] as const;

interface ChatStageProps {
  state: OathVisualState;
  title: string;
}

export function ChatStage({ state, title }: ChatStageProps): JSX.Element {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/20">
      <div className="border-b border-border/60 px-5 py-4">
        <p className="font-ui text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Oath stage
        </p>
        <h2 className="font-display mt-3 text-2xl font-semibold tracking-tight">{title}</h2>
      </div>

      <div className="p-5">
        <SceneShell label={title} state={state} />
      </div>

      <div className="grid gap-px border-t border-border/60 bg-border/60 sm:grid-cols-4">
        {STAGE_MARKERS.map((marker) => (
          <div key={marker.id} className="bg-card/60 px-4 py-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
              {marker.id} / {marker.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
