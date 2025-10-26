# Ghost Wallets

Send crypto to anyone via email — no wallet required.

## Overview

Ghost Wallets is a payment system built on Stellar that allows you to send USDC, PYUSD, or XLM to anyone using just their email address. Recipients receive a magic link to claim their funds without needing a crypto wallet upfront.

## Features

- **Magic Link Payments**: Send crypto via email
- **Smart Contract Wallets**: Secure Soroban smart contracts for each payment
- **No Wallet Required**: Recipients can claim funds with just a magic link
- **Multiple Tokens**: Support for USDC, PYUSD, and XLM
- **Recovery System**: Email-based wallet recovery mechanism with guardian approvals
- **Anchor Ramp Simulation**: Fiat off-ramp stubs wired for MoneyGram/Wyre style anchors

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Smart Contracts**: Soroban (Rust)
- **Blockchain**: Stellar Network
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- Rust and Cargo (for smart contract development)
- Stellar CLI (soroban-cli)

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Copy environment variables:

\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Configure environment variables in `.env.local` (all optional for simulated payments):

```env
# (Optional) Stellar treasury account secret key. Payments are simulated and this key is ignored.
STELLAR_TREASURY_SECRET_KEY="${YOUR_TREASURY_SECRET}"

# Auto-fund fresh demo wallets with Friendbot. Enable for cinematic testnet flows.
STELLAR_PREFUND_WALLETS="true"
# Override Friendbot endpoint if you run a local Soroban sandbox.
STELLAR_FRIENDBOT_URL="https://friendbot.stellar.org"

# Gmail credentials used for sending magic link emails
GMAIL_USER="noahef2030@gmail.com" # optional override
GMAIL_APP_PASSWORD="${YOUR_GMAIL_APP_PASSWORD}"

# Public URL for magic link generation (defaults to http://localhost:3000)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

5. Build and deploy the smart contract:

\`\`\`bash
chmod +x scripts/build-contract.sh
./scripts/build-contract.sh

chmod +x scripts/deploy-contract.sh
./scripts/deploy-contract.sh
\`\`\`

6. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

7. Open [http://localhost:3000](http://localhost:3000)

### Judge-friendly payment modes

Ghost Wallets now ships with three safe execution paths so you can demo end-to-end flows without risking real funds:

- **Simulation (default)** – Payments are mocked locally, transaction hashes are deterministically generated, and the dashboard clearly labels activity as “Simulated.” Use this for fast iteration or when you cannot fund a treasury account. A JSON snapshot is persisted to `data/magic-links.json` so links survive server restarts during judging.
- **Stellar testnet** – Set `STELLAR_PAYMENT_MODE=testnet` and provide `STELLAR_TREASURY_SECRET_KEY`. Transfers are submitted to Soroban RPC, explorer links are surfaced in the UI/email, and recipients can verify hashes on Stellar Expert—still using play money from Friendbot. Enable `STELLAR_PREFUND_WALLETS=true` to auto-call Friendbot for each generated ghost wallet so the dashboard shows a real transaction hash before the claim step.
- **Soroban sandbox** – Set `STELLAR_PAYMENT_MODE=sandbox` and run `./scripts/run-sandbox.sh` in a separate terminal. The backend will deploy a fresh contract per recipient with the Soroban CLI, fund wallets through the sandbox Friendbot, and submit payments to `http://localhost:8000/soroban/rpc`.

You can flip between demo mode and real submissions without redeploying by calling the runtime switch API:

- `GET /api/system/payment-mode` returns the active mode, RPC target, Friendbot URL, and whether a treasury key is configured.
- `POST /api/system/payment-mode` accepts `{ "mode": "simulation" | "testnet" | "sandbox" }` or `{ "demo": true | false }`. When you send `{ "demo": false }` the server verifies `STELLAR_TREASURY_SECRET_KEY` is available before enabling live transfers. Toggling automatically clears cached Friendbot responses and reinitializes the Soroban RPC client so the next transaction executes against the selected network.

When network submission fails (e.g., RPC outage or unsupported asset), the API gracefully falls back to simulation and records the attempt so judges can continue the journey.

### Local sandbox quickstart

1. Ensure the Soroban CLI is installed and available on your `PATH`.
2. Build the contract: `./scripts/build-contract.sh`.
3. In a dedicated terminal, run `./scripts/run-sandbox.sh` to start the local RPC server and Friendbot.
4. Export `STELLAR_PAYMENT_MODE=sandbox` (and optionally `STELLAR_TREASURY_SECRET_KEY`) when starting the Next.js dev server so payments route through the sandbox.

### Reliability & recovery story

