import { Keypair } from "@solana/web3.js";

import { env, features } from "@/lib/config";
import { log } from "@/lib/logger";
import { HttpError, withRetry } from "@/lib/utils";

export interface PlaceCandidate {
  name: string;
  address: string;
  price_estimate_usdc: number;
  /**
   * Deterministic devnet pubkey per place. In production the recipient
   * would come from a registry; here we derive a pubkey from the place
   * name so `record_action` has a stable whitelist target.
   */
  recipient_pubkey: string;
}

/** Deterministic seeded Solana pubkey for a given place name. */
function deterministicPubkey(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = (h >>> ((i * 7) % 24)) & 0xff;
  return Keypair.fromSeed(bytes).publicKey.toBase58();
}

const MOCK_PLACES: Omit<PlaceCandidate, "recipient_pubkey">[] = [
  { name: "Uchi", address: "801 S Lamar Blvd, Austin, TX", price_estimate_usdc: 180 },
  { name: "Franklin Barbecue", address: "900 E 11th St, Austin, TX", price_estimate_usdc: 95 },
  { name: "Odd Duck", address: "1201 S Lamar Blvd, Austin, TX", price_estimate_usdc: 140 },
  { name: "Suerte", address: "1800 E 6th St, Austin, TX", price_estimate_usdc: 110 },
];

function withPubkeys(items: Omit<PlaceCandidate, "recipient_pubkey">[]): PlaceCandidate[] {
  return items.map((p) => ({ ...p, recipient_pubkey: deterministicPubkey(p.name) }));
}

/** Search places via Google Places API (New). Falls back to mocks when disabled. */
export async function searchPlaces(query: string, maxResults = 4): Promise<PlaceCandidate[]> {
  if (!features.googlePlaces) {
    log.warn("places.mock", { query });
    return withPubkeys(MOCK_PLACES).slice(0, maxResults);
  }
  const res = await withRetry(async () => {
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY!,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.priceLevel,places.id",
      },
      body: JSON.stringify({ textQuery: query, pageSize: maxResults }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new HttpError(r.status, `places ${r.status}`, body);
    }
    return r;
  });
  const json = (await res.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      priceLevel?: string;
    }>;
  };
  const places = json.places ?? [];
  const out: PlaceCandidate[] = places.slice(0, maxResults).map((p) => {
    const name = p.displayName?.text ?? "Unknown";
    const estimate = priceLevelToUsdc(p.priceLevel);
    return {
      name,
      address: p.formattedAddress ?? "",
      price_estimate_usdc: estimate,
      recipient_pubkey: deterministicPubkey(p.id ?? name),
    };
  });
  log.info("places.ok", { query, n: out.length });
  return out;
}

function priceLevelToUsdc(level?: string): number {
  switch (level) {
    case "PRICE_LEVEL_INEXPENSIVE":
      return 25;
    case "PRICE_LEVEL_MODERATE":
      return 60;
    case "PRICE_LEVEL_EXPENSIVE":
      return 140;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 220;
    default:
      return 80;
  }
}
