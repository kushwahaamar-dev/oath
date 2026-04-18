import { MongoClient, type Db } from "mongodb";

import { env, features } from "@/lib/config";
import { log } from "@/lib/logger";

let cached: { client: MongoClient; db: Db } | undefined;

/**
 * Returns a live Mongo `Db` if `MONGODB_URI` is configured. When not,
 * returns `null` and callers fall back to in-memory mocks. This is
 * intentional: the demo should run end-to-end with zero credentials.
 */
export async function getDb(): Promise<Db | null> {
  if (!features.mongo) return null;
  if (cached) return cached.db;
  const client = new MongoClient(env.MONGODB_URI!, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5_000,
  });
  await client.connect();
  const db = client.db(env.MONGODB_DB);
  cached = { client, db };
  log.info("mongo.connected", { db: env.MONGODB_DB });
  return db;
}

export async function closeDb(): Promise<void> {
  if (cached) {
    await cached.client.close();
    cached = undefined;
  }
}
