use anchor_lang::prelude::*;

use crate::constants::VAULT_SEED;
use crate::errors::OathError;
use crate::events::OathRevoked;
use crate::state::{Oath, OathStatus};
use crate::vault;

#[derive(Accounts)]
pub struct RevokeOath<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        has_one = user @ OathError::OathNotActive,
        has_one = agent @ OathError::OathNotActive,
    )]
    pub oath: Account<'info, Oath>,

    /// CHECK: receives the returned stake; pubkey pinned via
    /// `has_one = agent` on the oath account.
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

pub fn handler(ctx: Context<RevokeOath>) -> Result<()> {
    let oath = &mut ctx.accounts.oath;
    require!(oath.status == OathStatus::Active, OathError::OathNotActive);

    let to_return = ctx.accounts.stake_vault.lamports();
    let oath_key = oath.key();
    let vault_bump = oath.vault_bump;

    vault::drain_vault(
        &ctx.accounts.stake_vault,
        &ctx.accounts.agent.to_account_info(),
        &ctx.accounts.system_program,
        to_return,
        &oath_key,
        vault_bump,
    )?;

    // INVARIANT: status transitions are one-way. We set the terminal
    // state after the transfer so a failed CPI rolls everything back.
    oath.status = OathStatus::Revoked;

    emit!(OathRevoked {
        oath: oath.key(),
        user: oath.user,
        returned_to_agent: to_return,
    });

    Ok(())
}
