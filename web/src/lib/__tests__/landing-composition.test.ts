// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

Object.assign(globalThis, { React });

vi.mock("@/components/site-header", () => ({
  SiteHeader: ({ programId }: { programId: string }) =>
    createElement("div", { "data-testid": "site-header" }, programId),
}));

vi.mock("@/components/scene/scene-shell", () => ({
  SceneShell: ({ label }: { label: string; state: string }) =>
    createElement("div", { "data-testid": "scene-shell" }, label),
}));

import LandingPage from "@/app/page";

describe("LandingPage", () => {
  it("renders the full landing composition", () => {
    render(createElement(LandingPage));

    expect(screen.getByText("Bind intent before action.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Halo records scope, consent, and enforcement before an agent can touch the outside world. Every consequential action begins inside the protocol.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Launch demo",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Open dashboard",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("01 / Propose")).toBeInTheDocument();
    expect(screen.getByText("02 / Sign")).toBeInTheDocument();
    expect(screen.getByText("03 / Gate")).toBeInTheDocument();
    expect(screen.getByText("04 / Slash")).toBeInTheDocument();
    expect(screen.getByText("The agent proposes scope before it acts.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The user signs a narrow mandate with explicit bounds, spend limits, and expiry.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Halo records the mandate before execution, so action only proceeds through the protocol path.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A verified breach slashes stake back to the user without arbitration.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Policy text is not enforcement\./i)).toBeInTheDocument();
    expect(screen.getByText(/See the protocol hold under pressure\./i)).toBeInTheDocument();
    expect(screen.getByText(/Build snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Instructions/i)).toBeInTheDocument();
    expect(screen.queryByText("Chamber / Idle")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("scene-shell")).toHaveLength(1);
    expect(screen.getByTestId("final-chamber-reprise")).toBeInTheDocument();
  });
});
