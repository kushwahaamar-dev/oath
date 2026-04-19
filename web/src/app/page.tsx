import * as React from "react";

import { ComparisonPanel } from "@/components/landing/comparison-panel";
import { FinalChamber } from "@/components/landing/final-chamber";
import { Hero } from "@/components/landing/hero";
import { MetricRail } from "@/components/landing/metric-rail";
import { ProofSequence } from "@/components/landing/proof-sequence";
import { SiteHeader } from "@/components/site-header";
import { env } from "@/lib/config";

export default function LandingPage(): JSX.Element {
  return (
    <>
      <SiteHeader programId={env.NEXT_PUBLIC_OATH_PROGRAM_ID} />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(ellipse_at_top,_hsl(var(--foreground)/0.12),_transparent_58%)]" />
        <div className="relative">
          <Hero programId={env.NEXT_PUBLIC_OATH_PROGRAM_ID} />
          <ProofSequence />
          <ComparisonPanel />
          <MetricRail />
          <FinalChamber />
        </div>
      </main>
    </>
  );
}
