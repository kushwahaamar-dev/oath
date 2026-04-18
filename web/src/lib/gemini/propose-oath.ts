import { env, features } from "@/lib/config";
import { log } from "@/lib/logger";
import { OathProposalSchema, type OathProposal } from "@/lib/types";
import { STRUCTURED_CONFIG, getGemini } from "./client";
import { OathProposalJsonSchema } from "./schemas";

const SYSTEM_PROMPT = `You are Oath, a pre-commitment planner for AI agents.

You receive a user's informal request and emit a structured OathProposal \
that an autonomous agent will be bound by on-chain. Your job is to produce \
the TIGHTEST scope that still lets the agent complete the task.

Rules:
- Spend caps must match the task (a $200 dinner is not a $5,000 authorization).
- \`per_tx_cap_usdc\` must be <= \`spend_cap_usdc\`.
- Expiry must be the shortest reasonable window.
- Prefer fewer \`allowed_action_types\` over more. Include \`ApiCall\` only when a read tool is needed.
- \`allowed_recipient_hints\` must be concrete entity names, never wildcards.
- \`stake_amount_sol\` should be roughly 1/4 of the spend cap in SOL terms, capped at 2 SOL for the hackathon.
- \`voice_summary\` is first-person agent speech suitable for TTS playback.

Output JSON only; no prose. Obey the schema exactly.`;

const FALLBACK_PROPOSAL = (request: string): OathProposal => ({
  purpose: `Complete: ${request.slice(0, 200)}`,
  spend_cap_usdc: 200,
  per_tx_cap_usdc: 60,
  expiry_hours: 6,
  allowed_action_types: ["Payment", "ApiCall"],
  allowed_recipient_hints: ["restaurant"],
  allowed_domains: ["places.googleapis.com"],
  stake_amount_sol: 0.5,
  reasoning:
    "Mock proposal (Gemini credential not configured). Conservative caps, short expiry.",
  voice_summary:
    "I commit to completing this task within a tight budget, limited to a single type of payment recipient, expiring in six hours. I stake half a SOL as accountability.",
});

export async function proposeOath(userRequest: string): Promise<OathProposal> {
  const client = getGemini();
  if (!client) {
    log.warn("gemini.propose_oath.mock", { reason: "no_api_key" });
    return FALLBACK_PROPOSAL(userRequest);
  }
  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      ...STRUCTURED_CONFIG,
      // `responseSchema` is how we get strict JSON out of Gemini.
      responseSchema: OathProposalJsonSchema as never,
    },
  });
  const started = Date.now();
  const result = await model.generateContent([
    {
      text: `USER REQUEST:\n"""\n${userRequest}\n"""\n\nReturn the OathProposal JSON.`,
    },
  ]);
  const text = result.response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    log.error("gemini.propose_oath.parse_error", { text: text.slice(0, 500) });
    throw new Error(`Gemini returned invalid JSON: ${(err as Error).message}`);
  }
  const safe = OathProposalSchema.parse(parsed);
  log.info("gemini.propose_oath.ok", {
    ms: Date.now() - started,
    spend_cap: safe.spend_cap_usdc,
  });
  // Invariant: per-tx cap never exceeds spend cap. Gemini usually respects
  // this but we harden to refuse borderline proposals.
  if (safe.per_tx_cap_usdc > safe.spend_cap_usdc) {
    safe.per_tx_cap_usdc = safe.spend_cap_usdc;
  }
  return safe;
}

export const _internal = { FALLBACK_PROPOSAL };
