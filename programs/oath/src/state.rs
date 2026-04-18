use anchor_lang::prelude::*;

use crate::constants::{MAX_ALLOWED_ACTION_TYPES, MAX_ALLOWED_RECIPIENTS, MAX_PURPOSE_URI_LEN};

/// Categories of action an agent can take. The on-chain allowlist is
/// expressed as a `Vec<ActionType>` that must be a subset of this enum.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum ActionType {
    Payment,
    DataRead,
    ApiCall,
    TokenTransfer,
    Signature,
    MultimodalInput,
}

/// Lifecycle states of an oath.
///
/// INVARIANT: transitions are one-way. Active → {Revoked, Slashed,
/// Fulfilled, Expired}. Terminal states never transition again.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum OathStatus {
    Active,
    Revoked,
    Slashed,
    Fulfilled,
    Expired,
}

/// A signed, scoped, time-bound, stake-backed commitment by an agent.
///
/// PDA seeds: ["oath", user_pubkey, agent_pubkey, oath_id (u64 LE)].
///
/// The stake vault is a separate system-owned PDA with zero data,
/// derived from this account's address. Its lamports represent the
/// agent's collateral.
///
/// INVARIANTS:
///   - `spent <= spend_cap` at all times.
///   - `per_tx_cap <= spend_cap`.
///   - `status == Active` is required for every `record_action`.
///   - `status` transitions are one-way (enforced in handlers).
///   - `stake_amount > 0` at creation (zero-stake oaths are
///     meaningless since slashing cannot punish).
#[account]
#[derive(InitSpace)]
pub struct Oath {
    pub user: Pubkey,
    pub agent: Pubkey,
    pub oath_id: u64,
    pub purpose_hash: [u8; 32],
    #[max_len(MAX_PURPOSE_URI_LEN)]
    pub purpose_uri: String,
    pub spend_cap: u64,
    pub spent: u64,
    pub per_tx_cap: u64,
    pub stake_amount: u64,
    pub stake_vault: Pubkey,
    #[max_len(MAX_ALLOWED_ACTION_TYPES)]
    pub allowed_action_types: Vec<ActionType>,
    #[max_len(MAX_ALLOWED_RECIPIENTS)]
    pub allowed_recipients: Vec<Pubkey>,
    pub allowed_domains_hash: [u8; 32],
    pub expiry: i64,
    pub created_at: i64,
    pub status: OathStatus,
    pub action_count: u32,
    pub bump: u8,
    pub vault_bump: u8,
}

impl Oath {
    pub fn is_active(&self, now: i64) -> bool {
        self.status == OathStatus::Active && now < self.expiry
    }
}
