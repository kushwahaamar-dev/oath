import { PublicKey } from "@solana/web3.js";

import { getDb } from "@/lib/mongo/client";
import { collections, type OathDoc } from "@/lib/mongo/collections";
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
  mocked: boolean;
  recent_oaths: Array<{
    oath_pda: string;
    purpose: string;
    status: OathDoc["status"];
    created_at: string;
    stake_lamports: string;
  }>;
}

export async function loadAgentProfile(pubkey: string): Promise<AgentProfile> {
  // Validate the pubkey early.
  new PublicKey(pubkey);

  const db = await getDb();
  if (!db) {
    return {
      pubkey,
      name: `Agent ${shortPubkey(pubkey, 4)}`,
      operator: "Unaffiliated",
      oath_count: 0,
      successful_fulfillments: 0,
      slashes: 0,
      avg_stake_sol: 0,
      reputation_score: 0,
      mocked: true,
      recent_oaths: [],
    };
  }

  const { agents, oaths } = collections(db);
  const [profile, agentOaths] = await Promise.all([
    agents.findOne({ pubkey }),
    oaths
      .find({ agent_pubkey: pubkey })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray(),
  ]);

  const fulfilled = agentOaths.filter((o) => o.status === "Fulfilled").length;
  const slashes = agentOaths.filter((o) => o.status === "Slashed").length;
  const total = agentOaths.length;
  const avgStake =
    total === 0
      ? 0
      : agentOaths.reduce((acc, o) => acc + Number(BigInt(o.stake_lamports)), 0) /
        total /
        1e9;

  // Bayesian-flavoured reputation: (fulfilled + α) / (total + α + β).
  const alpha = 2;
  const beta = 1;
  const reputation = (fulfilled + alpha) / (total + alpha + beta);

  const profileAvgStake = profile
    ? Number(BigInt(profile.total_stake_lamports)) /
      Math.max(profile.oath_count, 1) /
      1e9
    : null;

  return {
    pubkey,
    name: profile?.name ?? `Agent ${shortPubkey(pubkey, 4)}`,
    operator: profile?.operator ?? "Unaffiliated",
    oath_count: profile?.oath_count ?? total,
    successful_fulfillments: profile?.fulfilled_count ?? fulfilled,
    slashes: profile?.slashed_count ?? slashes,
    avg_stake_sol: profileAvgStake ?? avgStake,
    reputation_score: profile?.reputation_score ?? reputation,
    mocked: false,
    recent_oaths: agentOaths.map((o) => ({
      oath_pda: o.oath_pda,
      purpose: o.purpose,
      status: o.status,
      created_at:
        o.created_at instanceof Date ? o.created_at.toISOString() : String(o.created_at),
      stake_lamports: o.stake_lamports,
    })),
  };
}
