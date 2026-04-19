import { z } from "zod";

/**
 * Action types mirror the on-chain Rust enum. We keep the discriminants
 * identical so round-tripping through MongoDB + the frontend is lossless.
 */
export const ActionTypeSchema = z.enum([
  "Payment",
  "DataRead",
  "ApiCall",
  "TokenTransfer",
  "Signature",
  "MultimodalInput",
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const OathStatusSchema = z.enum([
  "Active",
  "Expired",
  "Revoked",
  "Slashed",
  "Fulfilled",
]);
export type OathStatus = z.infer<typeof OathStatusSchema>;

/**
 * Gemini's structured output for a proposed oath. Purposefully narrow:
 * all units are human-friendly (USDC whole units, hours), we convert to
 * chain units in the service layer.
 */
export const OathProposalSchema = z.object({
  purpose: z.string().min(5).max(500),
  spend_cap_usdc: z.number().positive().max(10_000),
  per_tx_cap_usdc: z.number().positive().max(10_000),
  expiry_hours: z.number().min(0.5).max(72),
  allowed_action_types: z.array(ActionTypeSchema).min(1).max(6),
  allowed_recipient_hints: z
    .array(z.string().min(1).max(128))
    .min(1)
    .max(16)
    .describe(
      "Plain-English names of recipients the agent may pay. Resolved to pubkeys server-side.",
    ),
  allowed_domains: z
    .array(z.string())
    .max(32)
    .describe("Bare domains (no scheme), e.g. 'places.googleapis.com'."),
  stake_amount_sol: z.number().min(0.01).max(10),
  reasoning: z.string().min(10).max(1000),
  voice_summary: z
    .string()
    .min(10)
    .max(600)
    .describe("A one-paragraph reading for the user, in first person."),
});
export type OathProposal = z.infer<typeof OathProposalSchema>;

/** Agent tool-calling plan, one step at a time. */
export const NextActionSchema = z.object({
  kind: z.enum(["search_places", "book_restaurant", "complete", "abort"]),
  rationale: z.string().min(3).max(600),
  search_query: z.string().optional(),
  choice_index: z.number().int().min(0).optional(),
  amount_usdc: z.number().min(0).optional(),
  recipient_pubkey: z.string().optional(),
  final_message: z.string().optional(),
});
export type NextAction = z.infer<typeof NextActionSchema>;

/** API response shape for /api/oath/[id]. */
export const OathViewSchema = z.object({
  oath_pda: z.string(),
  user_pubkey: z.string(),
  agent_pubkey: z.string(),
  oath_id: z.string(),
  purpose: z.string(),
  spend_cap: z.string(),
  spent: z.string(),
  per_tx_cap: z.string(),
  stake_amount: z.string(),
  stake_vault: z.string(),
  allowed_action_types: z.array(ActionTypeSchema),
  allowed_recipients: z.array(z.string()),
  expiry: z.number(),
  created_at: z.number(),
  status: OathStatusSchema,
  action_count: z.number(),
});
export type OathView = z.infer<typeof OathViewSchema>;
