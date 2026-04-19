import * as React from "react";

const COMPARISON_COLUMNS = [
  {
    title: "Without Oath",
    points: [
      "Policy lives in docs, but execution can drift the moment pressure arrives.",
      "Operators ask for trust because the system itself has no binding record of intent.",
      "When something breaks, enforcement starts after the damage instead of at the gate.",
    ],
  },
  {
    title: "With Oath",
    points: [
      "Intent is proposed, signed, and recorded before any external capability opens.",
      "The protocol keeps a shared record of scope, consent, and consequence as the action unfolds.",
      "A verified breach resolves inside the same path that authorized the work in the first place.",
    ],
  },
] as const;

export function ComparisonPanel(): JSX.Element {
  return (
    <section className="border-y border-border/60 bg-card/10 py-16 lg:py-20">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="font-ui text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Editorial comparison
          </p>
          <h2 className="font-display mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Policy text is not enforcement.
          </h2>
          <p className="font-ui mt-5 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            The difference is not tone or documentation. It is whether the
            system can bind a promise to the moment action becomes possible.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-border/60 bg-border/60 md:grid-cols-2">
          {COMPARISON_COLUMNS.map((column) => (
            <article key={column.title} className="bg-background/95 p-8 md:p-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                {column.title}
              </p>
              <ul className="mt-6 space-y-4">
                {column.points.map((point) => (
                  <li
                    key={point}
                    className="font-ui text-pretty text-base leading-relaxed text-foreground/90"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
