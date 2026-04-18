use anchor_lang::prelude::*;

use crate::constants::VAULT_SEED;
use crate::errors::OathError;
use crate::events::OathExpiredEvent;
use crate::state::{Oath, OathStatus};
use crate::vault;

/// Keeper fee (in lamports) paid from the vault to whoever calls
/// `expire_oath`. Parameterized as a constant for v1; migrate to a
/// per-oath configurable fee once we have a fee-policy account.
pub const KEEPER_FEE_LAMPORTS: u64 = 0;

#[derive(Accounts)]
pub struct ExpireOath<'info> {
    #[account(mut)]
    pub keeper: Signer<'info>,

    #[account(
        mut,
        has_one = agent @ OathError::OathNotActive,
    )]
    pub oath: Account<'info, Oath>,

    /// CHECK: stake destination, pinned via `has_one = agent`.
    #[account(mut)]
    pub agent: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, oath.key().as_ref()],
        bump = oath.vault_bump,
    )]
    pub stake_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ExpireOath>) -> Result<()> {
    let oath = &mut ctx.accounts.oath;
    require!(oath.status == OathStatus::Active, OathError::OathNotActive);

    let now = Clock::get()?.unix_timestamp;
    require!(now >= oath.expiry, OathError::OathNotExpired);

    let vault_balance = ctx.accounts.stake_vault.lamports();
    let keeper_fee = KEEPER_FEE_LAMPORTS.min(vault_balance);
    let to_agent = vault_balance.saturating_sub(keeper_fee);

    let oath_key = oath.key();
    let vault_bump = oath.vault_bump;

    if to_agent > 0 {
        vault::drain_vault(
            &ctx.accounts.stake_vault,
            &ctx.accounts.agent.to_account_info(),
            &ctx.accounts.system_program,
            to_agent,
            &oath_key,
            vault_bump,
        )?;
    }

    if keeper_fee > 0 {
        vault::drain_vault(
            &ctx.accounts.stake_vault,
            &ctx.accounts.keeper.to_account_info(),
            &ctx.accounts.system_program,
            keeper_fee,
            &oath_key,
            vault_bump,
        )?;
    }

    oath.status = OathStatus::Expired;

    emit!(OathExpiredEvent {
        oath: oath.key(),
        returned_to_agent: to_agent,
        keeper_fee,
    });

    Ok(())
}
