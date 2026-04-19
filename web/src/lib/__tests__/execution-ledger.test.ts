// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { ActionTimeline } from "@/components/action-timeline";

describe("ActionTimeline", () => {
  it("renders step rationale in ledger rows", () => {
    render(
      createElement(ActionTimeline, {
        steps: [
          {
            seq: 1,
            kind: "search_places",
            status: "success",
            rationale: "Searching matching venues",
          },
        ],
      } as any),
    );

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Searching matching venues")).toBeInTheDocument();
  });
});
