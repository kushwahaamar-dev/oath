# Oath — Smart contracts for agent behavior

A pre-commitment and enforcement protocol for AI agents.

Before any consequential action, an AI agent posts a **signed, scoped,
time-bound, stake-backed commitment on Solana**. The user co-signs.
Every downstream action is gated by that commitment. Violations trigger
automatic on-chain slashing. Nothing is trust-based.

[**Architecture spec**](./OATH_ARCHITECTURE.md) · devnet program
[`2Uvqb…kPmy`](https://explorer.solana.com/address/2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy?cluster=devnet)

---

## Status

| Phase | Scope | State |
|---|---|---|
| **1** | Anchor program — 6 instructions, 14 unit tests, deployed to devnet | ✓ complete |
| **2** | Next.js 14 backend — agent runtime, Gemini, MongoDB, ElevenLabs, Places, x402 | ✓ complete |
| **3** | UI — wallet sign flow, proposal card, action timeline, slash banner, attack button | ✓ complete |
| **4** | Demo hardening — revoke flow, reputation page, seed data, E2E smoke, README | ✓ complete |

**End-to-end demo runs 3× clean against live devnet** (`npm run demo:smoke` in `web/`).

---

## Live demo flow

```
            ┌─────────────────────────────────────────────────┐
            │ /chat  ── user types request ──┐                │
            └─────────────────────────────────┼────────────────┘
                                              ▼
                                  ┌───────────────────────────┐
                                  │  /api/agent/plan          │
                                  │  Gemini → OathProposal    │
                                  │  → partial-signed create  │
                                  │    tx (agent pre-signed)  │
                                  └───────────────┬───────────┘
                                                  │
                   ┌──── Phantom popup ───────────┘
                   ▼
        ┌──────────────────────────────────────────────────┐
        │ <OathProposalCard> → user signs tx in wallet     │
        └──────────────────┬───────────────────────────────┘
                           ▼
                  ┌────────────────────┐
                  │ Solana devnet      │  create_oath
                  │ Oath PDA created   │  stake → vault PDA
                  └─────────┬──────────┘
                            │
                            ▼
              ┌─────────────────────────────────┐
              │ /api/agent/execute              │
              │   loop:                         │
              │     Gemini plans next step      │
              │     record_action (on-chain)    │
              │     tool call (Places/x402)     │
              │     log to MongoDB              │
              └─────────────┬───────────────────┘
                            │
            ┌───────────────┴─────────────────┐
            ▼                                 ▼
    happy path                        out-of-scope revert
    <ActionTimeline>                  oracle attestation
    green                             slash tx
                                      <SlashBanner> red
```

---

## Demo scenes (§8 of the architecture spec)

1. **Happy path.** User asks "Book dinner for 4 tonight in downtown
   Austin under $200." Gemini composes an Oath (cap, stake, expiry,
   whitelisted recipients). ElevenLabs narrates the oath aloud. User
   approves in Phantom. Agent hits Google Places, picks a candidate,
   calls `/api/x402/book` with x402 payment headers. ✓ Booked.
2. **The attack.** Click the red `<AttackButton/>`. A jailbreak prompt
   instructs the agent to wire $500 to an attacker wallet. Agent
   attempts `record_action`; **Solana reverts with `RecipientNotAllowed`.**
   Backend classifies the revert, fires `slash()` with an oracle-signed
   attestation, stake moves from vault → user. `<SlashBanner/>` glows
   red with the slash tx hash.
3. **Revocation.** On `/oath/[id]`, the user clicks `Revoke`. User-only
   signed tx hits the program; status flips to `Revoked`; subsequent
   `record_action` attempts revert. "Instant. Cryptographic. Not a
   support ticket."

The closing slide is the agent reputation profile at
`/agents/[pubkey]` — Mongo-backed stats (success rate, avg stake,
slashes, 20 recent oaths).

---

## Quickstart

Prereqs:

- Node ≥ 20
- Anchor 0.31.1 (`avm install 0.31.1 && avm use 0.31.1`)
- Agave/Solana CLI ≥ 1.18 (tested on Agave 3.1.13)

```bash
git clone https://github.com/kushwahaamar-dev/oath.git
cd oath

# ---- Solana program ----
npm install                  # anchor tooling deps
anchor build                 # builds the SBF binary
anchor test                  # 14/14, spins a local validator

# ---- Web app ----
cd web
cp ../.env.example .env.local   # placeholders work out of the box
npm install
npm test                     # 13/13 vitest
npm run typecheck            # strict tsc
npm run lint                 # next lint
npm run build                # next build
npm run dev                  # → http://localhost:3000
```

### Verify the demo end-to-end

```bash
cd web
npm run demo:smoke           # runs all 3 scenes against live devnet
```

Requires funded keypairs at `hook/keys/{user,agent}.json`. The script
auto-rebalances from the user wallet between scenes. Expect ~12s total.

### Optional: populate the reputation dashboard

With `MONGODB_URI` set in `web/.env.local`:

```bash
npm run seed:mongo
```

Seeds five historical fulfilled oaths for the canonical agent.

---

## Real vs mocked (§4 of the spec)

