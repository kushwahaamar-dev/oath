import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { env, features } from "@/lib/config";

const BULLETS: Array<{ title: string; body: string }> = [
  {
    title: "Signed, scoped, time-bound",
    body: "Every agent posts a structured commitment before acting — spend caps, recipient whitelists, action types, expiry. The user co-signs.",
  },
  {
    title: "Stake-backed",
    body: "The agent escrows SOL into a program-owned vault. An on-chain violation moves it straight to the user's wallet. No arbitration.",
  },
  {
    title: "Gated at the source",
    body: "record_action is an on-chain instruction the agent MUST call before any tool use. Out of scope? The instruction reverts.",
  },
  {
    title: "Interoperable by default",
    body: "Downstream services verify an oath via Solana RPC. Any x402 endpoint, any agent framework. No extra trust primitive.",
  },
];

export default function LandingPage(): JSX.Element {
  return (
    <>
      <SiteHeader programId={env.NEXT_PUBLIC_OATH_PROGRAM_ID} />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(ellipse_at_top,_hsl(250_90%_65%_/_0.18),_transparent_55%)]" />

        <section className="container relative mx-auto max-w-5xl px-6 pb-24 pt-20">
          <Badge variant="outline" className="mb-8">
            <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--oath-ok))]" />
            devnet live
          </Badge>
          <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-tight md:text-7xl">
            Smart contracts{" "}
            <span className="bg-gradient-to-br from-[hsl(250_90%_72%)] via-[hsl(280_85%_66%)] to-[hsl(200_90%_64%)] bg-clip-text text-transparent">
              for agent behavior.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Before any consequential action, an AI agent posts a signed,
            scoped, time-bound, stake-backed commitment on Solana. The user
            co-signs. Violations trigger automatic on-chain slashing. Nothing
            is trust-based.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.35)] transition hover:opacity-90"
            >
              Launch demo →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card/40 px-7 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:bg-card"
            >
              Live dashboard
            </Link>
            <a
              href="https://github.com/kushwahaamar-dev/oath"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-border/70 bg-card/30 px-7 py-3 text-sm text-muted-foreground backdrop-blur transition hover:text-foreground"
            >
              github
            </a>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-4 md:grid-cols-2">
            {BULLETS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur transition hover:border-primary/40"
              >
                <div className="text-sm font-medium">{b.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-border/60">
          <div className="container mx-auto grid max-w-5xl gap-6 px-6 py-10 font-mono text-xs text-muted-foreground md:grid-cols-5">
            <Feature label="Solana" live ok />
            <Feature label="Gemini" live={features.gemini} />
            <Feature label="MongoDB" live={features.mongo} />
            <Feature label="ElevenLabs" live={features.elevenLabs} />
            <Feature label="Places" live={features.googlePlaces} />
          </div>
        </footer>
      </main>
    </>
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
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      />
      <span className="uppercase">{label}</span>
      <span className="text-foreground/40">
        {ok ? "live" : live ? "connected" : "mock"}
      </span>
    </div>
  );
}
