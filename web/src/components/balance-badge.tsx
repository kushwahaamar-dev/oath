"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Droplet } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { env } from "@/lib/config";

const FAUCET_URL = `https://faucet.solana.com/?cluster=${env.NEXT_PUBLIC_SOLANA_CLUSTER}`;

export function BalanceBadge(): JSX.Element | null {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = React.useState<number | null>(null);
  const [requesting, setRequesting] = React.useState(false);

  React.useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(null);
      return;
    }
    let alive = true;
    const fetchBalance = async (): Promise<void> => {
      try {
        const lamports = await connection.getBalance(publicKey, "confirmed");
        if (alive) setBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        if (alive) setBalance(null);
      }
    };
    fetchBalance();
    const id = setInterval(fetchBalance, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [connected, publicKey, connection]);

  if (!connected || !publicKey || balance === null) return null;

  const low = balance < 0.05;
  if (!low) return null;

  async function airdrop(): Promise<void> {
    if (!publicKey) return;
    setRequesting(true);
    try {
      const sig = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      toast.success("Airdropped 1 SOL");
    } catch (err) {
      toast.error("Public faucet is rate-limited", {
        description: (err as Error).message.slice(0, 140),
        action: {
          label: "Open web faucet",
          onClick: () => window.open(FAUCET_URL, "_blank"),
        },
      });
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[hsl(var(--oath-warn)/0.35)] bg-[hsl(var(--oath-warn)/0.08)] p-4 text-sm">
      <div className="flex items-center gap-2 text-[hsl(var(--oath-warn))]">
        <Droplet className="h-4 w-4" />
        <div>
          <div className="font-medium">Low devnet balance</div>
          <div className="text-xs text-muted-foreground">
            {balance.toFixed(3)} SOL — you may need ≥ 0.5 SOL to stake an oath.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={airdrop}
          disabled={requesting}
          className="rounded-full border border-border bg-card/60 px-4 py-2 text-xs transition hover:text-foreground disabled:opacity-50"
        >
          {requesting ? "Requesting…" : "Airdrop 1 SOL"}
        </button>
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border bg-card/30 px-4 py-2 text-xs text-muted-foreground transition hover:text-foreground"
        >
          Web faucet
        </a>
      </div>
    </div>
  );
}
