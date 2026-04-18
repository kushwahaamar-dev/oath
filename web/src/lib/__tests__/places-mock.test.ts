import { describe, expect, it } from "vitest";

import { searchPlaces } from "@/lib/external/places";

describe("places (mock fallback)", () => {
  it("returns candidates with a deterministic pubkey per name", async () => {
    const a = await searchPlaces("dinner austin");
    const b = await searchPlaces("dinner austin");
    expect(a.length).toBeGreaterThan(0);
    expect(a[0]!.recipient_pubkey).toBe(b[0]!.recipient_pubkey);
    expect(a[0]!.price_estimate_usdc).toBeGreaterThan(0);
  });
});
