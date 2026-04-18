"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, Wallet, Zap } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

import { ActionTimeline, explorerAddress } from "@/components/action-timeline";
import { AttackButton, ATTACK_PROMPT } from "@/components/attack-button";
import { OathProposalCard } from "@/components/oath-proposal-card";
import { SlashBanner } from "@/components/slash-banner";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/config";
import {
  apiExecute,
  apiPlan,
  type ExecuteResponse,
  type PlanResponse,
} from "@/lib/client/api";
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
    setState((s) => ({ ...s, phase: "submitting" }));
    try {
      const raw = Buffer.from(state.plan.partial_signed_tx_b64, "base64");
      const tx = Transaction.from(raw);
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: state.plan.blockhash,
          lastValidBlockHeight: state.plan.last_valid_block_height,
        },
        "confirmed",
      );
      toast.success("Oath created on-chain", {
        description: `tx ${shortPubkey(sig, 6)}`,
      });
      setState((s) => ({ ...s, phase: "active", createTxSig: sig }));
      await runExecution();
    } catch (err) {
      const msg = (err as Error).message;
      setState((s) => ({ ...s, phase: "awaiting-signature", error: msg }));
      toast.error("Signature rejected", { description: msg });
    }
  }

  async function runExecution(injected?: string): Promise<void> {
    if (!state.plan) return;
    setState((s) => ({ ...s, phase: "active" }));
    try {
      const out = await apiExecute({
        oath_pda: state.plan.oath_pda,
        user_request: state.request,
        injected_instruction: injected,
      });
      setState((s) => ({ ...s, phase: "completed", execution: out }));
      if (out.slashed) {
        toast.warning("Oath slashed — stake transferred to user", {
          description: out.slash_tx ? `slash ${shortPubkey(out.slash_tx, 6)}` : undefined,
        });
      } else {
        toast.success(out.final_message || "Task complete");
      }
    } catch (err) {
      const msg = (err as Error).message;
      setState((s) => ({ ...s, phase: "completed", error: msg }));
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

  return (
    <>
      <SiteHeader programId={env.NEXT_PUBLIC_OATH_PROGRAM_ID} />
      <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,_hsl(250_90%_65%_/_0.12),_transparent_55%)]" />

        <div className="container relative mx-auto max-w-3xl px-6 py-10">
          <motion.header
            layout
            className="mb-6 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Demo · Scene {phase === "idle" ? 1 : phase === "completed" && execution?.slashed ? 2 : 1}
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Agent concierge</h1>
            </div>
            <WalletStatus />
          </motion.header>

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
                <label
                  htmlFor="req"
                  className="block text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Your request
                </label>
                <Textarea
                  id="req"
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="Tell the agent what to do. It'll propose an on-chain oath before acting."
                  rows={3}
                  className="text-base"
                />
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRequest(p)}
                      className="rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      {p.length > 54 ? `${p.slice(0, 54)}…` : p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="lg"
                    onClick={plan}
                    disabled={!canPlan}
                    className="group"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Propose oath
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Button>
                </div>
                {!connected ? (
                  <div className="rounded-xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">
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
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-background/40 p-5 text-sm text-muted-foreground">
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
                    <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                      Agent execution
                    </h2>
                    <Badge variant={execution.slashed ? "danger" : "success"}>
                      {execution.slashed ? "slashed" : "completed"}
                    </Badge>
                  </div>
                  <ActionTimeline steps={execution.steps} />
                  {execution.final_message ? (
                    <div className="rounded-2xl border border-border bg-card/40 p-4 text-sm">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
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
      </main>
    </>
  );
}

function WalletStatus(): JSX.Element {
  const { publicKey, connected } = useWallet();
  if (!connected || !publicKey) {
    return (
      <Badge variant="warn">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--oath-warn))]" />
        wallet not connected
      </Badge>
    );
  }
  return (
    <a
      href={explorerAddress(publicKey.toBase58())}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--oath-ok)/0.35)] bg-[hsl(var(--oath-ok)/0.1)] px-3 py-1 font-mono text-xs text-[hsl(var(--oath-ok))] transition hover:bg-[hsl(var(--oath-ok)/0.18)]"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--oath-ok))]" />
      {shortPubkey(publicKey.toBase58(), 4)}
    </a>
  );
}

function CompactProposal({
  plan,
  createTxSig,
}: {
  plan: PlanResponse;
  createTxSig?: string;
}): JSX.Element {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/40 p-4"
    >
      <Badge variant="success">signed</Badge>
      <div className="min-w-0 flex-1 truncate text-sm">{plan.proposal.purpose}</div>
      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span>cap</span>
        <span>${plan.proposal.spend_cap_usdc}</span>
        <span>·</span>
        <span>stake</span>
        <span>{plan.proposal.stake_amount_sol} SOL</span>
        {createTxSig ? (
          <>
            <span>·</span>
            <a
              href={`https://explorer.solana.com/tx/${createTxSig}?cluster=${env.NEXT_PUBLIC_SOLANA_CLUSTER}`}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              tx {shortPubkey(createTxSig, 4)}
            </a>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
