"use client";

import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

interface RequestComposerProps {
  value: string;
  examples: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function RequestComposer({
  value,
  examples,
  disabled,
  onChange,
  onSubmit,
}: RequestComposerProps): JSX.Element {
  return (
    <section className="space-y-4 rounded-2xl">
      <label
        htmlFor="chat-request"
        className="block text-xs uppercase tracking-widest text-muted-foreground"
      >
        Your request
      </label>
      <Textarea
        id="chat-request"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tell the agent what to do. It'll propose an on-chain oath before acting."
        rows={3}
        className="text-base"
      />

      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onChange(example)}
            className="rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            {example.length > 54 ? `${example.slice(0, 54)}...` : example}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button size="lg" onClick={onSubmit} disabled={disabled} className="group">
          <Sparkles className="mr-2 h-4 w-4" />
          Propose oath
          <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
        </Button>
      </div>
    </section>
  );
}