- Magic links and transaction metadata are persisted to JSON snapshots in `data/` so a server restart during demo day does not invalidate issued links.
- Tokens and claim state are hashed before persistence. The on-disk format makes it trivial to swap in Postgres/Supabase after the hackathon—see `lib/storage/filesystem.ts` for the adapter layer.
- Rate limits protect the `/api/send`, `/api/verify-magic-link`, and `/api/claim-wallet` endpoints from brute force attempts while still permitting smooth judge walkthroughs.
- Every compliance-sensitive event writes to `data/transactions.json` and `data/claim-actions.json`, including simulated anchor withdrawals, on-chain recovery attempts, and guardian approvals, so the audit trail stays intact even in demo mode.

**Launch checklist** (post-hackathon): move the persistence adapter to Postgres, wire the `claim-wallet` route to the Soroban contract’s `transfer_ownership`, add background jobs to prune expired links, and ship automated compliance reporting.

### Security & compliance guardrails

- Email addresses are validated server-side, amounts are clamped via `NEXT_PUBLIC_MAX_SEND_AMOUNT`, and only a curated currency list (USDC, PYUSD, XLM) is accepted.
- Claim flows rate-limit by IP, require a plausible Stellar address, and surface transaction hashes or explorer links in the dashboard for auditability.
- Email receipts disclose whether a payment was simulated or executed on testnet and remind recipients about anti-phishing controls.
- Guardian-based recovery, contract forwarding, and anchor withdrawals all enforce the existing brute-force protections so the new endpoints remain safe for demos.

### Recipient experience showcase

Refer to `public/samples/magic-link-email.txt` for the plain-text email template a judge will receive. During demos, highlight the dashboard badges (“Simulated” vs “Testnet”) and the embedded explorer links so non-crypto natives can trust the flow without digging into tooling.

### Personas & roadmap

- **Primary persona:** cross-border payroll teams who need to pay contractors via email with minimal wallet setup friction.
- **Secondary persona:** compliance teams evaluating Stellar pilots and requiring a clear recovery story.
- **Next steps:** ship mobile-friendly claim pages, add configurable sending limits per organization, and expand asset support with contract-enforced allowlists.

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── claim/             # Magic link claim pages
│   └── dashboard/         # Dashboard page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── contracts/            # Soroban smart contracts
│   └── ghost-wallet/     # Ghost wallet contract
├── lib/                  # Utility libraries
│   ├── stellar.ts        # Stellar SDK utilities
│   ├── magic-link.ts     # Magic link generation
│   └── email.ts          # Gmail email sending
└── scripts/              # Build and deployment scripts
\`\`\`

## API Endpoints

- `POST /api/send` - Create a new payment and send a magic link email
- `POST /api/verify-magic-link` - Verify a magic link token
- `POST /api/claim-wallet` - Claim a wallet and transfer ownership
- `POST /api/claim/actions` - Capture recipient decisions (keep, withdraw, cash out, owner-transfer, on-chain forward)
- `POST /api/anchor/withdraw` - Simulate a MoneyGram/Wyre style fiat withdrawal via a Stellar anchor

## Smart Contract

The Ghost Wallet smart contract provides:

- Wallet initialization with owner and recovery email
- Token withdrawal functionality gated by a multi-asset allow list
- Ownership transfer, including email-verified social recovery with guardian approvals
- Balance checking
- Email-based recovery mechanism plus contract-level forwarding to another smart wallet

See [contracts/README.md](contracts/README.md) for more details.

## Testing

Run the lightweight backend integration tests (covering the new anchor stub and social recovery flow) with:

```bash
npm test
```

## Development

### Running Tests

Smart contract tests:

\`\`\`bash
cd contracts/ghost-wallet
cargo test
\`\`\`

### Building for Production

\`\`\`bash
npm run build
\`\`\`

## Deployment

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

## Environment Variables

- `STELLAR_RPC_URL` - Stellar RPC endpoint
- `GHOST_WALLET_CONTRACT_ID` - Deployed contract ID
- `NEXT_PUBLIC_APP_URL` - Application URL
- `STELLAR_PAYMENT_MODE` - Either `simulation` (default), `testnet`, or `sandbox`
- `STELLAR_TREASURY_SECRET_KEY` - Required when `STELLAR_PAYMENT_MODE` is `testnet` or `sandbox`
- `SOROBAN_SANDBOX_IDENTITY` - Soroban CLI identity used for sandbox deployments (defaults to `default`)
- `GHOST_WALLET_WASM_PATH` - Override the path to the compiled Ghost Wallet WASM when deploying in sandbox mode
- `NEXT_PUBLIC_MAX_SEND_AMOUNT` - Upper bound enforced by the `/api/send` route (defaults to 10,000)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
