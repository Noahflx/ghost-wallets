#!/bin/bash

set -e

echo "Deploying Ghost Wallet smart contract to Stellar testnet..."

# Network configuration
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
RPC_URL="https://soroban-testnet.stellar.org"

# Ensure the WASM exists
WASM_PATH="contracts/ghost-wallet/target/wasm32-unknown-unknown/release/ghost_wallet.optimized.wasm"
if [ ! -f "$WASM_PATH" ]; then
  echo "❌ Error: WASM file not found at $WASM_PATH"
  echo "Run ./scripts/build-contract.sh first."
  exit 1
fi

# Deploy the contract
CONTRACT_ID=$(soroban contract deploy \
  --wasm "$WASM_PATH" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  --source default 2>/dev/null)

if [ -z "$CONTRACT_ID" ]; then
  echo "❌ Error: Deployment failed. No contract ID returned."
  exit 1
fi

echo "✅ Contract deployed successfully!"
echo "Contract ID: $CONTRACT_ID"

# Write contract ID to .env.local
if grep -q "^GHOST_WALLET_CONTRACT_ID=" .env.local; then
  sed -i '' "s/^GHOST_WALLET_CONTRACT_ID=.*/GHOST_WALLET_CONTRACT_ID=$CONTRACT_ID/" .env.local
else
  echo "GHOST_WALLET_CONTRACT_ID=$CONTRACT_ID" >> .env.local
fi

echo "📝 Contract ID saved to .env.local"
