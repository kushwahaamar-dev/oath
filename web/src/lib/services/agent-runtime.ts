import { Keypair, PublicKey, SendTransactionError } from "@solana/web3.js";

import { env } from "@/lib/config";
import { makeViolationProof, loadOracleSecret } from "@/lib/external/oracle";
import { planNextAction, type AgentContext } from "@/lib/gemini/plan-next-action";
import { log } from "@/lib/logger";
import { loadKeypair } from "@/lib/solana/client";
import { recordAction, slashOath } from "@/lib/solana/oath";
import { synthesize } from "@/lib/tts/eleven-labs";
import type { OathView } from "@/lib/types";
import { microToUsdc, usdcToMicro } from "@/lib/utils";

export interface ExecuteParams {
  oath: OathView;
  userRequest: string;
  injectedInstruction?: string;
  maxSteps?: number;
}

export type StepStatus = "success" | "reverted_scope" | "reverted_other";

export interface StepRecord {
  seq: number;
  kind: string;
  rationale: string;
  status: StepStatus;
  on_chain_tx: string | null;
  error_code?: string;
  tts_audio_b64?: string | null;
  details?: Record<string, unknown>;
}

export interface ExecuteResult {
  steps: StepRecord[];
  final_message: string;
  slashed: boolean;
  slash_tx?: string;
}

interface Candidate {
  name: string;
  address: string;
  price_estimate_usdc: number;
  recipient_pubkey: string;
}

const agentKeypairCache: { kp?: Keypair } = {};
function getAgentKeypair(): Keypair {
  if (!agentKeypairCache.kp) {
    agentKeypairCache.kp = loadKeypair(env.AGENT_KEYPAIR_PATH);
  }
  return agentKeypairCache.kp;
}

function scopeViolationCode(err: unknown): string | undefined {
  const anyErr = err as { error?: { errorCode?: { code?: string } }; logs?: string[]; message?: string };
  const direct = anyErr?.error?.errorCode?.code;
  if (direct) return direct;
  const blob = `${anyErr?.message ?? ""}\n${(anyErr?.logs ?? []).join("\n")}`;
  for (const code of [
    "UnauthorizedActionType",
    "RecipientNotAllowed",
    "PerTxCapExceeded",
    "SpendCapExceeded",
    "OathNotActive",
    "OathExpired",
  ]) {
    if (blob.includes(code)) return code;
  }
  return undefined;
}

/**
 * Synthesize candidate recipients from the oath's whitelist. Deterministic,
 * no external API — the oath's allowed_recipients is the ground truth, so
 * we just project them into displayable "candidates" for the UI.
 */
function buildCandidates(oath: OathView): Candidate[] {
  const cap = Math.max(1, Number(microToUsdc(BigInt(oath.per_tx_cap))));
  return oath.allowed_recipients.map((pk, i) => {
    const hashSeed = pk.charCodeAt(0) + pk.charCodeAt(pk.length - 1);
    const priceJitter = ((hashSeed % 30) - 15) * 1.5;
    const price = Math.max(12, Math.round(cap * 0.7 + priceJitter));
    return {
      name: `Recipient ${i + 1} · ${pk.slice(0, 4)}…${pk.slice(-4)}`,
      address: "Downtown Austin",
      price_estimate_usdc: price,
      recipient_pubkey: pk,
    };
  });
}

/**
 * Stateless execution loop. Each step:
 *   1. Gemini decides the next action
 *   2. If it needs a payment, we call `record_action` — which reverts on scope violation
 *   3. On revert we attempt to slash (demo: triggers the money-flow clip)
 *   4. On success we call the downstream tool and append it to the returned steps
 *
 * No off-chain persistence: on-chain oath state + the steps in this response
 * are the only sources of truth the UI needs.
 */
