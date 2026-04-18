"use client";

import dynamic from "next/dynamic";

/**
 * `WalletMultiButton` ships non-SSR-safe code. We wrap it with
 * `next/dynamic` so it never renders on the server.
 */
export const WalletButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);
