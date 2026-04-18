import { BN } from "@coral-xyz/anchor";
import {
  Ed25519Program,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";

import type { ActionType, OathStatus, OathView } from "@/lib/types";
import { log } from "@/lib/logger";
import { getConnection, getOathProgram, programId } from "./client";
import { deriveOathPdas } from "./pda";

/** ActionType <-> Anchor enum variant object. */
export function actionTypeToVariant(t: ActionType): Record<string, object> {
  const map: Record<ActionType, string> = {
    Payment: "payment",
    DataRead: "dataRead",
    ApiCall: "apiCall",
    TokenTransfer: "tokenTransfer",
    Signature: "signature",
    MultimodalInput: "multimodalInput",
  };
  return { [map[t]]: {} };
}

function variantKey(v: Record<string, unknown>): string {
  return Object.keys(v)[0] ?? "";
}

function actionTypeFromVariant(v: Record<string, unknown>): ActionType {
  const map: Record<string, ActionType> = {
    payment: "Payment",
    dataRead: "DataRead",
    apiCall: "ApiCall",
    tokenTransfer: "TokenTransfer",
    signature: "Signature",
    multimodalInput: "MultimodalInput",
  };
  const k = variantKey(v);
  const out = map[k];
  if (!out) throw new Error(`Unknown ActionType variant: ${k}`);
  return out;
}

function oathStatusFromVariant(v: Record<string, unknown>): OathStatus {
  const map: Record<string, OathStatus> = {
    active: "Active",
    expired: "Expired",
    revoked: "Revoked",
    slashed: "Slashed",
    fulfilled: "Fulfilled",
  };
  const k = variantKey(v);
  const out = map[k];
  if (!out) throw new Error(`Unknown OathStatus variant: ${k}`);
  return out;
}

/**
 * Build the `create_oath` instruction. Caller is responsible for adding
 * `user` and `agent` signers to the transaction. Returns the derived
 * PDA addresses as well, so the UI can link to the oath immediately
 * on confirmation.
 */
export async function buildCreateOathIx(params: {
  user: PublicKey;
  agent: PublicKey;
  oathId: bigint;
  purposeHash: Uint8Array;
  purposeUri: string;
  spendCap: bigint;
  perTxCap: bigint;
  stakeAmount: bigint;
  allowedActionTypes: ActionType[];
  allowedRecipients: PublicKey[];
  allowedDomainsHash: Uint8Array;
  expiry: bigint;
}): Promise<{ ix: TransactionInstruction; oath: PublicKey; vault: PublicKey }> {
  const program = getOathProgram();
  const { oath, vault } = deriveOathPdas(
    programId(),
    params.user,
    params.agent,
    new BN(params.oathId.toString()),
  );
  const ix = await program.methods
    .createOath({
      oathId: new BN(params.oathId.toString()),
      purposeHash: Array.from(params.purposeHash),
      purposeUri: params.purposeUri,
      spendCap: new BN(params.spendCap.toString()),
      perTxCap: new BN(params.perTxCap.toString()),
      stakeAmount: new BN(params.stakeAmount.toString()),
      allowedActionTypes: params.allowedActionTypes.map(actionTypeToVariant),
      allowedRecipients: params.allowedRecipients,
      allowedDomainsHash: Array.from(params.allowedDomainsHash),
      expiry: new BN(params.expiry.toString()),
    } as never)
    .accounts({
      user: params.user,
      agent: params.agent,
      oath,
      stakeVault: vault,
      systemProgram: SystemProgram.programId,
    } as never)
    .instruction();
  return { ix, oath, vault };
}

/** Agent-signed `record_action`. Reverts on scope violation (this is the gate). */
export async function recordAction(params: {
  agent: Keypair;
  oath: PublicKey;
  actionType: ActionType;
  recipient: PublicKey;
  amount: bigint;
}): Promise<string> {
  const program = getOathProgram(params.agent);
  const sig = await program.methods
    .recordAction({
      actionType: actionTypeToVariant(params.actionType),
      recipient: params.recipient,
      amount: new BN(params.amount.toString()),
    } as never)
    .accounts({
      agent: params.agent.publicKey,
      oath: params.oath,
    } as never)
    .rpc();
  log.info("oath.record_action.ok", { sig, oath: params.oath.toBase58() });
  return sig;
}

/** Build (but don't send) an instruction set that slashes an oath with
 * an oracle-signed violation proof. The caller sends the tx.
 */
export function buildSlashTx(params: {
  slasher: PublicKey;
  oath: PublicKey;
  user: PublicKey;
  vault: PublicKey;
  violationSig: Uint8Array;
  oraclePrivateKey: Uint8Array;
}): Transaction {
  const ed25519Ix = Ed25519Program.createInstructionWithPrivateKey({
    privateKey: params.oraclePrivateKey,
    message: Buffer.concat([
      params.oath.toBuffer(),
      Buffer.from(params.violationSig),
    ]),
  });
  const program = getOathProgram();
  const tx = new Transaction().add(ed25519Ix);
  // Lazy: wrap the instruction build + send in async wrapper below.
  // We expose the builder so the caller can prepend/append.
  tx.add({
    keys: [
      { pubkey: params.slasher, isSigner: true, isWritable: true },
      { pubkey: params.oath, isSigner: false, isWritable: true },
      { pubkey: params.user, isSigner: false, isWritable: true },
      { pubkey: params.vault, isSigner: false, isWritable: true },
      {
        pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: program.programId,
    data: Buffer.alloc(0), // placeholder; real caller uses high-level `slash` below
  });
  return tx;
}

/** High-level slash helper that signs and sends via the slasher keypair. */
export async function slashOath(params: {
  slasher: Keypair;
  oath: PublicKey;
  user: PublicKey;
  vault: PublicKey;
  violationSig: Uint8Array;
  oraclePrivateKey: Uint8Array;
}): Promise<string> {
  const program = getOathProgram(params.slasher);
  const ed25519Ix = Ed25519Program.createInstructionWithPrivateKey({
    privateKey: params.oraclePrivateKey,
    message: Buffer.concat([
      params.oath.toBuffer(),
      Buffer.from(params.violationSig),
    ]),
  });
  const slashIx = await program.methods
    .slash({ violationTxSig: Array.from(params.violationSig) } as never)
    .accounts({
      slasher: params.slasher.publicKey,
      oath: params.oath,
      user: params.user,
      stakeVault: params.vault,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      systemProgram: SystemProgram.programId,
    } as never)
    .instruction();
  const tx = new Transaction().add(ed25519Ix).add(slashIx);
  const conn = getConnection();
  const sig = await conn.sendTransaction(tx, [params.slasher]);
  await conn.confirmTransaction(sig, "confirmed");
  log.info("oath.slash.ok", { sig, oath: params.oath.toBase58() });
  return sig;
}

/**
 * Build the `revoke_oath` instruction. Only the `user` needs to sign;
 * the program returns the stake to the agent. The caller wraps it in a
 * tx and sends it (via Phantom for the UI, via server keypair for tests).
 */
export async function buildRevokeIx(params: {
  user: PublicKey;
  oath: PublicKey;
  agent: PublicKey;
  vault: PublicKey;
}): Promise<TransactionInstruction> {
  const program = getOathProgram();
  return program.methods
    .revokeOath()
    .accounts({
      user: params.user,
      oath: params.oath,
      agent: params.agent,
      stakeVault: params.vault,
      systemProgram: SystemProgram.programId,
    } as never)
    .instruction();
}

/** Fetch an oath account and project it into a UI-friendly shape. */
export async function fetchOathView(oath: PublicKey): Promise<OathView | null> {
  const program = getOathProgram();
  const acc = await program.account.oath.fetchNullable(oath);
  if (!acc) return null;
  const a = acc as unknown as {
    user: PublicKey;
    agent: PublicKey;
    oathId: BN;
    purposeUri: string;
    spendCap: BN;
    spent: BN;
    perTxCap: BN;
    stakeAmount: BN;
    stakeVault: PublicKey;
    allowedActionTypes: Array<Record<string, unknown>>;
    allowedRecipients: PublicKey[];
    expiry: BN;
    createdAt: BN;
    status: Record<string, unknown>;
    actionCount: number;
  };
  return {
    oath_pda: oath.toBase58(),
    user_pubkey: a.user.toBase58(),
    agent_pubkey: a.agent.toBase58(),
    oath_id: a.oathId.toString(),
    purpose: a.purposeUri,
    spend_cap: a.spendCap.toString(),
    spent: a.spent.toString(),
    per_tx_cap: a.perTxCap.toString(),
    stake_amount: a.stakeAmount.toString(),
    stake_vault: a.stakeVault.toBase58(),
    allowed_action_types: a.allowedActionTypes.map(actionTypeFromVariant),
    allowed_recipients: a.allowedRecipients.map((p) => p.toBase58()),
    expiry: a.expiry.toNumber(),
    created_at: a.createdAt.toNumber(),
    status: oathStatusFromVariant(a.status),
    action_count: a.actionCount,
  };
}
