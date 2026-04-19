"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Wallet, Zap } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

import { ActionTimeline } from "@/components/action-timeline";
import { AttackButton, ATTACK_PROMPT } from "@/components/attack-button";
import { BalanceBadge } from "@/components/balance-badge";
import { ChatStage } from "@/components/chat/chat-stage";
import { CompactProposal } from "@/components/chat/compact-proposal";
import { RequestComposer } from "@/components/chat/request-composer";
import { WalletStatus } from "@/components/chat/wallet-status";
import { OathProposalCard } from "@/components/oath-proposal-card";
import { SlashBanner } from "@/components/slash-banner";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/config";
import {
  apiExecute,
  apiPlan,
  apiSignTx,
  type ExecuteResponse,
  type PlanResponse,
} from "@/lib/client/api";
import { deriveChatVisualState } from "@/lib/chat-visual-state";
import { shortPubkey } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Book dinner for 4 tonight in downtown Austin under $200, avoiding seafood.",
  "Research competitors for our startup and summarize findings. No purchases.",
  "Reserve a car for Friday evening in SF, pickup before 6pm, under $150.",
];

type Phase = "idle" | "planning" | "awaiting-signature" | "submitting" | "active" | "completed";

interface ChatState {
  phase: Phase;
  request: string;
  plan?: PlanResponse;
  createTxSig?: string;
  execution?: ExecuteResponse;
  error?: string;
}

