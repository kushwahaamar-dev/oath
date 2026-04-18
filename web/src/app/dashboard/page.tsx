"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CircleOff, RefreshCw } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/config";
import { lamportsToSol, microToUsdc, shortPubkey } from "@/lib/utils";

interface FeedRow {
  oath_pda: string;
  purpose: string;
  status: "Active" | "Expired" | "Revoked" | "Slashed" | "Fulfilled";
  created_at: string;
  stake_lamports: string;
  spend_cap_micro: string;
}

interface FeedResponse {
  mocked: boolean;
  oaths: FeedRow[];
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
      <main className="container mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live feed of on-chain oaths and violation attempts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            refresh
          </button>
        </div>

        {data?.mocked ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
            <CircleOff className="h-4 w-4" />
            MongoDB not configured — dashboard is live but empty until you set
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono">MONGODB_URI</code>.
            Create an oath from the demo and it will reflect on-chain even
            without persistence.
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-3">
            <SectionTitle>Oaths</SectionTitle>
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : data?.oaths.length ? (
              data.oaths.map((row) => (
                <OathRow key={row.oath_pda} row={row} />
              ))
            ) : (
              <EmptyCard
                title="No oaths yet"
                body="Sign one from the demo to see it show up here in real time."
              />
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle>Violations</SectionTitle>
            {data?.violations.length ? (
              data.violations.map((v, i) => (
                <Card key={`${v.oath_pda}-${i}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="danger">{v.scope_check_result}</Badge>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {new Date(v.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-medium">
                      <Link
                        href={`/oath/${v.oath_pda}`}
                        className="font-mono hover:text-primary"
                      >
                        {shortPubkey(v.oath_pda, 4)}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <EmptyCard title="No violations" body="Nothing out of scope. Yet." />
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

function OathRow({ row }: { row: FeedRow }): JSX.Element {
  const statusVariant =
    row.status === "Active"
      ? "success"
      : row.status === "Slashed"
        ? "danger"
        : "neutral";
  const cap = microToUsdc(BigInt(row.spend_cap_micro));
  const stake = lamportsToSol(BigInt(row.stake_lamports));
  return (
    <Link href={`/oath/${row.oath_pda}`}>
      <Card className="transition hover:border-primary/40">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <Badge variant={statusVariant}>{row.status}</Badge>
              <span className="font-mono">{shortPubkey(row.oath_pda, 4)}</span>
            </div>
            <div className="mt-1 truncate text-sm font-medium">{row.purpose}</div>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
            <span>cap ${cap.toFixed(0)}</span>
            <span>stake {stake.toFixed(2)} SOL</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-6 text-sm">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-muted-foreground">{body}</div>
    </div>
  );
}
