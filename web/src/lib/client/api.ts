import type { OathProposal } from "@/lib/types";

export interface PlanResponse {
  proposal: OathProposal;
  resolved_recipients: string[];
  agent_pubkey: string;
  oath_pda: string;
  stake_vault: string;
  oath_id: string;
  expiry_unix: number;
  voice_audio_b64: string | null;
}

export interface SignTxResponse {
  oath_pda: string;
  stake_vault: string;
  expiry_unix: number;
  partial_signed_tx_b64: string;
  blockhash: string;
  last_valid_block_height: number;
}

export interface ExecuteStep {
  seq: number;
  kind: string;
  rationale: string;
  status: "success" | "reverted_scope" | "reverted_cap" | "reverted_other" | "pending";
  on_chain_tx: string | null;
  error_code?: string;
  tts_audio_b64?: string | null;
  details?: Record<string, unknown>;
}

export interface ExecuteResponse {
  steps: ExecuteStep[];
  final_message: string;
  slashed: boolean;
  slash_tx?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${txt}`);
  }
  return (await res.json()) as T;
}

export function apiPlan(body: {
  request: string;
  user_pubkey: string;
  agent_pubkey?: string;
  oath_id?: string;
}): Promise<PlanResponse> {
  return postJson<PlanResponse>("/api/agent/plan", body);
}

export function apiSignTx(body: {
  proposal: OathProposal;
  user_pubkey: string;
  agent_pubkey?: string;
  oath_id: string;
}): Promise<SignTxResponse> {
  return postJson<SignTxResponse>("/api/agent/sign-tx", body);
}

export function apiExecute(body: {
  oath_pda: string;
  user_request: string;
  injected_instruction?: string;
}): Promise<ExecuteResponse> {
  return postJson<ExecuteResponse>("/api/agent/execute", body);
}
