"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { WalletButton } from "@/components/wallet-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "home" },
  { href: "/chat", label: "demo" },
  { href: "/dashboard", label: "dashboard" },
];

export function SiteHeader({ programId }: { programId: string }): JSX.Element {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--oath-ok))] shadow-[0_0_10px_hsl(var(--oath-ok))]" />
            <span className="font-ui font-semibold text-foreground">oath</span>
            <span className="font-mono text-muted-foreground">/ devnet</span>
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            {NAV.map((n) => {
              const active = path === n.href || (n.href !== "/" && path.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "font-ui rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] transition",
                    active
                      ? "bg-card/80 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:block">
            {programId.slice(0, 4)}…{programId.slice(-4)}
          </div>
          <div className="wallet-btn">
            <WalletButton />
          </div>
        </div>
      </div>
      <style jsx global>{`
        .wallet-btn .wallet-adapter-button {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 9999px;
          height: 2.25rem;
          padding: 0 1rem;
          font-size: 0.6875rem;
          font-family: var(--font-ui), var(--font-sans), ui-sans-serif, system-ui,
            sans-serif;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          box-shadow: 0 0 30px hsl(var(--primary) / 0.3);
        }
        .wallet-btn .wallet-adapter-button:not([disabled]):hover {
          background: hsl(var(--primary));
          opacity: 0.9;
        }
      `}</style>
    </header>
  );
}
