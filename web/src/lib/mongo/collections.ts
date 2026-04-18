import { type Collection, type Db, type ObjectId } from "mongodb";

import type { ActionType, OathStatus } from "@/lib/types";

export interface OathDoc {
  _id?: ObjectId;
  oath_pda: string;
  user_pubkey: string;
  agent_pubkey: string;
  oath_id: string;
  purpose: string;
  oath_proposal_raw: unknown;
  spend_cap_micro: string;
  per_tx_cap_micro: string;
  stake_lamports: string;
  allowed_action_types: ActionType[];
  allowed_recipients: string[];
  allowed_domains: string[];
  status: OathStatus;
  created_tx: string;
  expiry: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ActionDoc {
  _id?: ObjectId;
  oath_pda: string;
  seq: number;
  action_type: ActionType;
  tool_name: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  on_chain_tx: string | null;
  usdc_micro: string;
  recipient: string | null;
  gemini_reasoning: string | null;
  tts_audio_b64: string | null;
  status: "success" | "reverted_scope" | "reverted_cap" | "reverted_other" | "pending";
  error_code?: string;
  timestamp: Date;
}

export interface ViolationDoc {
  _id?: ObjectId;
  oath_pda: string;
  attempted_action: Record<string, unknown>;
  scope_check_result: string;
  prompt_that_caused: string;
  agent_response: unknown;
  on_chain_revert_tx: string | null;
  slash_tx: string | null;
  timestamp: Date;
}

export interface AgentDoc {
  _id?: ObjectId;
  pubkey: string;
  name: string;
  oath_count: number;
  fulfilled_count: number;
  slashed_count: number;
  total_stake_lamports: string;
  reputation_score: number;
  operator: string;
  created_at: Date;
}

export interface Collections {
  oaths: Collection<OathDoc>;
  actions: Collection<ActionDoc>;
  violations: Collection<ViolationDoc>;
  agents: Collection<AgentDoc>;
}

export function collections(db: Db): Collections {
  return {
    oaths: db.collection<OathDoc>("oaths"),
    actions: db.collection<ActionDoc>("actions"),
    violations: db.collection<ViolationDoc>("violations"),
    agents: db.collection<AgentDoc>("agents"),
  };
}
