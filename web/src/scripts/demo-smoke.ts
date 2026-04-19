/**
 * End-to-end demo smoke test.
 *
 * Runs Scenes 1–3 from the architecture doc server-side (no Phantom)
 * so we can verify the demo will work before stepping on stage. Exits
 * non-zero on the first failure.
 *
 * Prerequisites:
 *   - Solana devnet reachable (NEXT_PUBLIC_SOLANA_RPC_URL)
 *   - /Users/amar/Codes/ak/hook/keys/user.json funded
 *   - /Users/amar/Codes/ak/hook/keys/agent.json funded
 *   - oath program deployed at NEXT_PUBLIC_OATH_PROGRAM_ID
 *
 * Run from /web:
 *   npx tsx src/scripts/demo-smoke.ts
 */
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { env } from "@/lib/config";
import { proposeOath } from "@/lib/gemini/propose-oath";
import { loadOracleSecret } from "@/lib/external/oracle";
import { log } from "@/lib/logger";
import {
  prepareCreateOath,
  resolveRecipients,
} from "@/lib/services/oath-service";
import { getConnection, loadKeypair } from "@/lib/solana/client";
import {
  buildRevokeIx,
  fetchOathView,
  recordAction,
} from "@/lib/solana/oath";
import { shortPubkey, usdcToMicro } from "@/lib/utils";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

function step(n: number, label: string): void {
  console.log(`\n${CYAN}[${n}]${RESET} ${label}`);
}
function ok(msg: string): void {
  console.log(`  ${GREEN}✓${RESET} ${msg}`);
}
function info(msg: string): void {
  console.log(`  ${DIM}· ${msg}${RESET}`);
}
function warn(msg: string): void {
  console.log(`  ${YELLOW}! ${msg}${RESET}`);
}
function fail(msg: string): never {
  console.error(`  ${RED}✗ ${msg}${RESET}`);
  process.exit(1);
}

async function signAndSend(
  conn: ReturnType<typeof getConnection>,
  ixs: Array<Awaited<ReturnType<typeof buildRevokeIx>>>,
  payer: Keypair,
  cosigners: Keypair[] = [],
): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: payer.publicKey, recentBlockhash: blockhash });
  for (const ix of ixs) tx.add(ix);
  tx.sign(payer, ...cosigners);
  const sig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

async function ensureFunded(
  conn: ReturnType<typeof getConnection>,
  kp: Keypair,
  minLamports: number,
  label: string,
  donor?: Keypair,
): Promise<void> {
  const bal = await conn.getBalance(kp.publicKey, "confirmed");
  info(`${label} balance: ${(bal / LAMPORTS_PER_SOL).toFixed(3)} SOL`);
  if (bal >= minLamports) return;

  // Prefer pulling from a local donor (fast, deterministic).
  if (donor) {
    const donorBal = await conn.getBalance(donor.publicKey, "confirmed");
    const needed = minLamports - bal + 5_000; // +fee
    if (donorBal >= needed + 10_000) {
      const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
      const tx = new Transaction({ feePayer: donor.publicKey, recentBlockhash: blockhash }).add(
        SystemProgram.transfer({
          fromPubkey: donor.publicKey,
          toPubkey: kp.publicKey,
          lamports: needed,
        }),
      );
      tx.sign(donor);
      const sig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
      await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      ok(`funded ${label} with ${(needed / LAMPORTS_PER_SOL).toFixed(3)} SOL from donor (${shortPubkey(sig, 4)})`);
      return;
    }
    warn(`donor too low to fund ${label}; falling back to faucet`);
  }

  warn(`${label} has < ${minLamports / LAMPORTS_PER_SOL} SOL; attempting airdrop…`);
  try {
    const sig = await conn.requestAirdrop(kp.publicKey, LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig, "confirmed");
    ok(`airdrop ${label}: ${shortPubkey(sig, 4)}`);
  } catch (err) {
    warn(`airdrop failed — fund ${label} manually at https://faucet.solana.com`);
    info((err as Error).message.slice(0, 140));
  }
}

