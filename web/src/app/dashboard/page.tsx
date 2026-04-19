"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleOff, RefreshCw } from "lucide-react";

import { DashboardHeroRail } from "@/components/dashboard/dashboard-hero-rail";
import {
  DashboardLedger,
  type DashboardLedgerRow,
} from "@/components/dashboard/dashboard-ledger";
import { SummaryRail } from "@/components/dashboard/summary-rail";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/config";

interface FeedResponse {
  mocked: boolean;
  oaths: DashboardLedgerRow[];
  violations: Array<{ oath_pda: string; scope_check_result: string; timestamp: string }>;
}

async function fetchFeed(): Promise<FeedResponse> {
  const r = await fetch("/api/dashboard/feed", { cache: "no-store" });
  if (!r.ok) throw new Error(`feed ${r.status}`);
  return r.json();
}

export default function DashboardPage(): JSX.Element {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
    refetchInterval: 5_000,
  });

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

          {data?.mocked ? (
            <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
              <CircleOff className="h-4 w-4" />
              MongoDB not configured — dashboard is live but empty until you set
              <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono">
                MONGODB_URI
              </code>
              . Create an oath from the demo and it will reflect on-chain even
              without persistence.
            </div>
          ) : null}

          <div className="mt-10">
            <SummaryRail
              totalOaths={data?.oaths.length ?? 0}
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
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-[24px]" />
                <Skeleton className="h-20 w-full rounded-[24px]" />
                <Skeleton className="h-20 w-full rounded-[24px]" />
              </div>
            ) : (
              <DashboardLedger oaths={data?.oaths ?? []} />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
