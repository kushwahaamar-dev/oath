import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** SOL ↔ lamports (we never do arithmetic in floats). */
export const LAMPORTS_PER_SOL = 1_000_000_000n;
export const USDC_MICRO = 1_000_000n;

export function solToLamports(sol: number): bigint {
  return BigInt(Math.round(sol * 1e9));
}

export function lamportsToSol(lamports: bigint | number | string): number {
  const n = typeof lamports === "bigint" ? lamports : BigInt(lamports);
  return Number(n) / 1e9;
}

export function usdcToMicro(usdc: number): bigint {
  return BigInt(Math.round(usdc * 1e6));
}

export function microToUsdc(micro: bigint | number | string): number {
  const n = typeof micro === "bigint" ? micro : BigInt(micro);
  return Number(n) / 1e6;
}

/** Stable short-pubkey, e.g. `7xQr…K4m`. */
export function shortPubkey(pk: string, chars = 4): string {
  if (pk.length <= chars * 2 + 1) return pk;
  return `${pk.slice(0, chars)}…${pk.slice(-chars)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}

/**
 * Run `fn`, retrying on transient failures with exponential backoff.
 * Bails out immediately on `HttpError` with a 4xx status.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; base?: number } = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.base ?? 250;
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (isHttpError(err) && err.status >= 400 && err.status < 500) throw err;
      if (i === retries) break;
      await sleep(base * 2 ** i);
    }
  }
  throw lastErr;
}
