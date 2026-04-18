use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::constants::{
    MAX_ALLOWED_ACTION_TYPES, MAX_ALLOWED_RECIPIENTS, MAX_PURPOSE_URI_LEN, OATH_SEED, VAULT_SEED,
};
use crate::errors::OathError;
use crate::events::OathCreated;
use crate::state::{ActionType, Oath, OathStatus};

/// Arguments for `create_oath`, packaged into a struct so instruction
/// introspection (and the generated IDL) stays clean.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateOathArgs {
    pub oath_id: u64,
    pub purpose_hash: [u8; 32],
    pub purpose_uri: String,
    pub spend_cap: u64,
    pub per_tx_cap: u64,
    pub stake_amount: u64,
    pub allowed_action_types: Vec<ActionType>,
    pub allowed_recipients: Vec<Pubkey>,
    pub allowed_domains_hash: [u8; 32],
    pub expiry: i64,
}

#[derive(Accounts)]
#[instruction(args: CreateOathArgs)]
pub struct CreateOath<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + Oath::INIT_SPACE,
        seeds = [
            OATH_SEED,
            user.key().as_ref(),
            agent.key().as_ref(),
            &args.oath_id.to_le_bytes(),
        ],
        bump,
    )]
    pub oath: Account<'info, Oath>,

    /// CHECK: System-owned PDA that holds the agent's staked lamports.
    /// We validate the derivation via `seeds` + `bump`; no data lives
    /// here.
    #[account(
        mut,
        seeds = [VAULT_SEED, oath.key().as_ref()],
        bump,
    )]
    pub stake_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateOath>, args: CreateOathArgs) -> Result<()> {
    require!(args.stake_amount > 0, OathError::ZeroStake);
    require!(args.spend_cap > 0, OathError::InvalidCaps);
    require!(
        args.per_tx_cap > 0 && args.per_tx_cap <= args.spend_cap,
        OathError::InvalidCaps
    );
    require!(
        args.purpose_uri.len() <= MAX_PURPOSE_URI_LEN,
        OathError::PurposeUriTooLong
    );
    require!(
        args.allowed_action_types.len() <= MAX_ALLOWED_ACTION_TYPES,
        OathError::TooManyActionTypes
    );
    require!(
        args.allowed_recipients.len() <= MAX_ALLOWED_RECIPIENTS,
        OathError::TooManyRecipients
    );

    let now = Clock::get()?.unix_timestamp;
    require!(args.expiry > now, OathError::ExpiryInPast);

    // Transfer the agent's stake into the vault PDA. System CPI: agent
    // signs as a regular keypair, vault is just a destination address.
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.agent.to_account_info(),
            to: ctx.accounts.stake_vault.to_account_info(),
        },
    );
    system_program::transfer(cpi_ctx, args.stake_amount)?;

    let oath = &mut ctx.accounts.oath;
    oath.user = ctx.accounts.user.key();
    oath.agent = ctx.accounts.agent.key();
    oath.oath_id = args.oath_id;
    oath.purpose_hash = args.purpose_hash;
    oath.purpose_uri = args.purpose_uri;
    oath.spend_cap = args.spend_cap;
    oath.spent = 0;
    oath.per_tx_cap = args.per_tx_cap;
    oath.stake_amount = args.stake_amount;
    oath.stake_vault = ctx.accounts.stake_vault.key();
    oath.allowed_action_types = args.allowed_action_types;
    oath.allowed_recipients = args.allowed_recipients;
    oath.allowed_domains_hash = args.allowed_domains_hash;
    oath.expiry = args.expiry;
    oath.created_at = now;
    oath.status = OathStatus::Active;
    oath.action_count = 0;
    oath.bump = ctx.bumps.oath;
    oath.vault_bump = ctx.bumps.stake_vault;

    emit!(OathCreated {
        oath: oath.key(),
        user: oath.user,
        agent: oath.agent,
        oath_id: oath.oath_id,
        spend_cap: oath.spend_cap,
        per_tx_cap: oath.per_tx_cap,
        stake_amount: oath.stake_amount,
        expiry: oath.expiry,
        purpose_hash: oath.purpose_hash,
    });

    Ok(())
}
