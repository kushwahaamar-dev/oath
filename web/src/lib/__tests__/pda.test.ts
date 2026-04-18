import { BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";

import { deriveOathPdas } from "@/lib/solana/pda";

describe("deriveOathPdas", () => {
  const programId = new PublicKey("2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy");
  const user = Keypair.generate().publicKey;
  const agent = Keypair.generate().publicKey;

  it("is deterministic for the same (user, agent, id)", () => {
    const a = deriveOathPdas(programId, user, agent, new BN(1));
    const b = deriveOathPdas(programId, user, agent, new BN(1));
    expect(a.oath.toBase58()).toBe(b.oath.toBase58());
    expect(a.vault.toBase58()).toBe(b.vault.toBase58());
  });

  it("differs when any component changes", () => {
    const a = deriveOathPdas(programId, user, agent, new BN(1));
    const b = deriveOathPdas(programId, user, agent, new BN(2));
    expect(a.oath.toBase58()).not.toBe(b.oath.toBase58());
    const c = deriveOathPdas(programId, user, Keypair.generate().publicKey, new BN(1));
    expect(a.oath.toBase58()).not.toBe(c.oath.toBase58());
  });

  it("vault PDA is distinct from oath PDA", () => {
    const a = deriveOathPdas(programId, user, agent, new BN(99));
    expect(a.oath.toBase58()).not.toBe(a.vault.toBase58());
  });
});
