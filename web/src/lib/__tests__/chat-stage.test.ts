// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/scene/scene-shell", () => ({
  SceneShell: ({ state }: { label: string; state: string }) =>
    createElement("div", { "data-testid": "scene-shell" }, state),
}));

import { ChatStage } from "@/components/chat/chat-stage";

describe("ChatStage", () => {
  it("renders the current scene state through SceneShell", () => {
    render(
      createElement(ChatStage, {
        state: "awaitingSignature",
        title: "Agent concierge",
      }),
    );

    expect(screen.getByTestId("scene-shell")).toHaveTextContent("awaitingSignature");
  });
});
