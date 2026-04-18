import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, ShieldCheck, Skull, TrendingUp } from "lucide-react";

import { explorerAddress } from "@/components/action-timeline";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/config";
import { loadAgentProfile } from "@/lib/services/reputation";
import { lamportsToSol, shortPubkey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage({
  params,
}: {
  params: { pubkey: string };
}): Promise<JSX.Element> {
  let profile;
  try {
    profile = await loadAgentProfile(params.pubkey);
  } catch {
    notFound();
  }

  const pct = (profile.reputation_score * 100).toFixed(0);
  const successRate =
    profile.oath_count === 0
      ? 0
      : (profile.successful_fulfillments / profile.oath_count) * 100;

  return (
    <>
      <SiteHeader programId={env.NEXT_PUBLIC_OATH_PROGRAM_ID} />
      <main className="container mx-auto max-w-5xl px-6 py-10">
        <nav className="mb-6 text-xs text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            ← dashboard
          </Link>
        </nav>

        <Card>
          <div className="h-[3px] w-full bg-gradient-to-r from-[hsl(200_90%_62%)] via-[hsl(250_90%_65%)] to-[hsl(280_85%_66%)]" />
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Agent profile
              </div>
              {profile.mocked ? (
                <Badge variant="warn">mock · mongo disabled</Badge>
              ) : (
                <Badge variant="success">live · atlas</Badge>
              )}
            </div>
            <CardTitle className="text-balance text-3xl leading-tight">
              {profile.name}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
              <a
                href={explorerAddress(profile.pubkey)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border bg-background/40 px-3 py-1 hover:text-foreground"
              >
                {profile.pubkey}
              </a>
              <span>·</span>
              <span>operator: {profile.operator}</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-4">
              <Stat
                label="Reputation"
                value={`${pct}%`}
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                pct={profile.reputation_score * 100}
                primary
              />
              <Stat
                label="Success rate"
                value={`${successRate.toFixed(0)}%`}
                sub={`${profile.successful_fulfillments}/${profile.oath_count}`}
              />
              <Stat
                label="Avg stake"
                value={`${profile.avg_stake_sol.toFixed(2)} SOL`}
                icon={<Award className="h-3.5 w-3.5" />}
              />
              <Stat
                label="Slashes"
                value={String(profile.slashes)}
                icon={<Skull className="h-3.5 w-3.5" />}
                danger={profile.slashes > 0}
              />
            </div>

            <Separator />

            <section>
              <h2 className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                Recent oaths
              </h2>
              {profile.recent_oaths.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-background/30 p-6 text-sm text-muted-foreground">
                  {profile.mocked
                    ? "Set MONGODB_URI to populate the reputation graph."
                    : "No oaths yet for this agent."}
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.recent_oaths.map((o) => {
                    const variant =
                      o.status === "Fulfilled"
                        ? "success"
                        : o.status === "Slashed"
                          ? "danger"
                          : o.status === "Active"
                            ? "default"
                            : "neutral";
                    return (
                      <Link
                        key={o.oath_pda}
                        href={`/oath/${o.oath_pda}`}
                        className="flex items-center justify-between rounded-xl border border-border bg-background/30 px-4 py-3 transition hover:border-primary/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                            <Badge variant={variant}>{o.status}</Badge>
                            <span className="font-mono">
                              {shortPubkey(o.oath_pda, 4)}
                            </span>
                          </div>
                          <div className="mt-1 truncate text-sm">
                            {o.purpose}
                          </div>
                        </div>
                        <div className="ml-4 font-mono text-[11px] text-muted-foreground">
                          {lamportsToSol(BigInt(o.stake_lamports)).toFixed(2)} SOL
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  pct,
  primary,
  danger,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  pct?: number;
  primary?: boolean;
  danger?: boolean;
}): JSX.Element {
  return (
    <div
      className={`rounded-xl border border-border bg-background/40 p-4 ${
        danger ? "border-[hsl(var(--oath-slash)/0.4)]" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-2xl font-semibold ${
          primary
            ? "bg-gradient-to-br from-[hsl(250_90%_75%)] to-[hsl(200_90%_65%)] bg-clip-text text-transparent"
            : danger
              ? "text-[hsl(var(--oath-slash))]"
              : ""
        }`}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
          {sub}
        </div>
      ) : null}
      {typeof pct === "number" ? (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[hsl(250_90%_65%)] to-[hsl(200_90%_62%)]"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
