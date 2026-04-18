use anchor_lang::prelude::*;

use crate::errors::OathError;
use crate::events::ActionRecorded;
use crate::state::{ActionType, Oath, OathStatus};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RecordActionArgs {
    pub action_type: ActionType,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[derive(Accounts)]
pub struct RecordAction<'info> {
    pub agent: Signer<'info>,

    #[account(
        mut,
        has_one = agent @ OathError::OathNotActive,
    )]
    pub oath: Account<'info, Oath>,
}

pub fn handler(ctx: Context<RecordAction>, args: RecordActionArgs) -> Result<()> {
    let oath = &mut ctx.accounts.oath;
    let now = Clock::get()?.unix_timestamp;

    // Status + expiry gates come first — they're the cheapest to fail
    // fast and also the most common cause of expected reverts.
    require!(oath.status == OathStatus::Active, OathError::OathNotActive);
    require!(now < oath.expiry, OathError::OathExpired);

    // Scope checks.
    require!(
        oath.allowed_action_types.contains(&args.action_type),
        OathError::UnauthorizedActionType
    );
    require!(
        oath.allowed_recipients.contains(&args.recipient),
        OathError::RecipientNotAllowed
    );

    // Cap checks. Per-tx cap first (cheaper to evaluate), then
    // cumulative.
    require!(args.amount <= oath.per_tx_cap, OathError::PerTxCapExceeded);
    let new_spent = oath
        .spent
        .checked_add(args.amount)
        .ok_or(OathError::MathOverflow)?;
    require!(new_spent <= oath.spend_cap, OathError::SpendCapExceeded);

    // INVARIANT: spent <= spend_cap. Enforced by the check above.
    oath.spent = new_spent;
    oath.action_count = oath
        .action_count
        .checked_add(1)
        .ok_or(OathError::MathOverflow)?;

    emit!(ActionRecorded {
        oath: oath.key(),
        seq: oath.action_count,
        action_type: args.action_type,
        recipient: args.recipient,
        amount: args.amount,
        spent_after: oath.spent,
    });

    Ok(())
}
