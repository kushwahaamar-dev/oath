import { describe, expect, it } from "vitest";

describe("config", () => {
  it("provides defaults and feature flags when env is empty", async () => {
    const mod = await import("@/lib/config");
    expect(mod.env.NEXT_PUBLIC_OATH_PROGRAM_ID.length).toBeGreaterThan(30);
    expect(mod.features).toHaveProperty("gemini");
    expect(mod.features).toHaveProperty("elevenLabs");
    expect(typeof mod.features.gemini).toBe("boolean");
  });
});
