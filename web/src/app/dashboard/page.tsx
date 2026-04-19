"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { DashboardHeroRail } from "@/components/dashboard/dashboard-hero-rail";
import {
  DashboardLedger,
  type DashboardLedgerRow,
} from "@/components/dashboard/dashboard-ledger";
import { SummaryRail } from "@/components/dashboard/summary-rail";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/config";
import type { OathView } from "@/lib/types";

interface FeedResponse {
  oaths: OathView[];
  violations: Array<{
    oath_pda: string;
    purpose: string;
    stake_lamports: string;
    user_pubkey: string;
    agent_pubkey: string;
    timestamp: number;
  }>;
  total: number;
}

async function fetchFeed(): Promise<FeedResponse> {
  const r = await fetch("/api/dashboard/feed", { cache: "no-store" });
  if (!r.ok) throw new Error(`feed ${r.status}`);
  return r.json();
}

function toLedgerRow(o: OathView): DashboardLedgerRow {
  return {
    oath_pda: o.oath_pda,
    purpose: o.purpose,
    status: o.status,
    created_at: new Date(o.created_at * 1000).toISOString(),
    stake_lamports: o.stake_amount,
    spend_cap_micro: o.spend_cap,
  };
}

export default function DashboardPage(): JSX.Element {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
    refetchInterval: 5_000,
  });

  const rows = (data?.oaths ?? []).map(toLedgerRow);

  return (
    <>
      <SiteHeader programId={env.NEXT_PUBLIC_OATH_PROGRAM_ID} />
      <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_hsl(250_90%_65%_/_0.08),_transparent_55%)]" />

        <div className="container relative mx-auto max-w-6xl px-6 py-10">
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => refetch()}
              className="font-ui inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              refresh
            </button>
          </div>

          <DashboardHeroRail />

          <div className="mt-10">
            <SummaryRail
              totalOaths={data?.total ?? 0}
              totalViolations={data?.violations.length ?? 0}
            />
          </div>

          <section className="mt-10">
            <div className="mb-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Evidence ledger
              </div>
              <h2 className="font-display mt-2 text-3xl tracking-tight">
                Recorded mandates
              </h2>
              <p className="font-ui mt-2 max-w-xl text-sm text-muted-foreground">
                Every row below is fetched directly from the Oath program on
                Solana devnet — the protocol itself is the database.
              </p>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-[24px]" />
                <Skeleton className="h-20 w-full rounded-[24px]" />
                <Skeleton className="h-20 w-full rounded-[24px]" />
              </div>
            ) : (
              <DashboardLedger oaths={rows} />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
