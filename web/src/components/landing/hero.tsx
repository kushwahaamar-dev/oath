import * as React from "react";
import Link from "next/link";

import { SceneShell } from "@/components/scene/scene-shell";

export function Hero({ programId }: { programId: string }): JSX.Element {
  return (
    <section className="border-b border-border/60">
      <div className="container mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-center lg:py-24">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="font-ui text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Protocol chamber
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground lg:justify-start">
            <span className="font-ui">Protocol / Halo Monolith</span>
            <span className="hidden h-1 w-1 rounded-full bg-border md:inline-block" />
            <span className="font-mono break-all">Program / {programId}</span>
          </div>

          <h1 className="font-display mt-8 max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-tight md:text-7xl">
            Bind intent before action.
          </h1>
          <p className="font-ui mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Halo records scope, consent, and enforcement before an agent can
            touch the outside world. Every consequential action begins inside
            the protocol.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              href="/chat"
              className="font-ui inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Launch demo
            </Link>
            <Link
              href="/dashboard"
              className="font-ui inline-flex items-center justify-center rounded-full border border-border bg-card/40 px-7 py-3 text-sm font-medium text-foreground transition hover:bg-card"
            >
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="relative w-full max-w-[30rem] justify-self-end">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-8 -z-10 rounded-full bg-[radial-gradient(circle,_hsl(var(--foreground)/0.12),_transparent_68%)] blur-3xl"
          />
          <SceneShell label="Halo Monolith" state="idle" />
        </div>
      </div>
    </section>
  );
}
