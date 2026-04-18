"use client";

import { AnimatePresence, motion } from "framer-motion";
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
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {steps.map((s) => (
          <motion.div
            key={s.seq}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
          >
            <StepRow step={s} />
          </motion.div>
        ))}
      </AnimatePresence>
      {running ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/80 bg-background/20 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Agent is thinking…
        </div>
      ) : null}
    </div>
  );
}

function StepRow({ step }: { step: ExecuteStep }): JSX.Element {
  const icon = iconForKind(step.kind);
  const ok = step.status === "success";
  const violation =
    step.status === "reverted_scope" || step.status === "reverted_cap";
  const border = violation
    ? "border-[hsl(var(--oath-slash)/0.45)] bg-[hsl(var(--oath-slash)/0.07)]"
    : ok
      ? "border-border bg-background/40"
      : "border-[hsl(var(--oath-warn)/0.35)] bg-[hsl(var(--oath-warn)/0.05)]";
  return (
    <div className={cn("rounded-xl border p-4 backdrop-blur", border)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border",
            violation
              ? "border-[hsl(var(--oath-slash)/0.5)] bg-[hsl(var(--oath-slash)/0.15)] text-[hsl(var(--oath-slash))]"
              : ok
                ? "border-[hsl(var(--oath-ok)/0.45)] bg-[hsl(var(--oath-ok)/0.12)] text-[hsl(var(--oath-ok))]"
                : "border-border bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium">{humanKind(step.kind)}</div>
            {violation ? (
              <Badge variant="danger">{step.error_code ?? "violation"}</Badge>
            ) : ok ? (
              <Badge variant="success">ok</Badge>
            ) : (
              <Badge variant="warn">{step.status}</Badge>
            )}
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
          <p className="mt-1 text-sm text-muted-foreground">{step.rationale}</p>
          {step.details?.candidates ? (
            <CandidateList items={step.details.candidates as Candidate[]} />
          ) : null}
          {step.details?.amount_usdc ? (
            <div className="mt-2 text-xs font-mono text-muted-foreground">
              ${String(step.details.amount_usdc)} →{" "}
              {shortPubkey(String(step.details.recipient ?? ""), 4)}
            </div>
          ) : null}
        </div>
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
      return "Searching places";
    case "book_restaurant":
      return "Booking restaurant";
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
