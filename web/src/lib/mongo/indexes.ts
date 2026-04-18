import { type Db } from "mongodb";

import { log } from "@/lib/logger";
import { collections } from "./collections";

/** Idempotent — safe to call on every cold start. */
export async function ensureIndexes(db: Db): Promise<void> {
  const { oaths, actions, violations, agents } = collections(db);
  await Promise.all([
    oaths.createIndex({ oath_pda: 1 }, { unique: true, name: "oath_pda_unique" }),
    oaths.createIndex({ user_pubkey: 1, created_at: -1 }, { name: "user_feed" }),
    oaths.createIndex({ agent_pubkey: 1, created_at: -1 }, { name: "agent_feed" }),
    oaths.createIndex({ status: 1, expiry: 1 }, { name: "active_expiring" }),
    actions.createIndex({ oath_pda: 1, seq: 1 }, { unique: true, name: "action_seq" }),
    actions.createIndex({ timestamp: -1 }, { name: "actions_time" }),
    violations.createIndex({ oath_pda: 1, timestamp: -1 }, { name: "violations_time" }),
    agents.createIndex({ pubkey: 1 }, { unique: true, name: "agent_pubkey_unique" }),
  ]);
  log.info("mongo.indexes.ensured");
}