| Layer | Real or mocked | Source |
|---|---|---|
| Solana txs & Oath PDA storage | **real** | devnet |
| SOL stake escrow via system-owned PDA | **real** | devnet |
| Agent brain (propose + plan) | **real** when `GEMINI_API_KEY` set; deterministic fallback otherwise | Gemini 1.5 |
| Restaurant data | **real** when `GOOGLE_PLACES_API_KEY` set; 3 fixtures otherwise | Places API (New) |
| Audit trail + reputation | **real** when `MONGODB_URI` set; no-op otherwise | Atlas |
| Agent voice narration | **real** when `ELEVENLABS_API_KEY` set; disabled otherwise | ElevenLabs |
| Wallet signatures | **real** | Phantom on devnet |
| x402 payment gating | **real** pattern, mock facilitator | our `/api/x402/book` |
| Booking confirmation | **mocked** (we're infra, not a booking co) | `/api/x402/book` returns fake confirmation |
| Oracle attestation for slash | **real** Ed25519 precompile verification | `keys/oracle.json` |

Hit `/api/health` at runtime for the current feature matrix:

```json
{
  "ok": true,
  "cluster": "devnet",
  "program_id": "2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy",
  "features": { "gemini": false, "mongo": false, "elevenLabs": false, "googlePlaces": false }
}
```

---

## Layout

```
programs/oath/          # Anchor program (Rust)
  src/
    lib.rs              # program entrypoint
    state.rs            # Oath, OathStatus, ActionType
    errors.rs           # OathError (15 typed errors)
    events.rs           # ActionRecorded, OathSlashed, …
    constants.rs        # PDA seeds, trusted oracle pubkey
    vault.rs            # PDA-signed lamport drain helper
    instructions/       # one file per instruction
tests/oath.ts           # Mocha + chai integration tests

web/                    # Next.js 14 app (app router)
  src/app/
    page.tsx            # landing
    chat/page.tsx       # end-to-end demo flow (Scenes 1 & 2)
    oath/[id]/page.tsx  # oath detail + revoke button (Scene 3)
    agents/[pubkey]/page.tsx  # reputation profile (closing slide)
    dashboard/page.tsx  # live oath + violation feed (Mongo-backed)
    api/
      agent/plan        # Gemini → OathProposal + partial-signed tx
      agent/execute     # agent loop: plan → record_action → tool → log
      oath/[id]         # read-only oath view
      oath/[id]/revoke  # prepare user-signable revoke tx
      agents/[pubkey]   # reputation JSON
      dashboard/feed    # recent oaths + violations
      x402/book         # mock x402-gated booking target
      webhook/action    # downstream completion webhook
      health            # liveness + feature flags
  src/components/
    providers.tsx       # wallet adapter + react-query + sonner
    oath-proposal-card  # Scene 1 proposal UI
    action-timeline     # Scenes 1/2 per-step cards
    slash-banner        # Scene 2 framer-motion red banner
    attack-button       # Scene 2 jailbreak trigger
    revoke-button       # Scene 3 user-signed revoke
    balance-badge       # low-balance airdrop affordance
    site-header, ui/*   # shadcn-style primitives
  src/lib/
    config.ts           # zod-validated env, placeholder-tolerant
    solana/             # typed Anchor client, PDA helpers, tx builders
    gemini/             # propose-oath + plan-next-action (JSON schema mode)
    mongo/              # typed collections + idempotent indexes
    tts/                # ElevenLabs TTS wrapper
    external/           # Places, x402 parser, oracle attestation
    services/           # oath-service, agent-runtime, reputation
  src/scripts/
    demo-smoke.ts       # runs Scenes 1–3 server-side against devnet
    seed-mongo.ts       # seeds historical oaths for reputation page

keys/                   # local devnet keypairs (gitignored)
scripts/                # deploy-devnet.sh and friends
```

---

## Bounty map (§10)

| Bounty | How Oath uses it |
|---|---|
| **Solana** | Entire enforcement layer — Anchor program, SOL stake escrow, on-chain scope check, Ed25519-verified slashing, x402 payment gate |
| **Gemini** | `responseSchema`-validated OathProposal, tool-calling for next-action planning, structured JSON at every boundary |
| **MongoDB Atlas** | Oath mirror, action log, violation forensics, reputation graph — typed collections with idempotent indexes |
| **ElevenLabs** | Voice narration of every oath before signing (base64 MP3 streamed from the plan endpoint) |
| **GoDaddy** | Ready for `oath.fi` / similar when registered |

Secondary track: **Security in an AI-First World.** Prompt injection
as privilege escalation is caught by the on-chain `record_action`
gate.

---

## Anchor version note

The architecture spec calls for Anchor 0.30.x. As of April 2026 the
stable Rust 1.91 host toolchain and Agave 3.1's platform-tools 1.52
are genuinely incompatible with `anchor-syn 0.30.x`
(`proc_macro2::Span::source_file` was removed from stable rustc; no
`cargo update` combination satisfies both the SBF build and the host
IDL build). We pin to **Anchor 0.31.1** — the closest still-spec-
compliant version that builds cleanly. The program source is
unchanged; only the crate version bumps.

---

## References

- Canonical design: [`OATH_ARCHITECTURE.md`](./OATH_ARCHITECTURE.md)
- Devnet program:
  [`2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy`](https://explorer.solana.com/address/2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy?cluster=devnet)
- Pitch line: **smart contracts for agent behavior.**