export async function executeOath(params: ExecuteParams): Promise<ExecuteResult> {
  const { oath, injectedInstruction } = params;
  const maxSteps = params.maxSteps ?? 4;
  const agent = getAgentKeypair();
  const oathPk = new PublicKey(oath.oath_pda);
  const userPk = new PublicKey(oath.user_pubkey);
  const vaultPk = new PublicKey(oath.stake_vault);

  const ctx: AgentContext = {
    oath: {
      purpose: oath.purpose,
      spend_cap_usdc: Number(microToUsdc(BigInt(oath.spend_cap))),
      per_tx_cap_usdc: Number(microToUsdc(BigInt(oath.per_tx_cap))),
      spent_usdc: Number(microToUsdc(BigInt(oath.spent))),
      allowed_action_types: oath.allowed_action_types,
      allowed_recipients: oath.allowed_recipients,
    },
    history: [],
    injected_instruction: injectedInstruction,
  };
  let candidates: Candidate[] | undefined;
  const steps: StepRecord[] = [];
  let finalMessage = "";

  for (let seq = 0; seq < maxSteps; seq++) {
    ctx.search_results = candidates?.map((r) => ({
      name: r.name,
      address: r.address,
      price_estimate_usdc: r.price_estimate_usdc,
      recipient_pubkey: r.recipient_pubkey,
    }));
    const next = await planNextAction(ctx);
    log.info("agent.step", { seq, kind: next.kind });

    if (next.kind === "search_places") {
      candidates = buildCandidates(oath);
      const audio = await synthesize(
        `Reviewing ${candidates.length} authorized recipients. Picking the best fit.`,
      );
      steps.push({
        seq,
        kind: next.kind,
        rationale: next.rationale,
        status: "success",
        on_chain_tx: null,
        tts_audio_b64: audio,
        details: { candidates },
      });
      ctx.history.push({ kind: next.kind, rationale: next.rationale, result: { n: candidates.length } });
      continue;
    }

    if (next.kind === "complete") {
      finalMessage = next.final_message ?? "Task complete.";
      const audio = await synthesize(finalMessage);
      steps.push({
        seq,
        kind: next.kind,
        rationale: next.rationale,
        status: "success",
        on_chain_tx: null,
        tts_audio_b64: audio,
      });
      break;
    }

    if (next.kind === "abort") {
      finalMessage = next.final_message ?? "Aborted: cannot satisfy oath.";
      const audio = await synthesize(finalMessage);
      steps.push({
        seq,
        kind: next.kind,
        rationale: next.rationale,
        status: "success",
        on_chain_tx: null,
        tts_audio_b64: audio,
      });
      break;
    }

    // book_restaurant — this is where we call record_action.
    const recipientStr = next.recipient_pubkey;
    const amount = next.amount_usdc ?? 0;
    if (!recipientStr || amount <= 0) {
      steps.push({
        seq,
        kind: next.kind,
        rationale: next.rationale,
        status: "reverted_other",
        on_chain_tx: null,
        error_code: "MissingPaymentFields",
      });
      finalMessage = "Agent produced a malformed payment plan.";
      break;
    }

    const recipient = (() => {
      try {
        return new PublicKey(recipientStr);
      } catch {
        return null;
      }
    })();
    if (!recipient) {
      steps.push({
        seq,
        kind: next.kind,
        rationale: next.rationale,
        status: "reverted_other",
        on_chain_tx: null,
        error_code: "InvalidRecipient",
      });
      finalMessage = "Invalid recipient pubkey from agent.";
      break;
    }

    let recordSig: string | undefined;
    try {
      recordSig = await recordAction({
        agent,
        oath: oathPk,
        actionType: "Payment",
        recipient,
        amount: usdcToMicro(amount),
      });
    } catch (err) {
      const code = scopeViolationCode(err);
      log.warn("agent.record_action.reverted", { code });
      const step: StepRecord = {
        seq,
        kind: next.kind,
        rationale: next.rationale,
        status: code ? "reverted_scope" : "reverted_other",
        on_chain_tx: null,
        error_code: code,
      };
      steps.push(step);

      const slashTx = await tryAutoSlash({
        oath: oathPk,
        user: userPk,
        vault: vaultPk,
        violationSigSource:
          (err as SendTransactionError)?.toString?.() ?? String(err),
      });
      finalMessage = code
        ? `Violation caught on-chain (${code}). Stake slashed.`
        : `Agent action failed.`;
      return {
        steps,
        final_message: finalMessage,
        slashed: !!slashTx,
        slash_tx: slashTx,
      };
    }

    const audio = await synthesize(
      `Payment of ${amount} USDC to ${recipientStr.slice(0, 4)}… recorded on-chain.`,
    );
    steps.push({
      seq,
      kind: next.kind,
      rationale: next.rationale,
      status: "success",
      on_chain_tx: recordSig,
      tts_audio_b64: audio,
      details: { amount_usdc: amount, recipient: recipientStr },
    });
    ctx.history.push({ kind: next.kind, rationale: next.rationale, result: { sig: recordSig } });
    finalMessage = `Booked for $${amount}.`;
    break;
  }

  return { steps, final_message: finalMessage || "Completed.", slashed: false };
}

async function tryAutoSlash(params: {
  oath: PublicKey;
  user: PublicKey;
  vault: PublicKey;
  violationSigSource: string;
}): Promise<string | undefined> {
  try {
    const slasher = getAgentKeypair();
    const oraclePriv = loadOracleSecret();
    const violationSig = makeViolationProof(params.violationSigSource);
    const sig = await slashOath({
      slasher,
      oath: params.oath,
      user: params.user,
      vault: params.vault,
      violationSig,
      oraclePrivateKey: oraclePriv,
    });
    log.info("agent.auto_slash.ok", { sig });
    return sig;
  } catch (err) {
    log.error("agent.auto_slash.failed", { err: String(err) });
    return undefined;
  }
}
