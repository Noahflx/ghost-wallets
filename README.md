# Ghost Wallets

Send crypto to anyone via email — no wallet required.

## Overview

Ghost Wallets is a payment system built on Stellar that allows you to send USDC, PYUSD, or XLM to anyone using just their email address. Recipients receive a magic link to claim their funds without needing a crypto wallet upfront.

## Features

- **Magic Link Payments**: Send crypto via email
- **Smart Contract Wallets**: Secure Soroban smart contracts for each payment
- **No Wallet Required**: Recipients can claim funds with just a magic link
- **Multiple Tokens**: Support for USDC, PYUSD, and XLM
- **Recovery System**: Email-based wallet recovery mechanism

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

Ghost Wallets now ships with two safe execution paths so you can demo end-to-end flows without risking real funds:

- **Simulation (default)** – Payments are mocked locally, transaction hashes are deterministically generated, and the dashboard clearly labels activity as “Simulated.” Use this for fast iteration or when you cannot fund a treasury account. A JSON snapshot is persisted to `data/magic-links.json` so links survive server restarts during judging.
- **Stellar testnet** – Set `STELLAR_PAYMENT_MODE=testnet` and provide `STELLAR_TREASURY_SECRET_KEY`. Transfers are submitted to Soroban RPC, explorer links are surfaced in the UI/email, and recipients can verify hashes on Stellar Expert—still using play money from Friendbot. Enable `STELLAR_PREFUND_WALLETS=true` to auto-call Friendbot for each generated ghost wallet so the dashboard shows a real transaction hash before the claim step.

When testnet submission fails (e.g., RPC outage or unsupported asset), the API gracefully falls back to simulation and records the attempt so judges can continue the journey.

### Reliability & recovery story

- Magic links and transaction metadata are persisted to JSON snapshots in `data/` so a server restart during demo day does not invalidate issued links.
- Tokens and claim state are hashed before persistence. The on-disk format makes it trivial to swap in Postgres/Supabase after the hackathon—see `lib/storage/filesystem.ts` for the adapter layer.
- Rate limits protect the `/api/send`, `/api/verify-magic-link`, and `/api/claim-wallet` endpoints from brute force attempts while still permitting smooth judge walkthroughs.

**Launch checklist** (post-hackathon): move the persistence adapter to Postgres, wire the `claim-wallet` route to the Soroban contract’s `transfer_ownership`, add background jobs to prune expired links, and ship automated compliance reporting.

### Security & compliance guardrails

- Email addresses are validated server-side, amounts are clamped via `NEXT_PUBLIC_MAX_SEND_AMOUNT`, and only a curated currency list (USDC, PYUSD, XLM) is accepted.
- Claim flows rate-limit by IP, require a plausible Stellar address, and surface transaction hashes or explorer links in the dashboard for auditability.
- Email receipts disclose whether a payment was simulated or executed on testnet and remind recipients about anti-phishing controls.

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

## Smart Contract

The Ghost Wallet smart contract provides:

- Wallet initialization with owner and recovery email
- Token withdrawal functionality
- Ownership transfer
- Balance checking
- Email-based recovery mechanism

See [contracts/README.md](contracts/README.md) for more details.

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
- `STELLAR_PAYMENT_MODE` - Either `simulation` (default) or `testnet`
- `STELLAR_TREASURY_SECRET_KEY` - Required when `STELLAR_PAYMENT_MODE=testnet`
- `NEXT_PUBLIC_MAX_SEND_AMOUNT` - Upper bound enforced by the `/api/send` route (defaults to 10,000)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
