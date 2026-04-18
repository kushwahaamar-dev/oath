use anchor_lang::prelude::*;

/// PDA seed prefix for an Oath account.
pub const OATH_SEED: &[u8] = b"oath";

/// PDA seed prefix for an Oath's stake vault account.
pub const VAULT_SEED: &[u8] = b"vault";

/// Maximum length of the plain-text purpose URI stored on-chain.
/// We keep the raw purpose off-chain in MongoDB; only the sha256 is
/// stored on-chain. The URI here is a pointer like `mongo://<id>`.
pub const MAX_PURPOSE_URI_LEN: usize = 128;

/// Maximum allowed action types per oath.
pub const MAX_ALLOWED_ACTION_TYPES: usize = 8;

/// Maximum allowed recipients per oath.
pub const MAX_ALLOWED_RECIPIENTS: usize = 16;

/// The oracle pubkey authorized to attest slash violations.
///
/// Slashing a stake-backed commitment is irreversible, so the proof
/// must be unforgeable. For v1 we trust a single oracle keypair run by
/// the backend watcher; v2 will replace this with a light-client style
/// proof of a reverted `record_action` tx.
///
/// INVARIANT: this pubkey MUST match the Ed25519 signer embedded in
/// the precompile instruction accompanying every `slash` call.
pub const ORACLE_PUBKEY_BYTES: [u8; 32] = [
    141, 112, 112, 161, 70, 208, 14, 75, 252, 241, 108, 130, 239, 140, 80, 180,
    175, 95, 1, 190, 160, 230, 133, 137, 24, 6, 40, 74, 233, 252, 228, 218,
];

pub fn oracle_pubkey() -> Pubkey {
    Pubkey::new_from_array(ORACLE_PUBKEY_BYTES)
}
