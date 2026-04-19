"use client";

import { motion } from "framer-motion";

import { explorerTx } from "@/components/action-timeline";
import { Badge } from "@/components/ui/badge";
import type { PlanResponse } from "@/lib/client/api";
import { shortPubkey } from "@/lib/utils";

export function CompactProposal({
  plan,
  createTxSig,
}: {
  plan: PlanResponse;
  createTxSig?: string;
}): JSX.Element {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/40 p-4"
    >
      <Badge variant="success">signed</Badge>
      <div className="min-w-0 flex-1 truncate text-sm">{plan.proposal.purpose}</div>
      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span>cap</span>
        <span>${plan.proposal.spend_cap_usdc}</span>
        <span>&middot;</span>
        <span>stake</span>
        <span>{plan.proposal.stake_amount_sol} SOL</span>
        {createTxSig ? (
          <>
            <span>&middot;</span>
            <a
              href={explorerTx(createTxSig)}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              tx {shortPubkey(createTxSig, 4)}
            </a>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
