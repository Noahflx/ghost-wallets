# Ghost Wallet Smart Contract

This directory contains the Soroban smart contract for Ghost Wallets.

## Overview

The Ghost Wallet contract is a smart contract wallet that allows:
- Initialization with an owner address and recovery email
- Token withdrawals by the owner
- Ownership transfer
- Recovery mechanism using email verification

## Building

\`\`\`bash
chmod +x scripts/build-contract.sh
./scripts/build-contract.sh
\`\`\`

## Deploying

\`\`\`bash
chmod +x scripts/deploy-contract.sh
./scripts/deploy-contract.sh
\`\`\`

## Contract Functions

- `initialize(owner, recovery_email)` - Initialize a new ghost wallet
- `get_owner()` - Get the current owner address
- `get_recovery_email()` - Get the recovery email
- `transfer_ownership(new_owner)` - Transfer ownership to a new address
- `withdraw(token_address, amount, to)` - Withdraw tokens from the wallet
- `get_balance(token_address)` - Get balance of a specific token
- `recover_ownership(new_owner, recovery_signature)` - Recover wallet using email verification

## Testing

\`\`\`bash
cd contracts/ghost-wallet
cargo test
