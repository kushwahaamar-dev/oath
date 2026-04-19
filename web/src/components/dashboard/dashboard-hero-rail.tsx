import * as React from "react";

import { SceneShell } from "@/components/scene/scene-shell";

export function DashboardHeroRail(): JSX.Element {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr] xl:items-center">
      <div className="max-w-2xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Evidence room
        </div>
        <h1 className="font-display mt-4 text-5xl tracking-tight">
          Live oath ledger.
        </h1>
        <p className="font-ui mt-5 text-base text-muted-foreground md:text-lg">
          A flatter surface for reading mandates, violations, and active scope without
          the theatrical framing of the landing or chat chamber.
        </p>
      </div>
      <SceneShell label="Dashboard echo" state="active" compact />
    </section>
  );
}
