import type { OathVisualState } from "@/components/scene/types";

type ChatPhase =
  | "idle"
  | "planning"
  | "awaiting-signature"
  | "submitting"
  | "active"
  | "completed";

interface ChatVisualStateInput {
  phase: ChatPhase;
  execution?: {
    slashed?: boolean;
  };
  error?: string;
}

export function deriveChatVisualState(input: ChatVisualStateInput): OathVisualState {
  switch (input.phase) {
    case "planning":
      return "planning";
    case "awaiting-signature":
      return "awaitingSignature";
    case "submitting":
      return "submitting";
    case "active":
      return "active";
    case "completed":
      if (input.execution?.slashed) {
        return "slashed";
      }
      if (input.execution) {
        return "completed";
      }
      return input.error !== undefined ? "error" : "completed";
    default:
      return input.error !== undefined ? "error" : "idle";
  }
}
