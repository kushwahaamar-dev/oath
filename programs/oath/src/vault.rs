use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::constants::VAULT_SEED;

/// Move `amount` lamports out of the oath's stake vault PDA (owned by
/// the System Program) into `destination`, signed by the vault PDA.
///
/// Using `invoke_signed(system_program::transfer)` is the canonical
/// way to spend from a system-owned PDA: the runtime permits the
/// transfer because we supply the vault's PDA seeds and the vault
/// holds zero bytes of data.
pub fn drain_vault<'info>(
    vault: &SystemAccount<'info>,
    destination: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
    amount: u64,
    oath_key: &Pubkey,
    vault_bump: u8,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }

    let oath_key_bytes = oath_key.to_bytes();
    let bump_slice = [vault_bump];
    let seeds: [&[u8]; 3] = [VAULT_SEED, oath_key_bytes.as_ref(), bump_slice.as_ref()];
    let signer_seeds: &[&[&[u8]]] = &[&seeds];

    let cpi_ctx = CpiContext::new_with_signer(
        system_program.to_account_info(),
        system_program::Transfer {
            from: vault.to_account_info(),
            to: destination.to_account_info(),
        },
        signer_seeds,
    );
    system_program::transfer(cpi_ctx, amount)
}
