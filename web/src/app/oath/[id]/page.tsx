import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicKey } from "@solana/web3.js";

import { explorerAddress, explorerTx } from "@/components/action-timeline";
import { RevokeButton } from "@/components/revoke-button";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/config";
import { fetchOathView } from "@/lib/solana/oath";
import {
  lamportsToSol,
  microToUsdc,
  shortPubkey,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  const statusVariant =
    view.status === "Active"
      ? "success"
      : view.status === "Slashed"
        ? "danger"
        : view.status === "Revoked" || view.status === "Expired"
          ? "warn"
          : "neutral";

  const spentPct =
    Number(BigInt(view.spent) * 100n) / Math.max(Number(BigInt(view.spend_cap)), 1);

  return (
    <>
      <SiteHeader programId={env.NEXT_PUBLIC_OATH_PROGRAM_ID} />
      <main className="container mx-auto max-w-4xl px-6 py-10">
        <nav className="mb-6 text-xs text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            ← dashboard
          </Link>
        </nav>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                Oath · #{view.oath_id}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant}>{view.status}</Badge>
                {view.status === "Active" ? (
                  <RevokeButton
                    oathPda={view.oath_pda}
                    userPubkey={view.user_pubkey}
                  />
                ) : null}
              </div>
            </div>
            <CardTitle className="text-balance text-2xl leading-tight">
              {view.purpose}
            </CardTitle>
            <a
              href={explorerAddress(view.oath_pda)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            >
              {view.oath_pda}
            </a>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <Stat
                label="Spent / Cap"
                value={`$${microToUsdc(BigInt(view.spent)).toFixed(0)} / $${microToUsdc(BigInt(view.spend_cap)).toFixed(0)}`}
                pct={Math.min(spentPct, 100)}
              />
              <Stat
                label="Per-tx cap"
                value={`$${microToUsdc(BigInt(view.per_tx_cap)).toFixed(0)}`}
              />
              <Stat
                label="Stake"
                value={`${lamportsToSol(BigInt(view.stake_amount)).toFixed(2)} SOL`}
              />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <Row label="User">
                <Addr pubkey={view.user_pubkey} />
              </Row>
              <Row label="Agent">
                <Addr pubkey={view.agent_pubkey} />
              </Row>
              <Row label="Stake vault">
                <Addr pubkey={view.stake_vault} />
              </Row>
              <Row label="Expires">
                <span>{new Date(view.expiry * 1000).toLocaleString()}</span>
              </Row>
              <Row label="Created">
                <span>{new Date(view.created_at * 1000).toLocaleString()}</span>
              </Row>
              <Row label="Actions recorded">
                <span className="font-mono">{view.action_count}</span>
              </Row>
            </div>

            <Separator />

            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                Allowed action types
              </div>
              <div className="flex flex-wrap gap-1.5">
                {view.allowed_action_types.map((a) => (
                  <Badge key={a} variant="outline">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                Allowed recipients
              </div>
              <div className="flex flex-wrap gap-1.5">
                {view.allowed_recipients.map((r) => (
                  <a
                    key={r}
                    href={explorerAddress(r)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Badge variant="neutral" className="font-mono text-[10px]">
                      {shortPubkey(r, 4)}
                    </Badge>
                  </a>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );

  function Addr({ pubkey }: { pubkey: string }): JSX.Element {
    return (
      <a
        href={explorerAddress(pubkey)}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs hover:text-foreground"
      >
        {shortPubkey(pubkey, 6)}
      </a>
    );
  }
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background/30 px-3 py-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct?: number;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-xl font-semibold">{value}</div>
      {typeof pct === "number" ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

// just to avoid unused-var warnings when `Addr` is inlined inside the page
function _noop_reference(): void {
  void explorerTx;
}
void _noop_reference;
