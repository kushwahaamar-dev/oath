use anchor_lang::prelude::*;
use anchor_lang::solana_program::ed25519_program;
use anchor_lang::solana_program::sysvar::instructions::{
    load_instruction_at_checked, ID as INSTRUCTIONS_SYSVAR_ID,
};

use crate::constants::{oracle_pubkey, VAULT_SEED};
use crate::errors::OathError;
use crate::events::OathSlashed;
use crate::state::{Oath, OathStatus};
use crate::vault;

/// A slash is authorized by an Ed25519 signature from the oracle
/// over the bytes `oath_pda || violation_tx_sig`. The caller bundles
/// an Ed25519 precompile instruction as ix[0] of the transaction; our
/// handler introspects it via the instructions sysvar.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SlashArgs {
    pub violation_tx_sig: [u8; 64],
}

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(mut)]
    pub slasher: Signer<'info>,

    #[account(
        mut,
        has_one = user @ OathError::OathNotActive,
    )]
    pub oath: Account<'info, Oath>,

    /// CHECK: stake destination; pubkey pinned via `has_one = user`.
    #[account(mut)]
    pub user: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, oath.key().as_ref()],
        bump = oath.vault_bump,
    )]
    pub stake_vault: SystemAccount<'info>,

    /// CHECK: the instructions sysvar. Address constraint ensures the
    /// caller cannot substitute a crafted account.
    #[account(address = INSTRUCTIONS_SYSVAR_ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Slash>, args: SlashArgs) -> Result<()> {
    let oath = &mut ctx.accounts.oath;
    require!(oath.status == OathStatus::Active, OathError::OathNotActive);

    // Expected message = oath_pda (32) || violation_tx_sig (64).
    let mut expected_msg = [0u8; 96];
    expected_msg[..32].copy_from_slice(&oath.key().to_bytes());
    expected_msg[32..].copy_from_slice(&args.violation_tx_sig);

    verify_oracle_attestation(&ctx.accounts.instructions_sysvar, &expected_msg)?;

    let to_user = ctx.accounts.stake_vault.lamports();
    let oath_key = oath.key();
    let vault_bump = oath.vault_bump;

    vault::drain_vault(
        &ctx.accounts.stake_vault,
        &ctx.accounts.user.to_account_info(),
        &ctx.accounts.system_program,
        to_user,
        &oath_key,
        vault_bump,
    )?;

    oath.status = OathStatus::Slashed;

    emit!(OathSlashed {
        oath: oath.key(),
        slasher: ctx.accounts.slasher.key(),
        transferred_to_user: to_user,
    });

    Ok(())
}

/// Verify that instruction 0 in this transaction is an Ed25519
/// precompile verifying the oracle's signature over `expected_msg`.
///
/// The Ed25519 precompile instruction data layout (single signature,
/// everything inline):
/// ```text
/// byte 0:       num_signatures     (= 1)
/// byte 1:       padding
/// bytes 2..16:  Ed25519SignatureOffsets struct
///   - signature_offset:              u16 little-endian
///   - signature_instruction_index:   u16 (0xFFFF = this ix)
///   - public_key_offset:             u16
///   - public_key_instruction_index:  u16
///   - message_data_offset:           u16
///   - message_data_size:             u16
///   - message_instruction_index:     u16
/// remainder:    signature | pubkey | message bytes at the listed
///               offsets (layout is not fixed; we follow offsets).
/// ```
fn verify_oracle_attestation(
    instructions_sysvar: &UncheckedAccount,
    expected_msg: &[u8; 96],
) -> Result<()> {
    let ix = load_instruction_at_checked(0, &instructions_sysvar.to_account_info())
        .map_err(|_| error!(OathError::InvalidSlashProof))?;

    require_keys_eq!(
        ix.program_id,
        ed25519_program::ID,
        OathError::InvalidSlashProof
    );

    let data = &ix.data;
    require!(data.len() >= 16, OathError::InvalidSlashProof);
    require!(data[0] == 1, OathError::InvalidSlashProof);

    // Parse the 14-byte SignatureOffsets struct starting at byte 2.
    let read_u16 = |off: usize| u16::from_le_bytes([data[off], data[off + 1]]) as usize;
    let sig_offset = read_u16(2);
    let sig_ix_index = read_u16(4);
    let pk_offset = read_u16(6);
    let pk_ix_index = read_u16(8);
    let msg_offset = read_u16(10);
    let msg_size = read_u16(12);
    let msg_ix_index = read_u16(14);

    // All three components must be inline in this precompile's data.
    // 0xFFFF (u16::MAX) signals "this instruction's data".
    require!(
        sig_ix_index == u16::MAX as usize
            && pk_ix_index == u16::MAX as usize
            && msg_ix_index == u16::MAX as usize,
        OathError::InvalidSlashProof
    );

    // Bounds-check all three slices before reading.
    require!(
        pk_offset + 32 <= data.len()
            && sig_offset + 64 <= data.len()
            && msg_offset + msg_size <= data.len(),
        OathError::InvalidSlashProof
    );

    // Oracle pubkey must be the one this program trusts.
    let signer_pk = &data[pk_offset..pk_offset + 32];
    require!(
        signer_pk == oracle_pubkey().to_bytes(),
        OathError::InvalidSlashProof
    );

    // Message must match exactly.
    require!(msg_size == expected_msg.len(), OathError::InvalidSlashProof);
    let msg = &data[msg_offset..msg_offset + msg_size];
    require!(msg == expected_msg, OathError::InvalidSlashProof);

    Ok(())
}
