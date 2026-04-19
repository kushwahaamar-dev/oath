import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn, lamportsToSol, microToUsdc, shortPubkey } from "@/lib/utils";

export interface DashboardLedgerRow {
  oath_pda: string;
  purpose: string;
  status: "Active" | "Expired" | "Revoked" | "Slashed" | "Fulfilled";
  created_at: string;
  stake_lamports: string;
  spend_cap_micro: string;
}

export function DashboardLedger({
  oaths,
}: {
  oaths: DashboardLedgerRow[];
}): JSX.Element {
  if (oaths.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-border bg-card/20 p-6 text-sm text-muted-foreground">
        No oaths recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-card/20">
      {oaths.map((row, index) => {
        const cap = microToUsdc(BigInt(row.spend_cap_micro));
        const stake = lamportsToSol(BigInt(row.stake_lamports));
        const createdAt = new Date(row.created_at);
        const createdLabel = Number.isNaN(createdAt.getTime())
          ? row.created_at
          : createdAt.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

        return (
          <Link
            key={row.oath_pda}
            href={`/oath/${row.oath_pda}`}
            className={cn(
              "grid gap-4 px-5 py-4 transition hover:bg-background/30 md:grid-cols-[120px_1fr_auto]",
              index < oaths.length - 1 && "border-b border-border",
            )}
          >
            <div className="flex items-start">
              <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium tracking-tight">{row.purpose}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                {shortPubkey(row.oath_pda, 4)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground md:justify-end">
              <span>{createdLabel}</span>
              <span>cap ${cap.toFixed(0)}</span>
              <span>stake {stake.toFixed(2)} SOL</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function statusVariant(
  status: DashboardLedgerRow["status"],
): "danger" | "success" | "neutral" {
  if (status === "Slashed") {
    return "danger";
  }

  if (status === "Active") {
    return "success";
  }

  return "neutral";
}
