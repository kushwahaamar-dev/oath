import * as React from "react";

const METRICS = [
  {
    label: "Instructions",
    value: "6",
    detail: "create, record, slash, revoke, close, fulfill",
  },
  {
    label: "Tests",
    value: "14",
    detail: "happy path and adversarial coverage",
  },
  {
    label: "Demo scenes",
    value: "3",
    detail: "happy path, attack, revoke",
  },
  {
    label: "Runtime",
    value: "<15s",
    detail: "proposal to confirmation",
  },
] as const;

export function MetricRail(): JSX.Element {
  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="font-ui text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Proof dossier
          </p>
          <h2 className="font-display mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Build snapshot
          </h2>
          <p className="font-ui mt-5 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            A fixed dossier from the current monolith build. These figures frame
            the proof surface on this page rather than acting as a permanently
            live counter.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-border/60 bg-border/60 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((metric) => (
            <article key={metric.label} className="bg-card/20 p-6 md:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                {metric.label}
              </p>
              <p className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                {metric.value}
              </p>
              <p className="font-ui mt-3 text-sm leading-relaxed text-muted-foreground">
                {metric.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
