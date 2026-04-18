"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ConnectionProvider as RawConnectionProvider,
  WalletProvider as RawWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider as RawWalletModalProvider } from "@solana/wallet-adapter-react-ui";

// `wallet-adapter-react`'s `FC` signatures are tuned for an older
// @types/react and trip the "children is missing in ReactPortal" check
// on React 18.3. Casting to `any` is safe — the wallet-adapter
// components have been stable for years.
const ConnectionProvider = RawConnectionProvider as unknown as React.ComponentType<
  React.PropsWithChildren<{ endpoint: string }>
>;
const WalletProvider = RawWalletProvider as unknown as React.ComponentType<
  React.PropsWithChildren<{ wallets: unknown[]; autoConnect?: boolean }>
>;
const WalletModalProvider = RawWalletModalProvider as unknown as React.ComponentType<
  React.PropsWithChildren<Record<string, unknown>>
>;
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { Toaster } from "sonner";

import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, refetchOnWindowFocus: false } },
});

export function Providers({
  children,
  rpcUrl,
}: {
  children: React.ReactNode;
  rpcUrl: string;
}): JSX.Element {
  const endpoint = React.useMemo(() => rpcUrl || clusterApiUrl("devnet"), [rpcUrl]);
  const wallets = React.useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "!bg-card/80 !backdrop-blur !border-border !text-foreground !shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.3)]",
          },
        }}
      />
    </QueryClientProvider>
  );
}
