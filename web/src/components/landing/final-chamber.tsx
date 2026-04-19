import * as React from "react";
import Link from "next/link";

export function FinalChamber(): JSX.Element {
  return (
    <section className="pb-24 pt-4 lg:pb-28">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/20">
          <div className="relative grid gap-10 px-6 py-12 md:px-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-16 top-0 h-40 bg-[radial-gradient(ellipse_at_top,_hsl(var(--foreground)/0.12),_transparent_70%)]"
            />

            <div className="relative max-w-3xl">
              <p className="font-ui text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Final chamber
              </p>
              <h2 className="font-display mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
                See the protocol hold under pressure.
              </h2>
              <p className="font-ui mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
                Run the clean path, the attack path, and the revoke path through
                the same chamber. The point is not a promise of safety. It is a
                visible protocol with consequences.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/chat"
                  className="font-ui inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Enter demo chamber
                </Link>
                <Link
                  href="/dashboard"
                  className="font-ui inline-flex items-center justify-center rounded-full border border-border bg-background px-7 py-3 text-sm font-medium text-foreground transition hover:bg-card"
                >
                  Review dashboard
                </Link>
              </div>
            </div>

            <div className="relative w-full max-w-sm justify-self-end">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-6 -z-10 rounded-full bg-[radial-gradient(circle,_hsl(var(--foreground)/0.12),_transparent_68%)] blur-3xl"
              />
              <div
                aria-hidden
                data-testid="final-chamber-reprise"
                className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-border/60 bg-background/70"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,_hsl(var(--foreground)/0.16),_transparent_34%)]" />
                <div className="absolute left-1/2 top-[18%] h-40 w-40 -translate-x-1/2 rounded-full border border-border/50 opacity-70" />
                <div className="absolute left-1/2 top-[22%] h-52 w-52 -translate-x-1/2 rounded-full border border-border/25 opacity-60" />
                <div className="absolute left-1/2 top-1/2 h-44 w-24 -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,_hsl(var(--foreground)/0.2),_hsl(var(--foreground)/0.06)_38%,_transparent_100%)] shadow-[0_18px_80px_hsl(var(--foreground)/0.12)]" />
                <div className="absolute left-1/2 top-[56%] h-40 w-28 -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-[linear-gradient(180deg,_transparent,_hsl(var(--foreground)/0.08))] blur-sm" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,_transparent,_hsl(var(--background)))]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
