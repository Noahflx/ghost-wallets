#!/bin/bash
set -euo pipefail

IDENTITY="${SOROBAN_SANDBOX_IDENTITY:-ghost-wallets}"
RPC_URL="${STELLAR_RPC_URL:-http://localhost:8000/soroban/rpc}"
FRIENDBOT_URL="${STELLAR_FRIENDBOT_URL:-http://localhost:8000/friendbot}"

if ! command -v soroban >/dev/null 2>&1; then
  echo "❌ The soroban CLI is required to run the local sandbox." >&2
  echo "   Install instructions: https://soroban.stellar.org/docs/getting-started/installation" >&2
  exit 1
fi

if ! soroban config identity ls | grep -q "^${IDENTITY}$"; then
  echo "🔑 Generating Soroban identity '${IDENTITY}' for sandbox usage..."
  soroban config identity generate "${IDENTITY}" >/dev/null
  echo "   Run 'soroban config identity show ${IDENTITY}' to copy the secret for STELLAR_TREASURY_SECRET_KEY."
fi

echo "🚀 Starting Soroban sandbox (press Ctrl+C to stop)"
echo "   RPC URL:    ${RPC_URL}"
echo "   Friendbot:  ${FRIENDBOT_URL}"
echo "   Identity:   ${IDENTITY}"

echo
soroban sandbox serve
