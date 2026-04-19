import { z } from "zod";

/**
 * All env vars are parsed exactly once, at module load, and validated
 * with zod. `optional()` means "missing is OK" — the consuming module
 * is expected to degrade to mock behaviour and log it.
 *
 * Placeholder tolerance: any value that starts with `REPLACE_ME`,
 * `PLACEHOLDER`, or equals the literal `""` is treated as absent.
 */
const PLACEHOLDER_PREFIXES = ["REPLACE_ME", "PLACEHOLDER", "TODO_", "CHANGEME"];

function cleanPlaceholder(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  const t = v.trim();
  if (t === "") return undefined;
  if (PLACEHOLDER_PREFIXES.some((p) => t.toUpperCase().startsWith(p))) {
    return undefined;
  }
  return t;
}

const rawEnv = {
  NEXT_PUBLIC_SOLANA_CLUSTER: cleanPlaceholder(
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER,
  ),
  NEXT_PUBLIC_SOLANA_RPC_URL: cleanPlaceholder(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  ),
  NEXT_PUBLIC_OATH_PROGRAM_ID: cleanPlaceholder(
    process.env.NEXT_PUBLIC_OATH_PROGRAM_ID,
  ),
  ORACLE_KEYPAIR_PATH: cleanPlaceholder(process.env.ORACLE_KEYPAIR_PATH),
  AGENT_KEYPAIR_PATH: cleanPlaceholder(process.env.AGENT_KEYPAIR_PATH),
  GEMINI_API_KEY: cleanPlaceholder(process.env.GEMINI_API_KEY),
  GEMINI_MODEL: cleanPlaceholder(process.env.GEMINI_MODEL),
  ELEVENLABS_API_KEY: cleanPlaceholder(process.env.ELEVENLABS_API_KEY),
  ELEVENLABS_VOICE_ID: cleanPlaceholder(process.env.ELEVENLABS_VOICE_ID),
  X402_FACILITATOR_URL: cleanPlaceholder(process.env.X402_FACILITATOR_URL),
  NODE_ENV: cleanPlaceholder(process.env.NODE_ENV),
};

const Schema = z.object({
  NEXT_PUBLIC_SOLANA_CLUSTER: z
    .enum(["localnet", "devnet", "testnet", "mainnet-beta"])
    .default("devnet"),
  NEXT_PUBLIC_SOLANA_RPC_URL: z
    .string()
    .url()
    .default("https://api.devnet.solana.com"),
  NEXT_PUBLIC_OATH_PROGRAM_ID: z
    .string()
    .min(32)
    .default("2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy"),
  ORACLE_KEYPAIR_PATH: z.string().default("keys/oracle.json"),
  AGENT_KEYPAIR_PATH: z.string().default("keys/agent.json"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().default("JBFqnCBsd6RMkjVDRZzb"),
  X402_FACILITATOR_URL: z
    .string()
    .url()
    .default("https://x402.coinbase.com"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = Schema.safeParse(rawEnv);
if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")}`,
  );
}

export const env = parsed.data;

/** A feature is "live" when its credential is real (not a placeholder). */
export const features = {
  gemini: !!env.GEMINI_API_KEY,
  elevenLabs: !!env.ELEVENLABS_API_KEY,
} as const;

export function logFeatureStatus(): void {
  const lines = Object.entries(features).map(
    ([k, v]) => `  ${v ? "✓" : "○"} ${k} ${v ? "(live)" : "(mock)"}`,
  );
  // eslint-disable-next-line no-console
  console.info(`[oath] feature status:\n${lines.join("\n")}`);
}
