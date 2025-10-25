import { Keypair, SorobanRpc, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk"
import {
  createMagicLinkUrl,
  generateMagicLinkToken,
  hashToken,
  isMagicLinkExpired,
} from "./magic-link"
import { markTransactionClaimed } from "./transactions"

interface MagicLinkRecord {
  hashedToken: string
  walletAddress: string
  recipient: string
  amount: string
  currency: string
  expiresAt: Date
  redeemed: boolean
  fundingTxHash?: string
  contractAddress?: string
  senderName?: string
  magicLinkToken: string
  redeemedAt?: Date
}

const MAGIC_LINK_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const globalStores = globalThis as typeof globalThis & {
  __magicLinkStore?: Map<string, MagicLinkRecord>
}

const magicLinkStore =
  globalStores.__magicLinkStore ?? new Map<string, MagicLinkRecord>()

if (!globalStores.__magicLinkStore) {
  globalStores.__magicLinkStore = magicLinkStore
}

const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"
const NETWORK_PASSPHRASE = Networks.TESTNET

let cachedServer: SorobanRpc.Server | null | undefined

function getSorobanServer(): SorobanRpc.Server | null {
  if (cachedServer !== undefined) {
    return cachedServer
  }

  cachedServer = null

  try {
    if (!SorobanRpc || typeof SorobanRpc.Server !== "function") {
      console.warn("Soroban RPC client is unavailable. Falling back to mock behaviour.")
      return cachedServer
    }

    cachedServer = new SorobanRpc.Server(RPC_URL)
  } catch (error) {
    console.warn("Failed to initialize Soroban RPC client. Using mock behaviour instead.", error)
    cachedServer = null
  }

  return cachedServer
}

export interface WalletInfo {
  publicKey: string
  secretKey: string
  contractAddress: string
}

/**
 * Create a new Stellar keypair for a ghost wallet
 */
export function createWalletKeypair(): { publicKey: string; secretKey: string } {
  const keypair = Keypair.random()
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  }
}

/**
 * Deploy a new ghost wallet contract instance
 */
export async function deployGhostWallet(ownerPublicKey: string, recoveryEmail: string): Promise<string> {
  // In production, this would deploy a new contract instance
  // For now, we'll return a mock contract address
  const contractId = process.env.GHOST_WALLET_CONTRACT_ID || "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"

  // TODO: Implement actual contract deployment and initialization
  // This would involve:
  // 1. Deploying the contract WASM
  // 2. Calling initialize(owner, recovery_email)

  return contractId
}

/**
 * Get the balance of a token in a wallet
 */
export async function getWalletBalance(walletAddress: string, tokenAddress: string): Promise<string> {
  try {
    // TODO: Implement actual balance check via contract
    // For now, return mock balance
    return "0"
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    return "0"
  }
}

/**
 * Send tokens to a ghost wallet
 */
export async function sendToGhostWallet(
  fromSecretKey: string,
  toWalletAddress: string,
  amount: string,
  tokenAddress: string,
): Promise<string> {
  const server = getSorobanServer()

  if (!server) {
    throw new Error("Soroban RPC server is not available")
  }

  try {
    const sourceKeypair = Keypair.fromSecret(fromSecretKey)
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey())

    // Build transaction to send tokens
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: toWalletAddress,
          asset: Asset.native(), // TODO: Support custom tokens
          amount: amount,
        }),
      )
      .setTimeout(30)
      .build()

    transaction.sign(sourceKeypair)

    const response = await server.sendTransaction(transaction)
    return response.hash
  } catch (error) {
    console.error("Error sending to ghost wallet:", error)
    throw error
  }
}

export interface CreatedWallet {
  address: string
  secretKey: string
  contractAddress: string
}

/**
 * Create a wallet, deploy its contract, and return the relevant metadata.
 */
export async function createWallet(recipient: string): Promise<CreatedWallet> {
  const { publicKey, secretKey } = createWalletKeypair()
  const contractAddress = await deployGhostWallet(publicKey, recipient)

  return {
    address: publicKey,
    secretKey,
    contractAddress,
  }
}

