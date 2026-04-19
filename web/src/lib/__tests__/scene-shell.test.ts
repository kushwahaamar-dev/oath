// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { createElement, type ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type SceneProps = {
  label: string;
  state: string;
  compact?: boolean;
};

type DynamicOptions = {
  ssr?: boolean;
  loading?: ComponentType;
};

const { useReducedMotionMock, dynamicMock, useFrameMock, dynamicSceneShouldThrowMock } =
  vi.hoisted(() => ({
  useReducedMotionMock: vi.fn(),
  dynamicMock: vi.fn(),
  useFrameMock: vi.fn(),
  dynamicSceneShouldThrowMock: vi.fn(),
  }));

function DynamicSceneStub({ label, state, compact }: SceneProps) {
  if (dynamicSceneShouldThrowMock()) {
    throw new Error("webgl unavailable");
  }

  return createElement(
    "div",
    { "data-testid": "dynamic-scene" },
    `${label}:${state}:${String(compact ?? false)}`,
  );
}

vi.mock("framer-motion", () => ({
  useReducedMotion: () => useReducedMotionMock(),
}));

vi.mock("next/dynamic", () => ({
  default: (loader: unknown, options?: DynamicOptions) => {
    dynamicMock(loader, options);
    return DynamicSceneStub;
  },
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: () => createElement("div", { "data-testid": "scene-canvas" }),
  useFrame: (callback: unknown) => useFrameMock(callback),
}));

vi.mock("@react-three/drei", () => ({
  Environment: () => createElement("div", { "data-testid": "scene-environment" }),
  Float: () => createElement("div", { "data-testid": "scene-float" }),
}));

import { MonolithScene } from "@/components/scene/monolith-scene";
import { SceneShell } from "@/components/scene/scene-shell";

describe("SceneShell", () => {
  beforeEach(() => {
    useReducedMotionMock.mockReset();
    useReducedMotionMock.mockReturnValue(false);
    dynamicSceneShouldThrowMock.mockReset();
    dynamicSceneShouldThrowMock.mockReturnValue(false);
  });

  it("registers a client-only dynamic scene with a SceneFallback loading renderer", () => {
    const [, options] = dynamicMock.mock.calls[0] as [unknown, DynamicOptions];
    const LoadingFallback = options?.loading;

    expect(options?.ssr).toBe(false);
    expect(LoadingFallback).toBeDefined();

    render(createElement(LoadingFallback as ComponentType, {}));

    expect(screen.getByText("Loading scene")).toBeInTheDocument();
    expect(screen.getByText(/webgl fallback loaded/i)).toBeInTheDocument();
  });

  it("renders the reduced-motion fallback instead of the dynamic scene", () => {
    useReducedMotionMock.mockReturnValue(true);

    render(
      createElement(SceneShell, {
        label: "Oath Chamber",
        state: "active",
        compact: true,
      }),
    );

    expect(screen.getByText("Oath is live")).toBeInTheDocument();
    expect(screen.getByText("Sworn")).toBeInTheDocument();
    expect(screen.getByText(/reduced motion/i)).toBeInTheDocument();
    expect(screen.queryByTestId("dynamic-scene")).not.toBeInTheDocument();
  });

  it("renders the dynamic scene seam when reduced motion is disabled", () => {
    render(
      createElement(SceneShell, {
        label: "Oath Chamber",
        state: "active",
        compact: true,
      }),
    );

    expect(screen.getByTestId("dynamic-scene")).toHaveTextContent("Oath Chamber:active:true");
  });

  it("falls back when the dynamic scene throws at runtime", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    dynamicSceneShouldThrowMock.mockReturnValue(true);

    const view = render(
      createElement(SceneShell, {
        label: "Oath Chamber",
        state: "active",
      }),
    );
    const queries = within(view.container);

    expect(queries.getByText("Oath is live")).toBeInTheDocument();
    expect(queries.getByText("Sworn")).toBeInTheDocument();
    expect(queries.queryByTestId("dynamic-scene")).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});

describe("MonolithScene", () => {
  it("mounts a canvas wrapper for the WebGL scene", () => {
    render(
      createElement(MonolithScene, {
        label: "Oath Chamber",
        state: "active",
        compact: true,
      }),
    );

    expect(screen.getByTestId("scene-canvas")).toBeInTheDocument();
  });
});
