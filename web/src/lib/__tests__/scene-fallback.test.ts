// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { SceneFallback } from "@/components/scene/scene-fallback";

describe("SceneFallback", () => {
  it("renders the label, visible state, and reduced motion messaging", () => {
    render(
      createElement(SceneFallback, {
        label: "Oath Chamber",
        state: "idle",
        reducedMotion: true,
      }),
    );

    expect(screen.getByText("Oath Chamber")).toBeInTheDocument();
    expect(screen.getByText("idle")).toBeInTheDocument();
    expect(screen.getByText(/reduced motion/i)).toBeInTheDocument();
  });

  it("renders the default WebGL fallback branch", () => {
    render(
      createElement(SceneFallback, {
        label: "Oath Chamber",
        state: "stabilizing",
      }),
    );

    expect(screen.getByText("stabilizing")).toBeInTheDocument();
    expect(screen.getByText(/webgl fallback loaded/i)).toBeInTheDocument();
  });
});
