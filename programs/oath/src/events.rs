use anchor_lang::prelude::*;

use crate::state::ActionType;

#[event]
pub struct OathCreated {
    pub oath: Pubkey,
    pub user: Pubkey,
    pub agent: Pubkey,
    pub oath_id: u64,
    pub spend_cap: u64,
    pub per_tx_cap: u64,
    pub stake_amount: u64,
    pub expiry: i64,
    pub purpose_hash: [u8; 32],
}

/// Emitted on every successful `record_action`. Backend indexers feed
/// MongoDB from this event stream; the `seq` equals the post-increment
/// `action_count` so consumers can de-dupe.
#[event]
pub struct ActionRecorded {
    pub oath: Pubkey,
    pub seq: u32,
    pub action_type: ActionType,
    pub recipient: Pubkey,
    pub amount: u64,
    pub spent_after: u64,
}

/// Emitted when the program rejects a `record_action` attempt. We
/// still want observability even though the instruction reverts, so
/// the backend's `logs_subscribe` also captures this via the error
/// variant. This event is purely for off-chain indexing of *successful*
/// rejections that were caught before the revert.
///
/// Note: Anchor reverts clear state changes, so this event is only
/// emitted from instructions that explicitly log before returning Err.
#[event]
pub struct ActionRejected {
    pub oath: Pubkey,
    pub action_type: ActionType,
    pub recipient: Pubkey,
    pub amount: u64,
    pub reason: u32,
}

#[event]
pub struct OathRevoked {
    pub oath: Pubkey,
    pub user: Pubkey,
    pub returned_to_agent: u64,
}

#[event]
pub struct OathSlashed {
    pub oath: Pubkey,
    pub slasher: Pubkey,
    pub transferred_to_user: u64,
}

#[event]
pub struct OathFulfilled {
    pub oath: Pubkey,
    pub returned_to_agent: u64,
}

#[event]
pub struct OathExpiredEvent {
    pub oath: Pubkey,
    pub returned_to_agent: u64,
    pub keeper_fee: u64,
}
