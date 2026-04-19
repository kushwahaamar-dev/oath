// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { DashboardLedger } from "@/components/dashboard/dashboard-ledger";

describe("DashboardLedger", () => {
  it("renders slashed rows as evidence entries", () => {
    render(
      createElement(DashboardLedger, {
        oaths: [
          {
            oath_pda: "11111111111111111111111111111111",
            purpose: "Book dinner",
            status: "Slashed",
            created_at: new Date().toISOString(),
            stake_lamports: "100000000",
            spend_cap_micro: "200000000",
          },
        ],
      } as any),
    );

    expect(screen.getByText("Book dinner")).toBeInTheDocument();
    expect(screen.getByText("Slashed")).toBeInTheDocument();
  });
});
