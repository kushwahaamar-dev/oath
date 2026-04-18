use anchor_lang::prelude::*;

#[error_code]
pub enum OathError {
    #[msg("Action type is not in this oath's allowed list.")]
    UnauthorizedActionType,

    #[msg("Recipient is not in this oath's whitelist.")]
    RecipientNotAllowed,

    #[msg("Requested amount exceeds the per-transaction cap.")]
    PerTxCapExceeded,

    #[msg("Cumulative spend would exceed this oath's spend cap.")]
    SpendCapExceeded,

    #[msg("Oath has expired.")]
    OathExpired,

    #[msg("Oath is not active.")]
    OathNotActive,

    #[msg("Oath has not yet expired.")]
    OathNotExpired,

    #[msg("Stake amount must be greater than zero.")]
    ZeroStake,

    #[msg("Per-tx cap cannot exceed spend cap.")]
    InvalidCaps,

    #[msg("Expiry must be in the future.")]
    ExpiryInPast,

    #[msg("Too many allowed action types (max 8).")]
    TooManyActionTypes,

    #[msg("Too many allowed recipients (max 16).")]
    TooManyRecipients,

    #[msg("Purpose URI exceeds maximum length.")]
    PurposeUriTooLong,

    #[msg("Slash proof is invalid or not signed by the oracle.")]
    InvalidSlashProof,

    #[msg("Arithmetic overflow.")]
    MathOverflow,
}

/// Generic scope violation: collapses UnauthorizedActionType +
/// RecipientNotAllowed into a single guard in the backend, which is
/// what the architecture doc calls `SCOPE_VIOLATION`.
pub fn is_scope_violation(err: &OathError) -> bool {
    matches!(
        err,
        OathError::UnauthorizedActionType | OathError::RecipientNotAllowed
    )
}
