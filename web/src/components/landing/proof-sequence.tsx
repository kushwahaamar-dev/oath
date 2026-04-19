import * as React from "react";

const PROOF_STEPS = [
  {
    id: "01",
    label: "Propose",
    body: "The agent proposes scope before it acts.",
  },
  {
    id: "02",
    label: "Sign",
    body: "The user signs a narrow mandate with explicit bounds, spend limits, and expiry.",
  },
  {
    id: "03",
    label: "Gate",
    body: "Halo records the mandate before execution, so action only proceeds through the protocol path.",
  },
  {
    id: "04",
    label: "Slash",
    body: "A verified breach slashes stake back to the user without arbitration.",
  },
] as const;

export function ProofSequence(): JSX.Element {
  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="font-ui text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Proof sequence
          </p>
          <h2 className="font-display mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            A restrained path from intent to consequence.
          </h2>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-border/60 bg-card/20">
          {PROOF_STEPS.map((step, index) => (
            <article
              key={step.id}
              className={[
                "grid gap-4 px-6 py-6 md:grid-cols-[8rem_minmax(0,1fr)] md:px-8 md:py-8",
                index > 0 ? "border-t border-border/60" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                {step.id} / {step.label}
              </div>
              <p className="font-ui max-w-3xl text-pretty text-lg leading-relaxed text-foreground/90">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