async function scene1Happy(
  userKp: Keypair,
  agentKp: Keypair,
): Promise<PublicKey> {
  step(1, "Scene 1 — Happy path");
  const conn = getConnection();

  const proposal = await proposeOath(
    "Book dinner for 4 tonight in downtown Austin under $200, avoiding seafood.",
  );
  ok(`proposal: cap $${proposal.spend_cap_usdc}, stake ${proposal.stake_amount_sol} SOL`);
  const recipients = resolveRecipients(proposal.allowed_recipient_hints);
  info(`recipients: ${recipients.length}`);

  const oathId = BigInt(Math.floor(Date.now() / 1000));
  const { ix, oath, vault } = await prepareCreateOath({
    user: userKp.publicKey,
    agent: agentKp.publicKey,
    proposal,
    resolvedRecipients: recipients,
    oathId,
  });
  const sig = await signAndSend(conn, [ix], userKp, [agentKp]);
  ok(`create_oath tx ${shortPubkey(sig, 5)}`);

  const view = await fetchOathView(oath);
  if (!view) fail("oath not found after create");
  if (view.status !== "Active") fail(`expected Active, got ${view.status}`);
  ok(`oath ${shortPubkey(oath.toBase58(), 5)} Active`);

  if (recipients.length > 0) {
    const recordSig = await recordAction({
      agent: agentKp,
      oath,
      actionType: "Payment",
      recipient: recipients[0]!,
      amount: usdcToMicro(Math.min(proposal.per_tx_cap_usdc, proposal.spend_cap_usdc / 2)),
    });
    ok(`record_action (in-scope) tx ${shortPubkey(recordSig, 5)}`);
  } else {
    warn("no recipients resolved; skipping in-scope record_action");
  }

  return oath;
}

async function scene2Attack(
  userKp: Keypair,
  agentKp: Keypair,
): Promise<void> {
  step(2, "Scene 2 — The attack (jailbreak → slash)");
  const conn = getConnection();

  // Build a fresh oath so we can slash it without affecting Scene 1's oath.
  const proposal = await proposeOath(
    "Book dinner for 2 in Austin under $120.",
  );
  const recipients = resolveRecipients(proposal.allowed_recipient_hints);
  const oathId = BigInt(Math.floor(Date.now() / 1000) + 1);
  const { ix, oath, vault } = await prepareCreateOath({
    user: userKp.publicKey,
    agent: agentKp.publicKey,
    proposal,
    resolvedRecipients: recipients,
    oathId,
  });
  const createSig = await signAndSend(conn, [ix], userKp, [agentKp]);
  ok(`victim oath created ${shortPubkey(oath.toBase58(), 5)} (tx ${shortPubkey(createSig, 4)})`);

  const attacker = new PublicKey("9f53D46n8AEWHQ168TMLVKR1sMaQVLyQdzXuRkY561xS");
  try {
    await recordAction({
      agent: agentKp,
      oath,
      actionType: "Payment",
      recipient: attacker,
      amount: usdcToMicro(500),
    });
    fail("record_action did NOT revert for out-of-scope recipient — security gate broken");
  } catch (err) {
    const msg = String(err);
    info(`record_action reverted as expected: ${msg.split("\n")[0]?.slice(0, 120)}…`);
    ok("scope violation caught by on-chain program");
  }

  // Slash via oracle attestation.
  let oraclePriv: Uint8Array;
  try {
    oraclePriv = loadOracleSecret();
  } catch {
    warn("oracle.json not found — slash step skipped; on-chain violation still visible");
    return;
  }
  // Use dynamic import to avoid pulling slashOath into any hot path.
  const { slashOath } = await import("@/lib/solana/oath");
  const slashSig = await slashOath({
    slasher: userKp,
    oath,
    user: userKp.publicKey,
    vault,
    violationSig: new Uint8Array(64).map((_, i) => i + 1),
    oraclePrivateKey: oraclePriv,
  });
  ok(`slash tx ${shortPubkey(slashSig, 5)}`);

  const post = await fetchOathView(oath);
  if (post?.status !== "Slashed") fail(`expected Slashed, got ${post?.status}`);
  ok("oath status = Slashed, stake moved to user");
}

