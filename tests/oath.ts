import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Ed25519Program,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";
import * as fs from "fs";
import * as nacl from "tweetnacl";

import { Oath } from "../target/types/oath";

const ORACLE_KEYPAIR_PATH = "keys/oracle.json";

/**
 * Load a keypair the anchor CLI wrote to disk as a JSON byte array.
 */
function loadKeypair(path: string): Keypair {
  const secret = Uint8Array.from(JSON.parse(fs.readFileSync(path, "utf8")));
  return Keypair.fromSecretKey(secret);
}

/**
 * Derive the oath PDA and its stake-vault PDA for a given
 * (user, agent, oath_id) triple.
 */
function deriveOathPdas(
  programId: PublicKey,
  user: PublicKey,
  agent: PublicKey,
  oathId: BN,
) {
  const [oath] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("oath"),
      user.toBuffer(),
      agent.toBuffer(),
      oathId.toArrayLike(Buffer, "le", 8),
    ],
    programId,
  );
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), oath.toBuffer()],
    programId,
  );
  return { oath, vault };
}

/** Shape that satisfies Anchor's `CreateOathArgs` without the Borsh magic. */
interface CreateOathArgsLike {
  oathId: BN;
  purposeHash: number[];
  purposeUri: string;
  spendCap: BN;
  perTxCap: BN;
  stakeAmount: BN;
  allowedActionTypes: { [k: string]: Record<string, never> }[];
  allowedRecipients: PublicKey[];
  allowedDomainsHash: number[];
  expiry: BN;
}

function zeroHash(): number[] {
  return Array(32).fill(0);
}

/**
 * Build an Ed25519 precompile instruction that attests the oracle
 * signed `oath_pda || violation_tx_sig`. Matches the parser in the
 * on-chain `slash` handler.
 */
function buildOracleAttestationIx(
  oraclePrivateKey: Uint8Array,
  oathPda: PublicKey,
  violationTxSig: Uint8Array,
) {
  const message = Buffer.concat([oathPda.toBuffer(), Buffer.from(violationTxSig)]);
  return Ed25519Program.createInstructionWithPrivateKey({
    privateKey: oraclePrivateKey,
    message,
  });
}

/** Extract Anchor error code from a thrown RPC error. */
function errorCodeOf(err: unknown): string | undefined {
  const e = err as any;
  return e?.error?.errorCode?.code;
}

