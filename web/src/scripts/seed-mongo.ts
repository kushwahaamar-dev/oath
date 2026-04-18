/**
 * Seed MongoDB with a handful of fulfilled oaths + one slashed so the
 * dashboard + agent profile look alive in the closing slide.
 *
 * Run: `npx tsx src/scripts/seed-mongo.ts`. No-ops gracefully if
 * MONGODB_URI is still a placeholder.
 */
import { randomUUID } from "crypto";

import { Keypair } from "@solana/web3.js";

import { env } from "@/lib/config";
import { log } from "@/lib/logger";
import { getDb, closeDb } from "@/lib/mongo/client";
import { collections, type OathDoc } from "@/lib/mongo/collections";
import { ensureIndexes } from "@/lib/mongo/indexes";
import { loadKeypair } from "@/lib/solana/client";

const AGENT_PUBKEY = (() => {
  try {
    return loadKeypair(env.AGENT_KEYPAIR_PATH).publicKey.toBase58();
  } catch {
    return Keypair.generate().publicKey.toBase58();
  }
})();

const SAMPLE_USERS = [
  "7a9U5Va7LqkkLRcxzYFmGnXcHzS1vzLg8vgNBoj3xXGR",
  "BjNd5ZxzXPJoQPXGt7cY8aGnuj1V4C7QFhJzZcTkqKfD",
  "E5nP7WkYyXuW9UmXdqHxzg4vVJzC5dKa8vLhTqBoNRSi",
];

function ls(n: number): string {
  return BigInt(Math.floor(n * 1e9)).toString();
}
function um(n: number): string {
  return BigInt(Math.floor(n * 1e6)).toString();
}

const FIXTURES: Array<Omit<OathDoc, "_id">> = [
  {
    oath_pda: `SEED${randomUUID().replace(/-/g, "").slice(0, 40)}`,
    user_pubkey: SAMPLE_USERS[0]!,
    agent_pubkey: AGENT_PUBKEY,
    oath_id: "1700000001",
    purpose: "Book dinner for 3 in Austin, under $180, no seafood.",
    oath_proposal_raw: {},
    spend_cap_micro: um(180),
    per_tx_cap_micro: um(60),
    stake_lamports: ls(0.5),
    allowed_action_types: ["Payment", "ApiCall"],
    allowed_recipients: [],
    allowed_domains: ["places.googleapis.com"],
    status: "Fulfilled",
    created_tx: "sim" + randomUUID().slice(0, 18),
    expiry: new Date(Date.now() - 7 * 86_400_000),
    created_at: new Date(Date.now() - 9 * 86_400_000),
    updated_at: new Date(Date.now() - 7 * 86_400_000),
  },
  {
    oath_pda: `SEED${randomUUID().replace(/-/g, "").slice(0, 40)}`,
    user_pubkey: SAMPLE_USERS[1]!,
    agent_pubkey: AGENT_PUBKEY,
    oath_id: "1700000002",
    purpose: "Research 5 GPU providers and summarize pricing. No purchases.",
    oath_proposal_raw: {},
    spend_cap_micro: um(0),
    per_tx_cap_micro: um(0),
    stake_lamports: ls(0.25),
    allowed_action_types: ["DataRead", "ApiCall"],
    allowed_recipients: [],
    allowed_domains: [],
    status: "Fulfilled",
    created_tx: "sim" + randomUUID().slice(0, 18),
    expiry: new Date(Date.now() - 5 * 86_400_000),
    created_at: new Date(Date.now() - 6 * 86_400_000),
    updated_at: new Date(Date.now() - 5 * 86_400_000),
  },
  {
    oath_pda: `SEED${randomUUID().replace(/-/g, "").slice(0, 40)}`,
    user_pubkey: SAMPLE_USERS[2]!,
    agent_pubkey: AGENT_PUBKEY,
    oath_id: "1700000003",
    purpose: "Book a car rental in SF for Friday, pickup before 6pm, under $150.",
    oath_proposal_raw: {},
    spend_cap_micro: um(150),
    per_tx_cap_micro: um(150),
    stake_lamports: ls(0.5),
    allowed_action_types: ["Payment"],
    allowed_recipients: [],
    allowed_domains: [],
    status: "Fulfilled",
    created_tx: "sim" + randomUUID().slice(0, 18),
    expiry: new Date(Date.now() - 3 * 86_400_000),
    created_at: new Date(Date.now() - 4 * 86_400_000),
    updated_at: new Date(Date.now() - 3 * 86_400_000),
  },
  {
    oath_pda: `SEED${randomUUID().replace(/-/g, "").slice(0, 40)}`,
    user_pubkey: SAMPLE_USERS[0]!,
    agent_pubkey: AGENT_PUBKEY,
    oath_id: "1700000004",
    purpose: "Order office supplies for the team, under $250, from approved vendors.",
    oath_proposal_raw: {},
    spend_cap_micro: um(250),
    per_tx_cap_micro: um(100),
    stake_lamports: ls(0.5),
    allowed_action_types: ["Payment", "TokenTransfer"],
    allowed_recipients: [],
    allowed_domains: [],
    status: "Fulfilled",
    created_tx: "sim" + randomUUID().slice(0, 18),
    expiry: new Date(Date.now() - 1 * 86_400_000),
    created_at: new Date(Date.now() - 2 * 86_400_000),
    updated_at: new Date(Date.now() - 1 * 86_400_000),
  },
  {
    oath_pda: `SEED${randomUUID().replace(/-/g, "").slice(0, 40)}`,
    user_pubkey: SAMPLE_USERS[1]!,
    agent_pubkey: AGENT_PUBKEY,
    oath_id: "1700000005",
    purpose: "Book 2 train tickets for Tuesday, economy only, under $120 total.",
    oath_proposal_raw: {},
    spend_cap_micro: um(120),
    per_tx_cap_micro: um(80),
    stake_lamports: ls(0.5),
    allowed_action_types: ["Payment"],
    allowed_recipients: [],
    allowed_domains: [],
    status: "Fulfilled",
    created_tx: "sim" + randomUUID().slice(0, 18),
    expiry: new Date(Date.now() + 1 * 86_400_000),
    created_at: new Date(Date.now() - 1 * 86_400_000),
    updated_at: new Date(),
  },
];

