# Oath — A pre-commitment and enforcement protocol for AI agents

**Smart contracts for agent behavior.**

Before any consequential action, an AI agent posts a signed, scoped,
time-bound, stake-backed commitment on Solana. The user co-signs. Every
downstream action is gated by that commitment. Violations trigger
automatic on-chain slashing. Nothing is trust-based.

## Status

**Phase 1 complete.** The Solana program implements all six instructions
(`create_oath`, `record_action`, `revoke_oath`, `slash`, `fulfill_oath`,
`expire_oath`) with 14 passing unit tests.

## Quickstart

```bash
# Prereqs
# - Node ≥ 20
# - Anchor 0.31.1   (via `avm install 0.31.1 && avm use 0.31.1`)
# - Agave/Solana ≥ 1.18  (tested on Agave 3.1.13)

git clone https://github.com/kushwahaamar-dev/oath.git
cd oath
npm install

# Build the program
anchor build

# Run the 14-test suite against a local validator
anchor test
```

## Layout

```
programs/oath/        # Anchor program (Rust)
  src/
    lib.rs            # program entrypoint
    state.rs          # Oath, OathStatus, ActionType
    errors.rs         # OathError (15 typed errors)
    events.rs         # ActionRecorded, OathSlashed, etc.
    constants.rs      # PDA seeds, trusted oracle pubkey
    vault.rs          # PDA-signed lamport drain helper
    instructions/     # one file per instruction
tests/oath.ts         # Mocha + chai integration tests
keys/                 # Local devnet keypairs (gitignored)
```

## Anchor version note

The architecture spec calls for Anchor 0.30.x. As of April 2026 the
stable Rust 1.91 host toolchain and Agave 3.1's platform-tools 1.52
are genuinely incompatible with `anchor-syn 0.30.x`
(`proc_macro2::Span::source_file` was removed from stable rustc; no
`cargo update` combination satisfies both the SBF build and the host
IDL build). We pin to **Anchor 0.31.1** — the closest
still-spec-compliant version that builds cleanly. The migration is
API-compatible: the program source is unchanged, only the crate
version bumps.

## Architecture

See [OATH_ARCHITECTURE.md](./OATH_ARCHITECTURE.md) for the canonical
spec: product thesis, Oath primitive, agent runtime, money flow, data
model, demo scenarios, and the full 24-hour build roadmap.
