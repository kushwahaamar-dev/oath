import { PublicKey } from "@solana/web3.js";

import { fetchAllOathViews } from "@/lib/solana/oath";
import type { OathStatus, OathView } from "@/lib/types";
import { shortPubkey } from "@/lib/utils";

export interface AgentProfile {
  pubkey: string;
  name: string;
  operator: string;
  oath_count: number;
  successful_fulfillments: number;
  slashes: number;
  avg_stake_sol: number;
  reputation_score: number;
  recent_oaths: Array<{
    oath_pda: string;
    purpose: string;
    status: OathStatus;
    created_at: string;
    stake_lamports: string;
  }>;
}

/**
 * Derive an agent's reputation from on-chain oaths only.
 * Bayesian-flavoured: (fulfilled + α) / (total + α + β).
 */
export async function loadAgentProfile(pubkey: string): Promise<AgentProfile> {
  new PublicKey(pubkey);

  const allOaths = await fetchAllOathViews();
  const agentOaths: OathView[] = allOaths.filter(
    (o) => o.agent_pubkey === pubkey,
  );

  const fulfilled = agentOaths.filter((o) => o.status === "Fulfilled").length;
  const slashes = agentOaths.filter((o) => o.status === "Slashed").length;
  const total = agentOaths.length;
  const avgStakeLamports =
    total === 0
      ? 0
      : agentOaths.reduce((acc, o) => acc + Number(o.stake_amount), 0) / total;

  const alpha = 2;
  const beta = 1;
  const reputation = (fulfilled + alpha) / (total + alpha + beta);

  return {
    pubkey,
    name: `Agent ${shortPubkey(pubkey, 4)}`,
    operator: "On-chain identity",
    oath_count: total,
    successful_fulfillments: fulfilled,
    slashes,
    avg_stake_sol: avgStakeLamports / 1e9,
    reputation_score: reputation,
    recent_oaths: agentOaths.slice(0, 20).map((o) => ({
      oath_pda: o.oath_pda,
      purpose: o.purpose,
      status: o.status,
      created_at: new Date(o.created_at * 1000).toISOString(),
      stake_lamports: o.stake_amount,
    })),
  };
}
