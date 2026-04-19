import type { Metadata } from "next";
import {
  Bodoni_Moda,
  Inter,
  JetBrains_Mono,
  Manrope,
} from "next/font/google";

import { Providers } from "@/components/providers";
import { env } from "@/lib/config";

import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const display = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  adjustFontFallback: false,
});
const ui = Manrope({ subsets: ["latin"], variable: "--font-ui" });

export const metadata: Metadata = {
  title: "Oath — smart contracts for agent behavior",
  description:
    "A pre-commitment and enforcement protocol for AI agents on Solana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable} ${ui.variable} dark`}
    >
      <body className="min-h-screen bg-background">
        <Providers rpcUrl={env.NEXT_PUBLIC_SOLANA_RPC_URL}>{children}</Providers>
      </body>
    </html>
  );
}
