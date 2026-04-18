//! # Oath Program
//!
//! On-chain primitive for pre-commitment and enforcement of AI agent
//! behavior. Each `Oath` is a PDA that records a user's authorization
//! of a specific agent to take specific actions, bounded by caps and
//! an expiry, backed by agent-staked SOL. Violations are slashed;
//! fulfillment returns the stake.
//!
//! The canonical spec lives in `OATH_ARCHITECTURE.md`.

use anchor_lang::prelude::*;

mod constants;
mod errors;
mod events;
mod instructions;
mod state;
mod vault;

pub use constants::*;
pub use errors::*;
pub use events::*;
pub use state::*;

use instructions::*;

declare_id!("2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy");

#[program]
pub mod oath {
    use super::*;

    /// Create a new oath. Both the user and the agent must sign. The
    /// agent's `stake_amount` lamports are transferred into a
    /// system-owned PDA vault that this program can only drain via
    /// `revoke_oath`, `slash`, `fulfill_oath`, or `expire_oath`.
    pub fn create_oath(ctx: Context<CreateOath>, args: CreateOathArgs) -> Result<()> {
        instructions::create_oath::handler(ctx, args)
    }

    /// Pre-commit an intended agent action. Reverts if the action is
    /// out of scope, over cap, or the oath is not active. Backend
    /// verifiers refuse to serve agents whose most recent
    /// `record_action` reverted.
    pub fn record_action(ctx: Context<RecordAction>, args: RecordActionArgs) -> Result<()> {
        instructions::record_action::handler(ctx, args)
    }

    /// User-initiated revocation. Status → Revoked and stake is
    /// returned to the agent. No fee in v1.
    pub fn revoke_oath(ctx: Context<RevokeOath>) -> Result<()> {
        instructions::revoke_oath::handler(ctx)
    }

    /// Anyone can call `slash` once an oracle-signed Ed25519 proof of
    /// a scope-violating action is available. Moves the full vault to
    /// the user and terminates the oath.
    pub fn slash(ctx: Context<Slash>, args: SlashArgs) -> Result<()> {
        instructions::slash::handler(ctx, args)
    }

    /// User-initiated happy-path close. Stake returns to agent.
    pub fn fulfill_oath(ctx: Context<FulfillOath>) -> Result<()> {
        instructions::fulfill_oath::handler(ctx)
    }

    /// Anyone can call `expire_oath` after the expiry timestamp has
    /// passed. Returns stake minus an optional keeper fee to the
    /// agent.
    pub fn expire_oath(ctx: Context<ExpireOath>) -> Result<()> {
        instructions::expire_oath::handler(ctx)
    }
}
