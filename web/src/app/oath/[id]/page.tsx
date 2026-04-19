import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PublicKey } from "@solana/web3.js";

import { explorerAddress } from "@/lib/explorer";
import { RevokeButton } from "@/components/revoke-button";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/config";
import { fetchOathView } from "@/lib/solana/oath";
import type { OathStatus } from "@/lib/types";
import { lamportsToSol, microToUsdc, shortPubkey } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<OathStatus, "success" | "danger" | "warn" | "neutral"> = {
  Active: "success",
  Slashed: "danger",
  Revoked: "warn",
  Expired: "warn",
  Fulfilled: "neutral",
};

export default async function OathDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  let pk: PublicKey;
  try {
    pk = new PublicKey(params.id);
  } catch {
    notFound();
  }
  const view = await fetchOathView(pk!);
  if (!view) notFound();

  const spentNum = Number(microToUsdc(BigInt(view.spent)));
  const capNum = Number(microToUsdc(BigInt(view.spend_cap)));
  const spentPct = capNum > 0 ? Math.min((spentNum / capNum) * 100, 100) : 0;

  const createdIso = new Date(view.created_at * 1000);
  const expiryIso = new Date(view.expiry * 1000);
  const now = Date.now();
  const expiringIn = Math.max(0, view.expiry * 1000 - now);
  const expiringHuman =
    expiringIn === 0
      ? "expired"
      : expiringIn > 3600 * 1000
        ? `${(expiringIn / 3600 / 1000).toFixed(1)} h left`
        : `${Math.round(expiringIn / 60 / 1000)} min left`;

  return (
    <>
      <SiteHeader programId={env.NEXT_PUBLIC_OATH_PROGRAM_ID} />
      <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,_hsl(250_90%_65%_/_0.10),_transparent_55%)]" />

        <div className="container relative mx-auto max-w-4xl px-6 py-10">
          <nav className="mb-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              ← dashboard
            </Link>
            <span>·</span>
            <span>oath #{view.oath_id}</span>
          </nav>

          {/* Dossier header */}
          <section className="chamber-surface overflow-hidden rounded-[28px] border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <span>Oath dossier · Solana devnet</span>
              <Badge variant={STATUS_VARIANT[view.status]}>{view.status}</Badge>
            </div>

            <div className="px-6 pb-6 pt-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                Sworn purpose
              </div>
              <h1 className="font-display mt-4 text-balance text-[32px] leading-[1.06] tracking-tight md:text-[44px]">
                {view.purpose}
              </h1>

              <a
                href={explorerAddress(view.oath_pda)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                {view.oath_pda}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Metrics rail */}
            <div className="grid grid-cols-2 divide-x divide-y divide-white/5 border-y border-white/10 md:grid-cols-4 md:divide-y-0">
              <Cell
                label="Spent"
                value={`$${spentNum.toFixed(0)}`}
                hint={`of $${capNum.toFixed(0)} cap`}
                bar={spentPct}
              />
              <Cell
                label="Per-tx cap"
                value={`$${microToUsdc(BigInt(view.per_tx_cap)).toFixed(0)}`}
                hint="USDC max"
              />
              <Cell
                label="Stake"
                value={`${lamportsToSol(BigInt(view.stake_amount)).toFixed(2)}`}
                hint="SOL locked"
              />
              <Cell
                label="Window"
                value={expiringHuman}
                hint={expiryIso.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              />
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 divide-y divide-white/5 border-b border-white/10 md:grid-cols-2 md:divide-x md:divide-y-0">
              <Party role="User · beneficiary" pubkey={view.user_pubkey} />
              <Party role="Agent · bound party" pubkey={view.agent_pubkey} />
            </div>

            {/* Scope */}
            <div className="space-y-5 px-6 py-6">
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Authorized action types
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {view.allowed_action_types.map((a) => (
                    <Badge key={a} variant="outline" className="font-mono text-[11px]">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Whitelisted recipients · {view.allowed_recipients.length}
                </div>
                <div className="space-y-1.5">
                  {view.allowed_recipients.map((r, i) => (
                    <a
                      key={r}
                      href={explorerAddress(r)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-background/30 px-3 py-2 font-mono text-[12px] text-muted-foreground transition hover:text-foreground"
                    >
                      <span>Recipient {i + 1}</span>
                      <span className="flex items-center gap-1.5">
                        {shortPubkey(r, 6)}
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Audit strip */}
            <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/10 text-center">
              <Audit label="Created" value={formatShort(createdIso)} />
              <Audit label="Vault" value={shortPubkey(view.stake_vault, 4)} mono />
              <Audit
                label="Actions"
                value={String(view.action_count)}
                mono
              />
            </div>

            {/* Revoke */}
            {view.status === "Active" ? (
              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
                <div className="font-ui text-sm text-muted-foreground">
                  Only the user can end this oath early. Stake returns to the agent.
                </div>
                <RevokeButton oathPda={view.oath_pda} userPubkey={view.user_pubkey} />
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}

function Cell({
  label,
  value,
  hint,
  bar,
}: {
  label: string;
  value: string;
  hint: string;
  bar?: number;
}): JSX.Element {
  return (
    <div className="px-5 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-[24px] leading-none tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
        {hint}
      </div>
      {typeof bar === "number" ? (
        <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-foreground/80 transition-all"
            style={{ width: `${bar}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function Party({ role, pubkey }: { role: string; pubkey: string }): JSX.Element {
  return (
    <a
      href={explorerAddress(pubkey)}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col gap-2 px-5 py-4 transition hover:bg-background/30"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        {role}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[13px] text-foreground/90">
          {shortPubkey(pubkey, 8)}
        </span>
        <ExternalLink className="h-3 w-3 text-muted-foreground transition group-hover:text-foreground" />
      </div>
    </a>
  );
}

function Audit({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): JSX.Element {
  return (
    <div className="px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-[13px] text-foreground ${mono ? "font-mono" : "font-ui"}`}
      >
        {value}
      </div>
    </div>
  );
}

function formatShort(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
