import * as React from "react";

interface SummaryRailProps {
  totalOaths: number;
  totalViolations: number;
}

export function SummaryRail({
  totalOaths,
  totalViolations,
}: SummaryRailProps): JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryCard label="Oaths" value={String(totalOaths)} detail="Recorded mandates" />
      <SummaryCard
        label="Violations"
        value={String(totalViolations)}
        detail="Scope breaches logged"
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}): JSX.Element {
  return (
    <div className="chamber-surface rounded-[24px] p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div className="font-mono mt-3 text-3xl tracking-[-0.04em] text-foreground md:text-4xl">
        {value}
      </div>
      <div className="font-ui mt-2 text-sm leading-6 text-muted-foreground">{detail}</div>
    </div>
  );
}
