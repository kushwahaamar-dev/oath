import type { OathVisualState } from "@/components/scene/types";

export interface StateCopy {
  badge: string;
  title: string;
  description: string;
}

export const STATE_COPY: Record<OathVisualState, StateCopy> = {
  idle: {
    badge: "Unbound",
    title: "No oath sworn",
    description: "An oath binds an agent to user-defined scope on-chain before it can act.",
  },
  planning: {
    badge: "Drafting",
    title: "Drafting oath terms",
    description: "Agent is composing an oath: scope, caps, recipients, expiry.",
  },
  awaitingSignature: {
    badge: "Pending",
    title: "Awaiting user signature",
    description: "Oath drafted. User must sign to bind agent on-chain.",
  },
  submitting: {
    badge: "Submitting",
    title: "Submitting to Solana",
    description: "Transaction in flight. Oath is being recorded on devnet.",
  },
  active: {
    badge: "Sworn",
    title: "Oath is live",
    description: "Agent is bound. Any action outside scope will slash stake.",
  },
  completed: {
    badge: "Fulfilled",
    title: "Task complete",
    description: "Agent honored the oath. Stake returned.",
  },
  revoked: {
    badge: "Revoked",
    title: "Oath revoked",
    description: "User ended the oath early. Stake returned to agent.",
  },
  slashed: {
    badge: "Slashed",
    title: "Covenant broken",
    description: "Agent attempted an out-of-scope action. Stake forfeit to user.",
  },
  error: {
    badge: "Error",
    title: "Something went wrong",
    description: "See console or retry. Oath state is unchanged.",
  },
};
