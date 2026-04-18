import Link from "next/link";

import { env, features } from "@/lib/config";

export default function LandingPage(): JSX.Element {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(250_90%_65%_/_0.15),_transparent_55%)]" />
      <div className="container relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col justify-between px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm tracking-tight">
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--oath-ok))] shadow-[0_0_10px_hsl(var(--oath-ok))]" />
            <span className="uppercase text-muted-foreground">oath</span>
            <span className="text-foreground/60">/ devnet</span>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {env.NEXT_PUBLIC_OATH_PROGRAM_ID.slice(0, 6)}…
            {env.NEXT_PUBLIC_OATH_PROGRAM_ID.slice(-6)}
          </div>
        </header>

        <section className="my-20 space-y-8">
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Smart contracts{" "}
            <span className="bg-gradient-to-br from-[hsl(250_90%_70%)] via-[hsl(280_85%_65%)] to-[hsl(200_90%_62%)] bg-clip-text text-transparent">
              for agent behavior.
            </span>
          </h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Oath is the missing enforcement layer for AI agents. Before any
            consequential action, an agent posts a signed, scoped, time-bound,
            stake-backed commitment on Solana. Violations trigger automatic
            on-chain slashing. Nothing is trust-based.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.35)] transition hover:opacity-90"
            >
              Launch demo →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card/40 px-6 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:bg-card"
            >
              Live dashboard
            </Link>
          </div>
        </section>

        <footer className="grid gap-6 border-t border-border pt-10 font-mono text-xs text-muted-foreground md:grid-cols-4">
          <Feature label="Solana" live ok />
          <Feature label="Gemini" live={features.gemini} />
          <Feature label="MongoDB" live={features.mongo} />
          <Feature label="ElevenLabs" live={features.elevenLabs} />
        </footer>
      </div>
    </main>
  );
}

function Feature({
  label,
  live,
  ok,
}: {
  label: string;
  live: boolean;
  ok?: boolean;
}): JSX.Element {
  const color = ok || live ? "hsl(var(--oath-ok))" : "hsl(var(--oath-warn))";
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="uppercase">{label}</span>
      <span className="text-foreground/40">
        {ok ? "live" : live ? "connected" : "mock"}
      </span>
    </div>
  );
}
