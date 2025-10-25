#!/bin/bash

# Deploy the Soroban smart contract to testnet
echo "Deploying Ghost Wallet smart contract to Stellar testnet..."

# Set network
NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"

# Deploy contract
CONTRACT_ID=$(soroban contract deploy \
  --wasm contracts/ghost-wallet/target/wasm32-unknown-unknown/release/ghost_wallet.optimized.wasm \
  --source-account default \
  --network $NETWORK \
  --rpc-url $RPC_URL)

echo "Contract deployed successfully!"
echo "Contract ID: $CONTRACT_ID"

# Save contract ID to .env file
echo "GHOST_WALLET_CONTRACT_ID=$CONTRACT_ID" >> .env.local

echo "Contract ID saved to .env.local"
