import { env } from "@/lib/config";

const cluster = env.NEXT_PUBLIC_SOLANA_CLUSTER;

export function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=${cluster}`;
}

export function explorerAddress(addr: string): string {
  return `https://explorer.solana.com/address/${addr}?cluster=${cluster}`;
}
