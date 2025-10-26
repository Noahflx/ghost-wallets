Live Demo

👉 https://ghost-wallets.vercel.app


Canva Pitch Deck:
https://www.canva.com/design/DAG22iyvGOQ/cSX7Vw5lphX2chanRIPPGw/edit?utm_content=DAG22iyvGOQ&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton


Loom (demo + technical walkthrough): https://www.loom.com/share/47db8be8ceb04e8a844587e44dabcf99


Ghost Wallets

Send crypto to anyone via email, no wallet required.
The simplest way to move money across borders using Stellar and Soroban.



Summary:

Email-based crypto payments built on Stellar.
Send USDC, PYUSD, or XLM via magic links—no wallet setup needed.



Full Description

Ghost Wallets removes one of crypto’s biggest barriers: wallet setup.
It lets anyone send digital assets like USDC, PYUSD, or XLM just by typing an email address.
The recipient gets a secure magic link that opens a temporary wallet created by a Soroban smart contract.
They can claim the funds instantly, without prior blockchain knowledge.

This approach solves two problems:

Ease of onboarding. Traditional crypto transfers require wallet creation, seed phrases, and complex UX. Ghost Wallets turns that into one click.

Cross-border access. Freelancers and small businesses can receive international payments without needing bank infrastructure.

The project uses Stellar’s testnet and Soroban smart contracts to demonstrate real asset transfer, recovery flows, and fiat-style withdrawal simulation through anchor stubs.



Technical Description

Smart Contracts: Built in Rust using Soroban SDK.
Each Ghost Wallet is a contract that stores the sender, recipient hash, asset type, and balance.
It enforces withdrawal rules and supports email-verified ownership transfer and recovery approvals.

Blockchain Layer: Runs on the Stellar Network, using the Soroban RPC for on-chain interactions.
In testnet and sandbox modes, payments appear in Stellar Expert with real hashes.
A simulation mode mimics full flows locally for judge demos without funding keys.



Frontend: Next.js 16 + React 19 + Tailwind CSS + shadcn/ui
The dashboard shows transaction history, status badges (“Simulated,” “Testnet”), and explorer links.



Email Layer: Nodemailer + Gmail SMTP
Sends magic links and claim confirmations.
Tokens are hashed and persisted in /data/magic-links.json for reliability.



APIs Used:

Stellar SDK (@stellar/stellar-sdk)

Soroban CLI / RPC for contract deployment & transaction submission

Gmail API (via SMTP)

Custom internal API routes (/api/send, /api/claim-wallet, etc.)

Unique Stellar Features leveraged:

Soroban Smart Contracts for wallet logic

Friendbot for auto-funding demo accounts

Anchors (simulated) to show fiat ramps

Testnet USDC issuer integration for realistic flows




Screenshots
<img width="1470" height="956" alt="Screenshot 2025-10-26 at 10 21 39 AM" src="https://github.com/user-attachments/assets/ecd9b25b-0e9a-446e-a8f5-cab1815a7ae2" />

<img width="1470" height="956" alt="Screenshot 2025-10-26 at 10 21 57 AM" src="https://github.com/user-attachments/assets/8982a29f-e0be-4061-bc3e-81075a166f3e" />



	
🎥 Demo Video


Walkthrough of sending, claiming, and recovery using testnet mode.

Technical Explanation (Loom): Watch here

Covers contract logic, repo structure, and how Stellar & Soroban power the system.



🔍 Deployed Smart Contract

Network: Stellar Testnet
Contract ID: CBREGY42MWMEQJCAOHSPKTOJEIUVPTAZIJ7HAN5JHYVZSZEGI7GI7TVE
Explorer: https://stellar.expert/explorer/testnet/contract/CBREGY42MWMEQJCAOHSPKTOJEIUVPTAZIJ7HAN5JHYVZSZEGI7GI7TVE

Repository Structure
contracts/ghost-wallet/     → Soroban smart contract (Rust)
lib/stellar.ts              → Stellar SDK utilities
lib/magic-link.ts           → Email magic link logic
app/api/                    → Next.js API routes
app/dashboard/              → User dashboard UI
scripts/                    → Build/deploy scripts
data/                       → Local persistence (demo JSON storage)

How the Smart Contract Works

Init: Creates a wallet with sender, recipient hash, asset type, and amount.

Store: Persists state in Soroban storage (owner, email hash, balance).

Claim: Recipient triggers claim via magic link → contract verifies hash → transfers ownership or allows withdrawal.

Recovery: Guardians can approve transfer to a new address in case of lost access.

Withdraw: Contract enforces allowlist and sends tokens to a verified address or anchor stub.

Contract source: contracts/ghost-wallet/src/lib.rs



How to Run Locally
git clone https://github.com/Noahflx/ghost-wallets
cd ghost-wallets
npm install
npm run dev




To run in sandbox mode:

export STELLAR_PAYMENT_MODE=sandbox
./scripts/run-sandbox.sh

AI Tools Used:

Claude, V0.dev, chatgpt, chatgpt codex.

License

MIT License © 2025 Noah Felix