/**
 * Send funds from the treasury wallet to a ghost wallet.
 * Falls back to a mocked hash when the treasury secret is not configured.
 */
export async function sendPayment(
  walletAddress: string,
  amount: string,
  currency: string,
): Promise<string> {
  const treasurySecret = process.env.STELLAR_TREASURY_SECRET_KEY

  if (!treasurySecret) {
    throw new Error("STELLAR_TREASURY_SECRET_KEY environment variable is required to send payments")
  }

  try {
    return await sendToGhostWallet(treasurySecret, walletAddress, amount, currency)
  } catch (error) {
    console.error("Error sending payment:", error)
    throw error
  }
}

/**
 * Generate a magic link for the recipient and store it in-memory until it is claimed or expires.
 */
interface MagicLinkOptions {
  contractAddress?: string
  senderName?: string
}

export interface GeneratedMagicLink {
  url: string
  token: string
  hashedToken: string
  expiresAt: string
}

export async function generateMagicLink(
  recipient: string,
  walletAddress: string,
  amount: string,
  currency: string,
  fundingTxHash?: string,
  options: MagicLinkOptions = {},
): Promise<GeneratedMagicLink> {
  const token = generateMagicLinkToken()
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRATION_MS)

  magicLinkStore.set(hashedToken, {
    hashedToken,
    walletAddress,
    recipient,
    amount,
    currency,
    expiresAt,
    redeemed: false,
    fundingTxHash,
    contractAddress: options.contractAddress,
    senderName: options.senderName,
    magicLinkToken: token,
  })

  return {
    url: createMagicLinkUrl(token),
    token,
    hashedToken,
    expiresAt: expiresAt.toISOString(),
  }
}

export interface MagicLinkVerificationResult {
  walletAddress: string
  amount: string
  currency: string
  recipient: string
  expiresAt: string
  fundingTxHash?: string
  contractAddress?: string
  senderName?: string
}

/**
 * Verify a magic link token and return details if it is still valid.
 */
export async function verifyMagicLink(
  token: string,
): Promise<MagicLinkVerificationResult | null> {
  const hashedToken = hashToken(token)
  const record = magicLinkStore.get(hashedToken)

  if (!record) {
    return null
  }

  if (record.redeemed) {
    return null
  }

  if (isMagicLinkExpired(record.expiresAt)) {
    magicLinkStore.delete(hashedToken)
    return null
  }

  return {
    walletAddress: record.walletAddress,
    amount: record.amount,
    currency: record.currency,
    recipient: record.recipient,
    expiresAt: record.expiresAt.toISOString(),
    fundingTxHash: record.fundingTxHash,
    contractAddress: record.contractAddress,
    senderName: record.senderName,
  }
}

/**
 * Claim funds associated with a magic link token.
 */
export interface ClaimFundsResult {
  txHash: string
  walletAddress: string
  amount: string
  currency: string
  recipient: string
  contractAddress?: string
}

export async function claimFunds(token: string): Promise<ClaimFundsResult> {
  const hashedToken = hashToken(token)
  const record = magicLinkStore.get(hashedToken)

  if (!record) {
    throw new Error("Invalid or unknown claim token")
  }

  if (record.redeemed) {
    throw new Error("Magic link has already been redeemed")
  }

  if (isMagicLinkExpired(record.expiresAt)) {
    magicLinkStore.delete(hashedToken)
    throw new Error("Magic link has expired")
  }

  record.redeemed = true
  record.redeemedAt = new Date()
  magicLinkStore.set(hashedToken, record)

  if (!record.fundingTxHash) {
    throw new Error("Funding transaction hash is not available for this claim")
  }

  markTransactionClaimed(hashedToken, record.fundingTxHash)

  return {
    txHash: record.fundingTxHash,
    walletAddress: record.walletAddress,
    amount: record.amount,
    currency: record.currency,
    recipient: record.recipient,
    contractAddress: record.contractAddress,
  }
}
