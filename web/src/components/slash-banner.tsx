"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ExternalLink } from "lucide-react";

import { explorerTx } from "@/components/action-timeline";
import { shortPubkey } from "@/lib/utils";

export function SlashBanner({
  visible,
  errorCode,
  slashTx,
}: {
  visible: boolean;
  errorCode?: string;
  slashTx?: string;
}): JSX.Element {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ type: "spring", damping: 18, stiffness: 260 }}
          className="relative overflow-hidden rounded-2xl border border-[hsl(var(--oath-slash)/0.55)] bg-[hsl(var(--oath-slash)/0.08)] p-5 shadow-[0_0_60px_-10px_hsl(var(--oath-slash)/0.55)]"
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--oath-slash)/0.25),_transparent_60%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6] }}
            transition={{ duration: 1.2 }}
          />
          <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -8, 8, -4, 0] }}
                transition={{ duration: 0.6 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--oath-slash)/0.2)] text-[hsl(var(--oath-slash))]"
              >
                <AlertTriangle className="h-5 w-5" />
              </motion.div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[hsl(var(--oath-slash))]">
                  Oath violated — stake slashed
                </div>
                <div className="mt-0.5 text-balance text-base font-medium text-foreground">
                  The agent attempted an out-of-scope action. The on-chain
                  program reverted and transferred the stake to the
                  user&apos;s wallet.
                </div>
                {errorCode ? (
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {errorCode}
                  </div>
                ) : null}
              </div>
            </div>
            {slashTx ? (
              <a
                href={explorerTx(slashTx)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--oath-slash)/0.55)] bg-[hsl(var(--oath-slash)/0.15)] px-4 py-2 font-mono text-xs text-foreground transition hover:bg-[hsl(var(--oath-slash)/0.25)]"
              >
                slash tx {shortPubkey(slashTx, 5)}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
