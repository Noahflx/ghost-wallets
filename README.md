# Ghost Wallets

Send crypto to anyone via email or phone number - no wallet required.

## Overview

Ghost Wallets is a payment system built on Stellar that allows you to send USDC, PYUSD, or XLM to anyone using just their email or phone number. Recipients receive a magic link to claim their funds without needing a crypto wallet upfront.

## Features

- **Magic Link Payments**: Send crypto via email or phone number
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

4. Build and deploy the smart contract:

\`\`\`bash
chmod +x scripts/build-contract.sh
./scripts/build-contract.sh

chmod +x scripts/deploy-contract.sh
./scripts/deploy-contract.sh
\`\`\`

5. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

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
│   └── email.ts          # Email/SMS sending
└── scripts/              # Build and deployment scripts
\`\`\`

## API Endpoints

- `POST /api/send-payment` - Create a new payment and send magic link
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

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
