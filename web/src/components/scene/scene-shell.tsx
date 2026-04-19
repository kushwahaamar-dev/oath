"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

import { SceneFallback } from "@/components/scene/scene-fallback";
import type { SceneComponentProps } from "@/components/scene/types";

const MonolithScene = dynamic<SceneComponentProps>(
  async () => (await import("./monolith-scene")).MonolithScene,
  {
    ssr: false,
    loading: () => <SceneFallback label="Loading scene" state="loading" />,
  },
);

type SceneErrorBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type SceneErrorBoundaryState = {
  hasError: boolean;
};

class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function SceneShell({ label, state, compact }: SceneComponentProps): JSX.Element {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <SceneFallback label={label} state={state} reducedMotion />;
  }

  return (
    <SceneErrorBoundary
      key={`${label}:${state}:${compact ? "compact" : "full"}`}
      fallback={<SceneFallback label={label} state={state} />}
    >
      <MonolithScene label={label} state={state} compact={compact} />
    </SceneErrorBoundary>
  );
}
