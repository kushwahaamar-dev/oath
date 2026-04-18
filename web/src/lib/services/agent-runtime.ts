import { Keypair, PublicKey, SendTransactionError } from "@solana/web3.js";

import { features } from "@/lib/config";
import { makeViolationProof, loadOracleSecret } from "@/lib/external/oracle";
import { searchPlaces, type PlaceCandidate } from "@/lib/external/places";
import { planNextAction, type AgentContext } from "@/lib/gemini/plan-next-action";
import { log } from "@/lib/logger";
import { collections, type ActionDoc, type ViolationDoc } from "@/lib/mongo/collections";
import { getDb } from "@/lib/mongo/client";
import { loadKeypair } from "@/lib/solana/client";
import { recordAction, slashOath } from "@/lib/solana/oath";
import { synthesize } from "@/lib/tts/eleven-labs";
import type { ActionType, OathView } from "@/lib/types";
import { microToUsdc, usdcToMicro } from "@/lib/utils";
import { env } from "@/lib/config";
import { syncOathFromChain } from "./oath-service";

export interface ExecuteParams {
  oath: OathView;
  userRequest: string;
  injectedInstruction?: string;
  maxSteps?: number;
}

export interface StepRecord {
  seq: number;
  kind: string;
  rationale: string;
  status: ActionDoc["status"];
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
 * Stateless execution loop. Each step:
 *   1. Gemini decides the next action
 *   2. If it needs a payment, we call `record_action` — which reverts on scope violation
 *   3. On revert we attempt to slash (demo: triggers the money-flow clip)
 *   4. On success we call the downstream tool and log it
 */
export async function executeOath(params: ExecuteParams): Promise<ExecuteResult> {
  const { oath, injectedInstruction } = params;
  const maxSteps = params.maxSteps ?? 4;
  const agent = getAgentKeypair();
  const oathPk = new PublicKey(oath.oath_pda);
  const userPk = new PublicKey(oath.user_pubkey);
  const vaultPk = new PublicKey(oath.stake_vault);
  const allowedRecipients = oath.allowed_recipients;

  const ctx: AgentContext = {
    oath: {
      purpose: oath.purpose,
      spend_cap_usdc: Number(microToUsdc(BigInt(oath.spend_cap))),
      per_tx_cap_usdc: Number(microToUsdc(BigInt(oath.per_tx_cap))),
      spent_usdc: Number(microToUsdc(BigInt(oath.spent))),
      allowed_action_types: oath.allowed_action_types,
      allowed_recipients: allowedRecipients,
    },
    history: [],
    injected_instruction: injectedInstruction,
  };
  let searchResults: PlaceCandidate[] | undefined;
  const steps: StepRecord[] = [];
  let finalMessage = "";

  for (let seq = 0; seq < maxSteps; seq++) {
    ctx.search_results = searchResults?.map((r) => ({
      name: r.name,
      address: r.address,
      price_estimate_usdc: r.price_estimate_usdc,
      recipient_pubkey: r.recipient_pubkey,
    }));
    const next = await planNextAction(ctx);
    log.info("agent.step", { seq, kind: next.kind });

    if (next.kind === "search_places") {
      const results = await searchPlaces(next.search_query ?? oath.purpose);
      searchResults = results;
      const audio = await synthesize(
        `Scanning restaurants for "${next.search_query ?? oath.purpose}". Found ${results.length} candidates.`,
      );
      const step: StepRecord = {
        seq,
        kind: next.kind,
        rationale: next.rationale,
        status: "success",
        on_chain_tx: null,
        tts_audio_b64: audio,
        details: { candidates: results },
      };
      steps.push(step);
      ctx.history.push({ kind: next.kind, rationale: next.rationale, result: { n: results.length } });
      await persistAction(step, oath.oath_pda, oath.allowed_action_types[0] ?? "ApiCall");
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
      await persistViolation({
        oathPda: oath.oath_pda,
        injected: injectedInstruction,
        attempt: { amount, recipient: recipientStr, action: "Payment" },
        code,
      });

      // Slash flow: oracle-attested proof that we caught a violation.
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
      `Payment of ${amount} USDC to ${recipientStr.slice(0, 4)}… recorded on-chain. Confirmation pending.`,
    );
    const step: StepRecord = {
      seq,
      kind: next.kind,
      rationale: next.rationale,
      status: "success",
      on_chain_tx: recordSig,
      tts_audio_b64: audio,
      details: { amount_usdc: amount, recipient: recipientStr },
    };
    steps.push(step);
    ctx.history.push({ kind: next.kind, rationale: next.rationale, result: { sig: recordSig } });
    await persistAction(step, oath.oath_pda, "Payment");
    finalMessage = `Booked for $${amount}.`;
    break;
  }

  await syncOathFromChain(oathPk);
  return { steps, final_message: finalMessage || "Completed.", slashed: false };
}

async function persistAction(step: StepRecord, oathPda: string, actionType: ActionType): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { actions } = collections(db);
  await actions
    .insertOne({
      oath_pda: oathPda,
      seq: step.seq,
      action_type: actionType,
      tool_name: step.kind,
      inputs: step.details ?? {},
      outputs: step.details ?? {},
      on_chain_tx: step.on_chain_tx,
      usdc_micro: step.details?.amount_usdc
        ? usdcToMicro(step.details.amount_usdc as number).toString()
        : "0",
      recipient: (step.details?.recipient as string | undefined) ?? null,
      gemini_reasoning: step.rationale,
      tts_audio_b64: step.tts_audio_b64 ?? null,
      status: step.status,
      error_code: step.error_code,
      timestamp: new Date(),
    })
    .catch((err) => log.error("action.persist.failed", { err: String(err) }));
}

async function persistViolation(params: {
  oathPda: string;
  injected?: string;
  attempt: Record<string, unknown>;
  code?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { violations } = collections(db);
  const doc: ViolationDoc = {
    oath_pda: params.oathPda,
    attempted_action: params.attempt,
    scope_check_result: params.code ?? "unknown",
    prompt_that_caused: params.injected ?? "",
    agent_response: null,
    on_chain_revert_tx: null,
    slash_tx: null,
    timestamp: new Date(),
  };
  await violations
    .insertOne(doc)
    .catch((err) => log.error("violation.persist.failed", { err: String(err) }));
}

async function tryAutoSlash(params: {
  oath: PublicKey;
  user: PublicKey;
  vault: PublicKey;
  violationSigSource: string;
}): Promise<string | undefined> {
  try {
    const slasher = getAgentKeypair(); // any signer works; the oracle proof is what matters
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

// `features` referenced so eslint won't complain if we add branches later.
void features;