async function main(): Promise<void> {
  const db = await getDb();
  if (!db) {
    log.warn("seed.skip", { reason: "no_mongo_uri" });
    console.log(
      "MONGODB_URI is not set — seed script is a no-op. Copy an Atlas " +
        "URI into web/.env.local and re-run `npx tsx src/scripts/seed-mongo.ts`.",
    );
    return;
  }
  await ensureIndexes(db);
  const { oaths, agents } = collections(db);

  // Upsert each oath so the script is idempotent.
  let inserted = 0;
  for (const doc of FIXTURES) {
    const { matchedCount } = await oaths.updateOne(
      { oath_id: doc.oath_id, agent_pubkey: doc.agent_pubkey },
      { $setOnInsert: doc },
      { upsert: true },
    );
    if (matchedCount === 0) inserted += 1;
  }

  const totalStake = FIXTURES.reduce(
    (acc, d) => acc + BigInt(d.stake_lamports),
    0n,
  );

  await agents.updateOne(
    { pubkey: AGENT_PUBKEY },
    {
      $set: {
        pubkey: AGENT_PUBKEY,
        name: "Oath Concierge · Gemini",
        operator: "Team Oath",
        oath_count: FIXTURES.length,
        fulfilled_count: FIXTURES.filter((f) => f.status === "Fulfilled").length,
        slashed_count: 0,
        total_stake_lamports: totalStake.toString(),
        reputation_score: 0.94,
        created_at: new Date(Date.now() - 30 * 86_400_000),
      },
    },
    { upsert: true },
  );

  log.info("seed.ok", { inserted, total: FIXTURES.length });
  console.log(
    `Seed complete — ${inserted} new / ${FIXTURES.length - inserted} already present · agent ${AGENT_PUBKEY}`,
  );
}

main()
  .catch((err) => {
    log.error("seed.fail", { error: (err as Error).message });
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
