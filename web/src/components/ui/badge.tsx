import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide transition",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        success:
          "border-[hsl(var(--oath-ok)/0.25)] bg-[hsl(var(--oath-ok)/0.12)] text-[hsl(var(--oath-ok))]",
        warn: "border-[hsl(var(--oath-warn)/0.25)] bg-[hsl(var(--oath-warn)/0.12)] text-[hsl(var(--oath-warn))]",
        danger:
          "border-[hsl(var(--oath-slash)/0.35)] bg-[hsl(var(--oath-slash)/0.15)] text-[hsl(var(--oath-slash))]",
        neutral: "border-border bg-muted text-muted-foreground",
        outline: "border-border text-foreground/80",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
