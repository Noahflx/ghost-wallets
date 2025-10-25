#!/bin/bash

# Build the Soroban smart contract
echo "Building Ghost Wallet smart contract..."

cd contracts/ghost-wallet

# Build the contract
cargo build --target wasm32-unknown-unknown --release

# Optimize the WASM binary
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/ghost_wallet.wasm

echo "Contract built successfully!"
echo "Optimized WASM: target/wasm32-unknown-unknown/release/ghost_wallet.optimized.wasm"
