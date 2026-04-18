#!/usr/bin/env bash
# Deploy the Oath program to Solana devnet.
#
# Prereqs:
#   - ~4 SOL on the deployer keypair (keys/deployer.json).
#     The public devnet faucet is aggressively rate-limited; get
#     devnet SOL from https://faucet.solana.com (web UI, 1–2 SOL per
#     request) or any Helius/QuickNode devnet faucet with an API key.
#   - Anchor 0.31.1 and Agave CLI ≥ 1.18 on PATH.
#
# After a successful deploy, this script prints the program ID so you
# can drop it into `web/.env.local` as NEXT_PUBLIC_OATH_PROGRAM_ID.

set -euo pipefail

cd "$(dirname "$0")/.."

DEPLOYER="keys/deployer.json"

if [[ ! -f "$DEPLOYER" ]]; then
  echo "Missing $DEPLOYER — run solana-keygen new --outfile $DEPLOYER" >&2
  exit 1
fi

BALANCE=$(solana balance --url devnet --keypair "$DEPLOYER" | awk '{print $1}')
REQUIRED=4.0
if awk "BEGIN {exit !($BALANCE < $REQUIRED)}"; then
  echo "Deployer balance $BALANCE SOL is below required $REQUIRED SOL." >&2
  echo "Fund $(solana-keygen pubkey $DEPLOYER) from https://faucet.solana.com" >&2
  exit 1
fi

anchor build
anchor deploy \
  --provider.cluster devnet \
  --provider.wallet "$DEPLOYER"

PROGRAM_ID=$(solana address -k target/deploy/oath-keypair.json)
echo ""
echo "Deployed.  Program ID: $PROGRAM_ID"
echo "Update web/.env.local:"
echo "  NEXT_PUBLIC_OATH_PROGRAM_ID=$PROGRAM_ID"
