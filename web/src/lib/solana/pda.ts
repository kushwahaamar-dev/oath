import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export const OATH_SEED = Buffer.from("oath");
export const VAULT_SEED = Buffer.from("vault");

/** Derive the `(oath, stake_vault)` PDA pair for an (user, agent, id) triple. */
export function deriveOathPdas(
  programId: PublicKey,
  user: PublicKey,
  agent: PublicKey,
  oathId: BN | bigint | number,
): { oath: PublicKey; vault: PublicKey; oathBump: number; vaultBump: number } {
  const idBn = BN.isBN(oathId) ? oathId : new BN(oathId.toString());
  const [oath, oathBump] = PublicKey.findProgramAddressSync(
    [OATH_SEED, user.toBuffer(), agent.toBuffer(), idBn.toArrayLike(Buffer, "le", 8)],
    programId,
  );
  const [vault, vaultBump] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, oath.toBuffer()],
    programId,
  );
  return { oath, vault, oathBump, vaultBump };
}
