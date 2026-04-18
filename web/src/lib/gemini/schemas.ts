/**
 * JSON schemas in the shape Gemini's `responseSchema` expects
 * (OpenAPI 3 subset). We keep them parallel to the zod schemas in
 * `lib/types.ts`; the zod schemas are the source of truth at runtime.
 */

export const OathProposalJsonSchema = {
  type: "object",
  properties: {
    purpose: { type: "string", description: "Plain-English description of what the agent is authorized to do." },
    spend_cap_usdc: { type: "number", description: "Total USDC budget (whole units)." },
    per_tx_cap_usdc: { type: "number", description: "Maximum single payment (whole units)." },
    expiry_hours: { type: "number", description: "How long the oath is valid, in hours. Minimum 0.5, max 72." },
    allowed_action_types: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "Payment",
          "DataRead",
          "ApiCall",
          "TokenTransfer",
          "Signature",
          "MultimodalInput",
        ],
      },
    },
    allowed_recipient_hints: {
      type: "array",
      items: { type: "string" },
      description: "Plain-English names of parties that may receive funds (e.g. 'Uchi restaurant'). Server resolves to pubkeys.",
    },
    allowed_domains: {
      type: "array",
      items: { type: "string" },
      description: "Bare domains the agent may call, e.g. 'places.googleapis.com'.",
    },
    stake_amount_sol: {
      type: "number",
      description: "SOL the agent stakes as accountability collateral. 0.1 is typical; higher for riskier tasks.",
    },
    reasoning: {
      type: "string",
      description: "Why these caps are appropriate for the task. Shown to the user.",
    },
    voice_summary: {
      type: "string",
      description: "One-paragraph first-person reading, spoken aloud to the user before they sign.",
    },
  },
  required: [
    "purpose",
    "spend_cap_usdc",
    "per_tx_cap_usdc",
    "expiry_hours",
    "allowed_action_types",
    "allowed_recipient_hints",
    "allowed_domains",
    "stake_amount_sol",
    "reasoning",
    "voice_summary",
  ],
} as const;

export const NextActionJsonSchema = {
  type: "object",
  properties: {
    kind: {
      type: "string",
      enum: ["search_places", "book_restaurant", "complete", "abort"],
    },
    rationale: { type: "string" },
    search_query: { type: "string" },
    choice_index: { type: "integer" },
    amount_usdc: { type: "number" },
    recipient_pubkey: { type: "string" },
    final_message: { type: "string" },
  },
  required: ["kind", "rationale"],
} as const;
