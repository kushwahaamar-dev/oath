"use client";

import { motion } from "framer-motion";
import { Pause, Play, ShieldCheck } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlanResponse } from "@/lib/client/api";
import { cn, shortPubkey } from "@/lib/utils";

interface Props {
  plan: PlanResponse;
  disabled?: boolean;
  signing?: boolean;
  onApprove: () => void;
  onReject?: () => void;
}

export function OathProposalCard({
  plan,
  disabled,
  signing,
  onApprove,
  onReject,
}: Props): JSX.Element {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const hasAudio = !!plan.voice_audio_b64;
  const { proposal } = plan;

  async function togglePlay(): Promise<void> {
    if (!hasAudio) return;
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      await a.play();
      setIsPlaying(true);
    } else {
      a.pause();
      setIsPlaying(false);
    }
  }

  const expiryHuman =
    proposal.expiry_hours < 2
      ? `${(proposal.expiry_hours * 60).toFixed(0)} min`
      : `${proposal.expiry_hours.toFixed(1)} hr`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ type: "spring", damping: 24, stiffness: 220 }}
      className="chamber-surface relative overflow-hidden rounded-[28px] border border-white/10"
    >
      {/* Kicker strip */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Unsigned covenant · Solana devnet
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
          oath · {shortPubkey(plan.oath_pda, 4)}
        </div>
      </div>

      {/* Hero — the purpose as an editorial statement */}
      <header className="px-6 pt-8">
        <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          I, the agent, swear to
        </div>
        <h2 className="font-display text-balance text-[32px] leading-[1.06] tracking-tight text-foreground md:text-[40px]">
          {proposal.purpose}
        </h2>
        {proposal.reasoning ? (
          <p className="font-ui mt-5 max-w-2xl text-[14px] leading-[1.7] text-muted-foreground/90">
            {proposal.reasoning}
          </p>
        ) : null}
      </header>

      {/* Metadata rail — tight mono grid */}
      <section className="mt-8 grid grid-cols-2 divide-x divide-y divide-white/5 border-y border-white/10 md:grid-cols-4 md:divide-y-0">
        <Cell
          label="Stake"
          value={`${proposal.stake_amount_sol}`}
          unit="SOL"
          hint="slashable"
        />
        <Cell
          label="Spend cap"
          value={`$${proposal.spend_cap_usdc}`}
          unit="USDC"
          hint="cumulative"
        />
        <Cell
          label="Per-tx"
          value={`$${proposal.per_tx_cap_usdc}`}
          unit="USDC"
          hint="max single"
        />
        <Cell
          label="Expiry"
          value={expiryHuman}
          unit=""
          hint="auto-fulfill"
        />
      </section>

      {/* Scope */}
      <section className="space-y-5 px-6 py-6">
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Allowed action types
          </div>
          <div className="flex flex-wrap gap-1.5">
            {proposal.allowed_action_types.map((a) => (
              <Badge key={a} variant="outline" className="font-mono text-[11px]">
                {a}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Whitelisted recipients · {proposal.allowed_recipient_hints.length}
          </div>
          <div className="space-y-1.5">
            {proposal.allowed_recipient_hints.map((hint, i) => (
              <div
                key={`${hint}-${i}`}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-background/30 px-3 py-2 text-sm"
              >
                <span className="font-ui">{hint}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {shortPubkey(plan.resolved_recipients[i] ?? "", 4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature line — the sign moment */}
      <footer className="border-t border-white/10 bg-black/40 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!hasAudio}
            className={cn(
              "font-ui inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/40 px-4 py-2 text-xs text-muted-foreground transition",
              hasAudio ? "hover:text-foreground" : "cursor-not-allowed opacity-50",
            )}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {hasAudio
              ? isPlaying
                ? "Pause narration"
                : "Hear the oath"
              : "TTS disabled"}
          </button>

          <div className="flex items-center gap-2">
            {onReject ? (
              <Button variant="ghost" onClick={onReject} disabled={disabled}>
                Reject
              </Button>
            ) : null}
            <Button
              variant="default"
              size="lg"
              onClick={onApprove}
              disabled={disabled || signing}
              className="font-ui text-sm tracking-tight"
            >
              {signing ? "Awaiting Phantom…" : "Approve & sign on-chain"}
            </Button>
          </div>
        </div>
      </footer>

      {hasAudio ? (
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          src={`data:audio/mpeg;base64,${plan.voice_audio_b64}`}
          preload="none"
          className="hidden"
        />
      ) : null}
    </motion.article>
  );
}

function Cell({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  hint: string;
}): JSX.Element {
  return (
    <div className="px-5 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-display text-[26px] leading-none tracking-tight text-foreground">
          {value}
        </span>
        {unit ? (
          <span className="font-mono text-[11px] text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
      <div className="font-mono mt-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
        {hint}
      </div>
    </div>
  );
}
