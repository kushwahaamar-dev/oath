"use client";

import {
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Loader2,
  Play,
  Search,
  Utensils,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/config";
import type { ExecuteStep } from "@/lib/client/api";
import { cn, shortPubkey } from "@/lib/utils";

interface Props {
  steps: ExecuteStep[];
  running?: boolean;
}

export function ActionTimeline({ steps, running }: Props): JSX.Element {
  return (
    <div className="space-y-0 overflow-hidden rounded-[24px] border border-border bg-card/20">
      {steps.map((s, i) => (
        <StepRow
          key={s.seq}
          step={s}
          showBottomBorder={i < steps.length - 1 || !!running}
        />
      ))}
      {running ? (
        <div className="flex items-center gap-2 border-t border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Agent is thinking…
        </div>
      ) : null}
    </div>
  );
}

function StepRow({
  step,
  showBottomBorder,
}: {
  step: ExecuteStep;
  showBottomBorder: boolean;
}): JSX.Element {
  const icon = iconForKind(step.kind);
  const ok = step.status === "success";
  const violation =
    step.status === "reverted_scope" || step.status === "reverted_cap";
  const tone = violation
    ? "bg-[hsl(var(--oath-slash)/0.06)]"
    : ok
      ? "bg-background/40"
      : "bg-[hsl(var(--oath-warn)/0.05)]";
  return (
    <div
      className={cn(
        "grid gap-4 px-5 py-4 md:grid-cols-[120px_1fr_auto]",
        showBottomBorder && "border-b border-border",
        tone,
      )}
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {String(step.seq).padStart(2, "0")}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/40 text-muted-foreground">
            {icon}
          </div>
          <div className="text-sm font-medium tracking-tight">{humanKind(step.kind)}</div>
          {step.on_chain_tx ? (
            <a
              href={explorerTx(step.on_chain_tx)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition hover:text-foreground"
            >
              {shortPubkey(step.on_chain_tx, 4)}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.rationale}</p>
        {step.details?.candidates ? (
          <CandidateList items={step.details.candidates as Candidate[]} />
        ) : null}
        {step.details?.amount_usdc ? (
          <div className="mt-2 font-mono text-xs text-muted-foreground">
            ${String(step.details.amount_usdc)} → {shortPubkey(String(step.details.recipient ?? ""), 4)}
          </div>
        ) : null}
      </div>
      <div className="flex items-start md:justify-end">
        <Badge variant={violation ? "danger" : ok ? "success" : "warn"}>
          {violation ? (step.error_code ?? step.status) : step.status}
        </Badge>
      </div>
    </div>
  );
}

interface Candidate {
  name?: string;
  address?: string;
  price_estimate_usdc?: number;
  recipient_pubkey?: string;
}

function CandidateList({ items }: { items: Candidate[] }): JSX.Element {
  return (
    <ul className="mt-2 divide-y divide-border/70 rounded-lg border border-border/70 bg-background/30">
      {items.slice(0, 4).map((it, i) => (
        <li
          key={`${it.name ?? i}`}
          className="flex items-center justify-between px-3 py-2 text-xs"
        >
          <div className="flex min-w-0 items-center gap-2">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <div className="truncate">
              <span className="font-medium">{it.name ?? "Unknown"}</span>
              <span className="ml-2 text-muted-foreground">{it.address}</span>
            </div>
          </div>
          {typeof it.price_estimate_usdc === "number" ? (
            <span className="font-mono text-muted-foreground">
              ~${it.price_estimate_usdc}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function iconForKind(kind: string): React.ReactNode {
  switch (kind) {
    case "search_places":
      return <Search className="h-4 w-4" />;
    case "book_restaurant":
      return <Utensils className="h-4 w-4" />;
    case "complete":
      return <Check className="h-4 w-4" />;
    case "abort":
      return <CircleAlert className="h-4 w-4" />;
    default:
      return <Play className="h-4 w-4" />;
  }
}

function humanKind(kind: string): string {
  switch (kind) {
    case "search_places":
      return "Scanning recipients";
    case "book_restaurant":
      return "Recording payment";
    case "complete":
      return "Task complete";
    case "abort":
      return "Agent aborted";
    default:
      return kind;
  }
}

export function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=${env.NEXT_PUBLIC_SOLANA_CLUSTER}`;
}
export function explorerAddress(addr: string): string {
  return `https://explorer.solana.com/address/${addr}?cluster=${env.NEXT_PUBLIC_SOLANA_CLUSTER}`;
}