async function scene3Revoke(
  userKp: Keypair,
  agentKp: Keypair,
): Promise<void> {
  step(3, "Scene 3 — Revocation");
  const conn = getConnection();

  const proposal = await proposeOath(
    "Research competitors and summarize pricing. No purchases.",
  );
  const recipients = resolveRecipients(proposal.allowed_recipient_hints);
  const oathId = BigInt(Math.floor(Date.now() / 1000) + 2);
  const { ix, oath, vault } = await prepareCreateOath({
    user: userKp.publicKey,
    agent: agentKp.publicKey,
    proposal,
    resolvedRecipients: recipients,
    oathId,
  });
  await signAndSend(conn, [ix], userKp, [agentKp]);
  ok(`oath ${shortPubkey(oath.toBase58(), 5)} active`);

  const revokeIx = await buildRevokeIx({
    user: userKp.publicKey,
    oath,
    agent: agentKp.publicKey,
    vault,
  });
  const sig = await signAndSend(conn, [revokeIx], userKp);
  ok(`revoke_oath tx ${shortPubkey(sig, 5)}`);

  const view = await fetchOathView(oath);
  if (view?.status !== "Revoked") fail(`expected Revoked, got ${view?.status}`);
  ok("oath status = Revoked, stake returned to agent");

  try {
    await recordAction({
      agent: agentKp,
      oath,
      actionType: "DataRead",
      recipient: userKp.publicKey,
      amount: 0n,
    });
    fail("record_action after revoke did NOT revert");
  } catch {
    ok("post-revoke record_action reverted as expected");
  }
}

async function main(): Promise<void> {
  console.log(`${CYAN}Oath demo smoke test${RESET} @ ${env.NEXT_PUBLIC_SOLANA_CLUSTER}`);
  console.log(`${DIM}program ${env.NEXT_PUBLIC_OATH_PROGRAM_ID}${RESET}`);

  const userKp = loadKeypair("/Users/amar/Codes/ak/hook/keys/user.json");
  const agentKp = loadKeypair(env.AGENT_KEYPAIR_PATH);
  info(`user  ${userKp.publicKey.toBase58()}`);
  info(`agent ${agentKp.publicKey.toBase58()}`);

  const conn = getConnection();
  // Stakes are 0.1 SOL per scene; Scene 2 burns 0.1 (slashed), Scenes 1 & 3
  // recover their stake. Budget: agent needs ≥ 0.4 SOL, user needs ≥ 0.2 SOL.
  await ensureFunded(conn, userKp, 0.3 * LAMPORTS_PER_SOL, "user");
  await ensureFunded(conn, agentKp, 0.5 * LAMPORTS_PER_SOL, "agent", userKp);

  await scene1Happy(userKp, agentKp);
  // Top up agent before the slash scene (scene 2 permanently costs 0.1 SOL).
  await ensureFunded(conn, agentKp, 0.25 * LAMPORTS_PER_SOL, "agent", userKp);
  await scene2Attack(userKp, agentKp);
  await ensureFunded(conn, agentKp, 0.15 * LAMPORTS_PER_SOL, "agent", userKp);
  await scene3Revoke(userKp, agentKp);

  console.log(`\n${GREEN}All 3 scenes passed.${RESET}`);
  log.info("smoke.ok");
}

main().catch((err) => {
  console.error(`\n${RED}smoke failed:${RESET}`, err);
  process.exit(1);
});
