"use client";

import { useWallet } from "@solana/wallet-adapter-react";

import { explorerAddress } from "@/components/action-timeline";
import { Badge } from "@/components/ui/badge";
import { shortPubkey } from "@/lib/utils";

export function WalletStatus(): JSX.Element {
  const { publicKey, connected } = useWallet();

  if (!connected || !publicKey) {
    return (
      <Badge variant="warn" className="gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--oath-warn))]" />
        wallet not connected
      </Badge>
    );
  }

  return (
    <a
      href={explorerAddress(publicKey.toBase58())}
      target="_blank"
      rel="noreferrer"
      className="inline-flex transition hover:opacity-90"
    >
      <Badge variant="success" className="gap-2 font-mono">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--oath-ok))]" />
        {shortPubkey(publicKey.toBase58(), 4)}
      </Badge>
    </a>
  );
}
