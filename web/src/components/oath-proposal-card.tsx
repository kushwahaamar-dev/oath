"use client";

import { motion } from "framer-motion";
import { Clock, Coins, Volume2 } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

  const { proposal } = plan;
  const expiryHuman = `${proposal.expiry_hours < 2 ? (proposal.expiry_hours * 60).toFixed(0) + " min" : proposal.expiry_hours.toFixed(1) + " hr"}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ type: "spring", damping: 24, stiffness: 220 }}
    >
      <Card className="chamber-surface overflow-hidden rounded-[28px] border-white/10 shadow-none">
        <CardHeader className="gap-5 border-b border-white/10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Proposed oath artifact
              </div>
              <CardTitle className="font-display max-w-2xl text-3xl leading-tight">
                {proposal.purpose}
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {proposal.allowed_action_types.slice(0, 3).map((a) => (
                <Badge key={a} variant="outline">
                  {a}
                </Badge>
              ))}
              {proposal.allowed_action_types.length > 3 ? (
                <Badge variant="outline">
                  +{proposal.allowed_action_types.length - 3}
                </Badge>
              ) : null}
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{proposal.reasoning}</p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Spend cap" value={`$${proposal.spend_cap_usdc}`} sublabel="USDC total" />
            <Stat label="Per-tx cap" value={`$${proposal.per_tx_cap_usdc}`} sublabel="single pay" />
            <Stat label="Stake" value={`${proposal.stake_amount_sol} SOL`} sublabel="slashable" />
          </div>

          <Separator />

          <div className="grid gap-3 md:grid-cols-2">
            <MetaRow icon={<Clock className="h-3.5 w-3.5" />} label="Expires in">
              {expiryHuman}
            </MetaRow>
            <MetaRow icon={<Coins className="h-3.5 w-3.5" />} label="Oath PDA">
              <span className="font-mono text-xs">{shortPubkey(plan.oath_pda, 6)}</span>
            </MetaRow>
          </div>

          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Whitelisted recipients
            </div>
            <div className="flex flex-wrap gap-1.5">
              {proposal.allowed_recipient_hints.map((hint, i) => (
                <Badge key={`${hint}-${i}`} variant="neutral">
                  {hint}
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/70">
                    {shortPubkey(plan.resolved_recipients[i] ?? "", 3)}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!hasAudio}
            className={cn(
              "font-ui inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs text-muted-foreground transition",
              hasAudio ? "hover:text-foreground" : "cursor-not-allowed opacity-50",
            )}
          >
            <Volume2 className={cn("h-3.5 w-3.5", isPlaying && "text-primary")} />
            {hasAudio
              ? isPlaying
                ? "Pause narration"
                : "Play narration"
              : "TTS disabled (ElevenLabs key missing)"}
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
            >
              {signing ? "Waiting for wallet…" : "Approve & sign"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {hasAudio ? (
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          src={`data:audio/mpeg;base64,${plan.voice_audio_b64}`}
          preload="none"
          className="hidden"
        />
      ) : null}
    </motion.div>
  );
}

function Stat({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}): JSX.Element {
  return (
    <div className="rounded-[20px] border border-border/70 bg-background/40 p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-display mt-2 text-2xl leading-none"
      >
        {value}
      </motion.div>
      {sublabel ? (
        <div className="font-ui mt-1 text-[11px] text-muted-foreground/70">{sublabel}</div>
      ) : null}
    </div>
  );
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-border bg-background/30 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="font-ui">{label}</span>
      </div>
      <div className="font-mono text-xs">{children}</div>
    </div>
  );
}
