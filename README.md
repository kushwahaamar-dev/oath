# Oath — A pre-commitment and enforcement protocol for AI agents

**Smart contracts for agent behavior.**

Before any consequential action, an AI agent posts a signed, scoped,
time-bound, stake-backed commitment on Solana. The user co-signs. Every
downstream action is gated by that commitment. Violations trigger
automatic on-chain slashing. Nothing is trust-based.

## Status

**Phase 1 — complete.** The Solana program implements all six
instructions (`create_oath`, `record_action`, `revoke_oath`, `slash`,
`fulfill_oath`, `expire_oath`) with 14 passing unit tests. Deployed to
devnet at `2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy`.

**Phase 2 — complete.** Next.js 14 backend with typed Anchor client,
Gemini-structured oath proposal, Google Places integration, ElevenLabs
TTS, MongoDB Atlas audit logging, x402-gated booking endpoint, and
automatic slash-on-violation. All external integrations degrade to
deterministic mocks when credentials are placeholders, so the demo runs
end-to-end with zero API keys. 13 vitest integration tests.

## Quickstart

```bash
# Prereqs
# - Node ≥ 20
# - Anchor 0.31.1   (via `avm install 0.31.1 && avm use 0.31.1`)
# - Agave/Solana ≥ 1.18  (tested on Agave 3.1.13)

git clone https://github.com/kushwahaamar-dev/oath.git
cd oath

# ---- Solana program ----
npm install            # anchor test deps
anchor build
anchor test            # 14/14

# ---- Web app ----
cd web
cp ../.env.example .env.local   # placeholders work out of the box
npm install
npm test               # 13/13 vitest
npm run build          # Next.js prod build
npm run dev            # http://localhost:3000
```

## Layout

```
programs/oath/          # Anchor program (Rust)
  src/
    lib.rs              # program entrypoint
    state.rs            # Oath, OathStatus, ActionType
    errors.rs           # OathError (15 typed errors)
    events.rs           # ActionRecorded, OathSlashed, etc.
    constants.rs        # PDA seeds, trusted oracle pubkey
    vault.rs            # PDA-signed lamport drain helper
    instructions/       # one file per instruction
tests/oath.ts           # Mocha + chai integration tests

web/                    # Next.js 14 app
  src/app/              # pages + route handlers
    api/agent/plan      # Gemini → OathProposal + derived PDAs
    api/agent/execute   # agent loop: plan → record_action → tool → log
    api/oath/[id]       # read-only oath view
    api/x402/book       # mock x402-gated booking target
    api/webhook/action  # downstream completion webhook
    api/health          # liveness + feature flags
  src/lib/
    config.ts           # zod-validated env, placeholder-tolerant
    solana/             # typed Anchor client, PDA helpers, high-level oath ops
    gemini/             # propose-oath + plan-next-action (JSON-schema mode)
    mongo/              # typed collections + idempotent indexes
    tts/eleven-labs.ts  # streaming TTS, returns base64 mp3
    external/           # Google Places, x402, oracle attestation
    services/           # oath-service, agent-runtime
  src/lib/__tests__/    # vitest integration tests
keys/                   # Local devnet keypairs (gitignored)
scripts/                # deploy-devnet.sh and friends
```

## Feature flags

Every external credential is optional. If `GEMINI_API_KEY`,
`GOOGLE_PLACES_API_KEY`, `ELEVENLABS_API_KEY`, or `MONGODB_URI` is left
as `PLACEHOLDER`, the corresponding subsystem falls back to a
deterministic mock, logs a warning, and the demo keeps running. Hit
`/api/health` to see live status:

```json
{
  "ok": true,
  "cluster": "devnet",
  "program_id": "2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy",
  "features": { "gemini": false, "mongo": false, "elevenLabs": false, "googlePlaces": false }
}
```

## Anchor version note

The architecture spec calls for Anchor 0.30.x. As of April 2026 the
stable Rust 1.91 host toolchain and Agave 3.1's platform-tools 1.52
are genuinely incompatible with `anchor-syn 0.30.x`
(`proc_macro2::Span::source_file` was removed from stable rustc; no
`cargo update` combination satisfies both the SBF build and the host
IDL build). We pin to **Anchor 0.31.1** — the closest still-spec-
compliant version that builds cleanly. The migration is API-compatible:
the program source is unchanged, only the crate version bumps.

## Architecture

See [OATH_ARCHITECTURE.md](./OATH_ARCHITECTURE.md) for the canonical
spec: product thesis, Oath primitive, agent runtime, money flow, data
model, demo scenarios, and the full 24-hour build roadmap.