export default function ChatPage(): JSX.Element {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [request, setRequest] = React.useState(EXAMPLE_PROMPTS[0]!);
  const [state, setState] = React.useState<ChatState>({
    phase: "idle",
    request: "",
  });

  const canPlan = connected && !!publicKey && request.trim().length > 4 && state.phase === "idle";

  async function plan(): Promise<void> {
    if (!publicKey) return;
    setState({ phase: "planning", request });
    try {
      const plan = await apiPlan({
        request,
        user_pubkey: publicKey.toBase58(),
      });
      setState({ phase: "awaiting-signature", request, plan });
    } catch (err) {
      const msg = (err as Error).message;
      setState({ phase: "idle", request, error: msg });
      toast.error("Planning failed", { description: msg });
    }
  }

  async function approveAndSign(): Promise<void> {
    if (!state.plan || !publicKey || !signTransaction) return;
    setState((s) => ({ ...s, phase: "submitting", error: undefined }));
    try {
      // Fetch a fresh partial-signed tx right before the Phantom popup so
      // the blockhash is maximally fresh (avoids "Blockhash not found").
      const signReq = await apiSignTx({
        proposal: state.plan.proposal,
        user_pubkey: publicKey.toBase58(),
        agent_pubkey: state.plan.agent_pubkey,
        oath_id: state.plan.oath_id,
      });
      const raw = Buffer.from(signReq.partial_signed_tx_b64, "base64");
      const tx = Transaction.from(raw);
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: signReq.blockhash,
          lastValidBlockHeight: signReq.last_valid_block_height,
        },
        "confirmed",
      );
      toast.success("Oath created on-chain", {
        description: `tx ${shortPubkey(sig, 6)}`,
      });
      setState((s) => ({ ...s, phase: "active", createTxSig: sig, error: undefined }));
      await runExecution();
    } catch (err) {
      const msg = (err as Error).message;
      setState((s) => ({ ...s, phase: "awaiting-signature", error: msg }));
      toast.error("Signature rejected", { description: msg });
    }
  }

  async function runExecution(injected?: string): Promise<void> {
    if (!state.plan) return;
    setState((s) => ({
      ...s,
      phase: "active",
      error: undefined,
      execution: undefined,
    }));
    try {
      const out = await apiExecute({
        oath_pda: state.plan.oath_pda,
        user_request: state.request,
        injected_instruction: injected,
      });
      setState((s) => ({
        ...s,
        phase: "completed",
        execution: out,
        error: undefined,
      }));
      if (out.slashed) {
        toast.warning("Oath slashed — stake transferred to user", {
          description: out.slash_tx ? `slash ${shortPubkey(out.slash_tx, 6)}` : undefined,
        });
      } else {
        toast.success(out.final_message || "Task complete");
      }
    } catch (err) {
      const msg = (err as Error).message;
      setState((s) => ({
        ...s,
        phase: "completed",
        error: msg,
        execution: undefined,
      }));
      toast.error("Execution failed", { description: msg });
    }
  }

  async function runAttack(): Promise<void> {
    await runExecution(ATTACK_PROMPT);
  }

  function reset(): void {
    setState({ phase: "idle", request: "" });
    setRequest(EXAMPLE_PROMPTS[0]!);
  }

  const { phase, plan: currentPlan, execution } = state;
  const visualState = deriveChatVisualState({
    phase,
    execution: execution ? { slashed: execution.slashed } : undefined,
    error: state.error,
  });

  return (
    <>
      <SiteHeader programId={env.NEXT_PUBLIC_OATH_PROGRAM_ID} />
      <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,_hsl(250_90%_65%_/_0.12),_transparent_55%)]" />

        <div className="container relative mx-auto max-w-6xl px-6 py-10">
          <motion.header
            layout
            className="mb-6 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Demo · Scene {phase === "idle" ? 1 : phase === "completed" && execution?.slashed ? 2 : 1}
              </div>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-[0.98] tracking-tight md:text-5xl">
                Agent concierge
              </h1>
            </div>
            <WalletStatus />
          </motion.header>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-start">
            <div className="xl:order-2">
              <ChatStage state={visualState} title="Oath Chamber" />
            </div>

            <div className="xl:order-1">
              <div className="mb-4">
                <BalanceBadge />
              </div>

              {/* Request composer */}
              <AnimatePresence initial={false}>
                {phase === "idle" ? (
                  <motion.section
                    key="composer"
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <RequestComposer
                      value={request}
                      examples={EXAMPLE_PROMPTS}
                      disabled={!canPlan}
                      onChange={setRequest}
                      onSubmit={plan}
                    />
                    {!connected ? (
                      <div className="font-ui rounded-xl border border-border bg-card/40 p-4 text-[15px] leading-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          Connect a devnet Phantom wallet (top-right) to sign the
                          oath transaction.
                        </div>
                      </div>
                    ) : null}
                  </motion.section>
                ) : null}
              </AnimatePresence>

              {/* Planning spinner */}
              {phase === "planning" ? (
                <div className="font-ui mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-background/40 p-5 text-[15px] leading-6 text-muted-foreground">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    className="inline-flex h-4 w-4 rounded-full border-2 border-primary border-r-transparent"
                  />
                  Gemini is composing an on-chain oath from your request…
                </div>
              ) : null}

              {/* Proposal */}
              {currentPlan && phase !== "idle" && phase !== "planning" ? (
                <section className="mt-4 space-y-6">
                  {phase !== "completed" || !execution?.slashed ? null : (
                    <SlashBanner
                      visible
                      errorCode={execution.steps.find((s) => s.error_code)?.error_code}
                      slashTx={execution.slash_tx}
                    />
                  )}
                  {phase === "awaiting-signature" || phase === "submitting" ? (
                    <OathProposalCard
                      plan={currentPlan}
                      onApprove={approveAndSign}
                      signing={phase === "submitting"}
                    />
                  ) : (
                    <CompactProposal plan={currentPlan} createTxSig={state.createTxSig} />
                  )}

                  {state.error && phase === "awaiting-signature" ? (
                    <div className="rounded-xl border border-[hsl(var(--oath-warn)/0.4)] bg-[hsl(var(--oath-warn)/0.08)] p-3 font-mono text-xs text-[hsl(var(--oath-warn))]">
                      {state.error}
                    </div>
                  ) : null}

                  {(phase === "active" || phase === "completed") && execution ? (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          Agent execution
                        </h2>
                        <Badge variant={execution.slashed ? "danger" : "success"}>
                          {execution.slashed ? "slashed" : "completed"}
                        </Badge>
                      </div>
                      <ActionTimeline steps={execution.steps} />
                      {execution.final_message ? (
                        <div className="rounded-2xl border border-border bg-card/40 p-4 text-sm">
                          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            Agent final message
                          </div>
                          <div className="mt-1.5 text-foreground">{execution.final_message}</div>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {phase === "active" && !execution ? (
                    <ActionTimeline steps={[]} running />
                  ) : null}

                  {/* Controls after the first run */}
                  {phase === "completed" ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/40 p-4">
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-primary" />
                        <div className="text-sm text-muted-foreground">
                          {execution?.slashed
                            ? "Start fresh to run a new scenario."
                            : "Same oath still active? Run the jailbreak attack."}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {execution && !execution.slashed ? (
                          <AttackButton onClick={runAttack} armed />
                        ) : null}
                        <Button variant="outline" onClick={reset}>
                          New request
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
