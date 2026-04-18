"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Ban, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { shortPubkey } from "@/lib/utils";

/**
 * User-only revoke button. Fetches an unsigned transaction from the
 * server, user signs with Phantom, client submits to RPC. Refreshes
 * the oath page after confirmation.
 */
export function RevokeButton({
  oathPda,
  userPubkey,
}: {
  oathPda: string;
  userPubkey: string;
}): JSX.Element {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const isOwner =
    connected && publicKey && publicKey.toBase58() === userPubkey;

  async function revoke(): Promise<void> {
    if (!publicKey || !signTransaction) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/oath/${oathPda}/revoke`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `revoke prepare ${res.status}`);
      }
      const { unsigned_tx_b64, blockhash, last_valid_block_height } = (await res.json()) as {
        unsigned_tx_b64: string;
        blockhash: string;
        last_valid_block_height: number;
      };

      const tx = Transaction.from(Buffer.from(unsigned_tx_b64, "base64"));
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        preflightCommitment: "confirmed",
      });
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight: last_valid_block_height },
        "confirmed",
      );
      toast.success("Oath revoked", {
        description: `tx ${shortPubkey(sig, 6)}`,
      });
      router.refresh();
    } catch (err) {
      toast.error("Revoke failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={revoke}
      disabled={!isOwner || loading}
      title={isOwner ? "Revoke this oath" : "Connect the user wallet to revoke"}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Ban className="mr-2 h-4 w-4" />
      )}
      {loading ? "Revoking…" : "Revoke oath"}
    </Button>
  );
}
