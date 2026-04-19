import { describe, expect, it } from "vitest";

import { getScenePreset } from "@/components/scene/scene-presets";

describe("getScenePreset", () => {
  it("gives slashed a harsher visual preset than active", () => {
    const active = getScenePreset("active");
    const slashed = getScenePreset("slashed");

    expect(slashed.fracture).toBeGreaterThan(active.fracture);
    expect(slashed.haloOpacity).toBeLessThan(active.haloOpacity);
  });
});