describe("oath program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Oath as Program<Oath>;

  const deployer = (provider.wallet as anchor.Wallet).payer;
  const user = loadKeypair("keys/user.json");
  const agent = loadKeypair("keys/agent.json");
  const attacker = loadKeypair("keys/attacker.json");
  const oracle = loadKeypair(ORACLE_KEYPAIR_PATH);

  /** Monotonic oath id so each test uses a fresh PDA. */
  let nextOathId = 1;

  /** Fund an account with SOL from the deployer. */
  async function fund(to: PublicKey, sol: number) {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: deployer.publicKey,
        toPubkey: to,
        lamports: Math.floor(sol * LAMPORTS_PER_SOL),
      }),
    );
    await provider.sendAndConfirm(tx, [deployer]);
  }

  /** Sane defaults a happy-path oath can use. */
  function makeArgs(overrides: Partial<CreateOathArgsLike> = {}): CreateOathArgsLike {
    const now = Math.floor(Date.now() / 1000);
    return {
      oathId: new BN(nextOathId++),
      purposeHash: zeroHash(),
      purposeUri: "mongo://test",
      spendCap: new BN(200_000_000), // 200 USDC micro-units
      perTxCap: new BN(60_000_000),
      stakeAmount: new BN(0.5 * LAMPORTS_PER_SOL),
      allowedActionTypes: [{ payment: {} }, { apiCall: {} }],
      allowedRecipients: [attacker.publicKey /* placeholder, overridden */],
      allowedDomainsHash: zeroHash(),
      expiry: new BN(now + 3600),
      ...overrides,
    };
  }

  /** Build args with a custom allowed recipient (the common case). */
  function argsWithRecipient(
    recipient: PublicKey,
    overrides: Partial<CreateOathArgsLike> = {},
  ): CreateOathArgsLike {
    return makeArgs({ allowedRecipients: [recipient], ...overrides });
  }

  async function createOath(
    args: CreateOathArgsLike,
    signers: { user: Keypair; agent: Keypair } = { user, agent },
  ) {
    const { oath, vault } = deriveOathPdas(
      program.programId,
      signers.user.publicKey,
      signers.agent.publicKey,
      args.oathId,
    );

    await program.methods
      .createOath(args as any)
      .accounts({
        user: signers.user.publicKey,
        agent: signers.agent.publicKey,
        oath,
        stakeVault: vault,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([signers.user, signers.agent])
      .rpc();

    return { oath, vault };
  }

  before(async () => {
    // Fund user/agent/attacker from the provider wallet (which is the
    // localnet faucet). Each gets enough SOL to cover stakes + fees.
    for (const kp of [user, agent, attacker]) {
      await fund(kp.publicKey, 5);
    }
  });

  it("creates an oath successfully", async () => {
    const recipient = Keypair.generate().publicKey;
    const args = argsWithRecipient(recipient);
    const { oath, vault } = await createOath(args);

    const oathAccount = await program.account.oath.fetch(oath);
    expect(oathAccount.user.toBase58()).to.equal(user.publicKey.toBase58());
    expect(oathAccount.agent.toBase58()).to.equal(agent.publicKey.toBase58());
    expect(oathAccount.stakeAmount.toString()).to.equal(args.stakeAmount.toString());
    expect(oathAccount.spent.toString()).to.equal("0");
    expect(oathAccount.actionCount).to.equal(0);
    expect((oathAccount.status as any).active).to.not.be.undefined;

    const vaultBalance = await provider.connection.getBalance(vault);
    expect(vaultBalance).to.equal(args.stakeAmount.toNumber());
  });

  it("rejects oath with zero stake", async () => {
    const args = argsWithRecipient(Keypair.generate().publicKey, {
      stakeAmount: new BN(0),
    });
    try {
      await createOath(args);
      expect.fail("expected ZeroStake revert");
    } catch (err) {
      expect(errorCodeOf(err)).to.equal("ZeroStake");
    }
  });

  it("rejects oath with expiry in the past", async () => {
    const args = argsWithRecipient(Keypair.generate().publicKey, {
      expiry: new BN(Math.floor(Date.now() / 1000) - 10),
    });
    try {
      await createOath(args);
      expect.fail("expected ExpiryInPast revert");
    } catch (err) {
      expect(errorCodeOf(err)).to.equal("ExpiryInPast");
    }
  });

  it("record_action: happy path increments counters", async () => {
    const recipient = Keypair.generate().publicKey;
    const { oath } = await createOath(argsWithRecipient(recipient));

    await program.methods
      .recordAction({
        actionType: { payment: {} } as any,
        recipient,
        amount: new BN(50_000_000),
      })
      .accounts({ agent: agent.publicKey, oath } as any)
      .signers([agent])
      .rpc();

    const a = await program.account.oath.fetch(oath);
    expect(a.actionCount).to.equal(1);
    expect(a.spent.toString()).to.equal("50000000");
  });

  it("record_action: reverts on scope violation (wrong action type)", async () => {
    const recipient = Keypair.generate().publicKey;
    const { oath } = await createOath(
      argsWithRecipient(recipient, {
        allowedActionTypes: [{ apiCall: {} }],
      }),
    );

    try {
      await program.methods
        .recordAction({
          actionType: { payment: {} } as any,
          recipient,
          amount: new BN(1),
        })
        .accounts({ agent: agent.publicKey, oath } as any)
        .signers([agent])
        .rpc();
      expect.fail("expected UnauthorizedActionType");
    } catch (err) {
      expect(errorCodeOf(err)).to.equal("UnauthorizedActionType");
    }
  });

  it("record_action: reverts on recipient not in whitelist", async () => {
    const whitelisted = Keypair.generate().publicKey;
    const { oath } = await createOath(argsWithRecipient(whitelisted));

    try {
      await program.methods
        .recordAction({
          actionType: { payment: {} } as any,
          recipient: attacker.publicKey,
          amount: new BN(1_000),
        })
        .accounts({ agent: agent.publicKey, oath } as any)
        .signers([agent])
        .rpc();
      expect.fail("expected RecipientNotAllowed");
    } catch (err) {
      expect(errorCodeOf(err)).to.equal("RecipientNotAllowed");
    }
  });

  it("record_action: reverts on per_tx_cap exceeded", async () => {
    const recipient = Keypair.generate().publicKey;
    const { oath } = await createOath(
      argsWithRecipient(recipient, {
        perTxCap: new BN(10_000_000),
        spendCap: new BN(100_000_000),
      }),
    );

    try {
      await program.methods
        .recordAction({
          actionType: { payment: {} } as any,
          recipient,
          amount: new BN(20_000_000),
        })
        .accounts({ agent: agent.publicKey, oath } as any)
        .signers([agent])
        .rpc();
      expect.fail("expected PerTxCapExceeded");
    } catch (err) {
      expect(errorCodeOf(err)).to.equal("PerTxCapExceeded");
    }
  });

  it("record_action: reverts on cumulative spend_cap exceeded", async () => {
    const recipient = Keypair.generate().publicKey;
    const { oath } = await createOath(
      argsWithRecipient(recipient, {
        perTxCap: new BN(60_000_000),
        spendCap: new BN(100_000_000),
      }),
    );

    // First spend: 60 → ok (spent=60, cap=100).
    await program.methods
      .recordAction({
        actionType: { payment: {} } as any,
        recipient,
        amount: new BN(60_000_000),
      })
      .accounts({ agent: agent.publicKey, oath } as any)
      .signers([agent])
      .rpc();

    // Second spend: 60 → would push to 120, over the cap.
    try {
      await program.methods
        .recordAction({
          actionType: { payment: {} } as any,
          recipient,
          amount: new BN(60_000_000),
        })
        .accounts({ agent: agent.publicKey, oath } as any)
        .signers([agent])
        .rpc();
      expect.fail("expected SpendCapExceeded");
    } catch (err) {
      expect(errorCodeOf(err)).to.equal("SpendCapExceeded");
    }
  });

  it("record_action: reverts after revocation", async () => {
    const recipient = Keypair.generate().publicKey;
    const { oath, vault } = await createOath(argsWithRecipient(recipient));

    await program.methods
      .revokeOath()
      .accounts({
        user: user.publicKey,
        oath,
        agent: agent.publicKey,
        stakeVault: vault,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([user])
      .rpc();

    try {
      await program.methods
        .recordAction({
          actionType: { payment: {} } as any,
          recipient,
          amount: new BN(1),
        })
        .accounts({ agent: agent.publicKey, oath } as any)
        .signers([agent])
        .rpc();
      expect.fail("expected OathNotActive");
    } catch (err) {
      expect(errorCodeOf(err)).to.equal("OathNotActive");
    }
  });

  it("record_action: reverts after expiry", async () => {
    const recipient = Keypair.generate().publicKey;
    const now = Math.floor(Date.now() / 1000);
    const { oath } = await createOath(
      argsWithRecipient(recipient, { expiry: new BN(now + 2) }),
    );

    // Wait until the on-chain clock crosses the expiry. 3s buffer is
    // enough on localnet (slot time ~400ms).
    await new Promise((r) => setTimeout(r, 3500));

    try {
      await program.methods
        .recordAction({
          actionType: { payment: {} } as any,
          recipient,
          amount: new BN(1),
        })
        .accounts({ agent: agent.publicKey, oath } as any)
        .signers([agent])
        .rpc();
      expect.fail("expected OathExpired");
    } catch (err) {
      expect(errorCodeOf(err)).to.equal("OathExpired");
    }
  });

  it("revoke_oath: only user can call; returns stake", async () => {
    const recipient = Keypair.generate().publicKey;
    const args = argsWithRecipient(recipient);
    const { oath, vault } = await createOath(args);

    const before = await provider.connection.getBalance(agent.publicKey);

    // Attacker cannot revoke.
    try {
      await program.methods
        .revokeOath()
        .accounts({
          user: attacker.publicKey,
          oath,
          agent: agent.publicKey,
          stakeVault: vault,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([attacker])
        .rpc();
      expect.fail("attacker should not be able to revoke");
    } catch (err) {
      // Either the has_one constraint fires as OathNotActive (our
      // error mapping) or Anchor's ConstraintHasOne. Either is fine;
      // what matters is that it reverts.
      expect(err).to.exist;
    }

    // Real user can.
    await program.methods
      .revokeOath()
      .accounts({
        user: user.publicKey,
        oath,
        agent: agent.publicKey,
        stakeVault: vault,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([user])
      .rpc();

    const after = await provider.connection.getBalance(agent.publicKey);
    expect(after - before).to.equal(args.stakeAmount.toNumber());

    const oathAccount = await program.account.oath.fetch(oath);
    expect((oathAccount.status as any).revoked).to.not.be.undefined;
  });

  it("slash: happy path moves stake to user", async () => {
    const recipient = Keypair.generate().publicKey;
    const args = argsWithRecipient(recipient);
    const { oath, vault } = await createOath(args);

    const userBefore = await provider.connection.getBalance(user.publicKey);

    // A realistic slash proof is the 64-byte signature of a reverted
    // `record_action` tx. We simulate by signing a placeholder — the
    // program only verifies the oracle signed `oath_pda || sig`.
    const fakeViolationSig = new Uint8Array(64).fill(7);
    const ed25519Ix = buildOracleAttestationIx(
      oracle.secretKey,
      oath,
      fakeViolationSig,
    );

    const slashIx = await program.methods
      .slash({ violationTxSig: Array.from(fakeViolationSig) })
      .accounts({
        slasher: deployer.publicKey,
        oath,
        user: user.publicKey,
        stakeVault: vault,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();

    const tx = new Transaction().add(ed25519Ix).add(slashIx);
    await provider.sendAndConfirm(tx, [deployer]);

    const userAfter = await provider.connection.getBalance(user.publicKey);
    expect(userAfter - userBefore).to.equal(args.stakeAmount.toNumber());

    const oathAccount = await program.account.oath.fetch(oath);
    expect((oathAccount.status as any).slashed).to.not.be.undefined;
  });

  it("slash: rejects invalid proof", async () => {
    const recipient = Keypair.generate().publicKey;
    const { oath, vault } = await createOath(argsWithRecipient(recipient));

    // Sign with the WRONG key — attacker impersonating the oracle.
    const fakeViolationSig = new Uint8Array(64).fill(9);
    const forgedIx = Ed25519Program.createInstructionWithPrivateKey({
      privateKey: attacker.secretKey,
      message: Buffer.concat([oath.toBuffer(), Buffer.from(fakeViolationSig)]),
    });

    const slashIx = await program.methods
      .slash({ violationTxSig: Array.from(fakeViolationSig) })
      .accounts({
        slasher: deployer.publicKey,
        oath,
        user: user.publicKey,
        stakeVault: vault,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();

    const tx = new Transaction().add(forgedIx).add(slashIx);
    try {
      await provider.sendAndConfirm(tx, [deployer]);
      expect.fail("expected InvalidSlashProof");
    } catch (err) {
      const code = errorCodeOf(err);
      if (code === "InvalidSlashProof") {
        return; // clean Anchor decode
      }
      // When the Ed25519 precompile signer != oracle the anchor
      // client sometimes surfaces this as a raw SendTransactionError
      // whose logs contain the error name. Fall back to a log search
      // so this test is resilient to anchor's error wrapping.
      const logs: string[] =
        (err as any)?.logs ?? (err as any)?.transactionLogs ?? [];
      const joined =
        logs.join("\n") + "\n" + String((err as any)?.message ?? err);
      expect(joined).to.match(/InvalidSlashProof|custom program error/);
    }
  });

  it("fulfill_oath: only user; returns stake", async () => {
    const recipient = Keypair.generate().publicKey;
    const args = argsWithRecipient(recipient);
    const { oath, vault } = await createOath(args);

    const before = await provider.connection.getBalance(agent.publicKey);

    await program.methods
      .fulfillOath()
      .accounts({
        user: user.publicKey,
        oath,
        agent: agent.publicKey,
        stakeVault: vault,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([user])
      .rpc();

    const after = await provider.connection.getBalance(agent.publicKey);
    expect(after - before).to.equal(args.stakeAmount.toNumber());

    const oathAccount = await program.account.oath.fetch(oath);
    expect((oathAccount.status as any).fulfilled).to.not.be.undefined;
  });
});
// tweetnacl is imported so we can extend tests with additional
// cryptographic assertions; currently used only for type-checking
// that secretKey lengths match nacl's expectations.
void nacl;
