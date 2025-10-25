import { Keypair, SorobanRpc, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk"
import { createHash, randomBytes } from "crypto"
import {
  createMagicLinkUrl,
  generateMagicLinkToken,
  hashToken,
  isMagicLinkExpired,
} from "./magic-link"
import { markTransactionClaimed } from "./transactions"
import { readJsonFile, writeJsonFile } from "./storage/filesystem"
import type { PaymentMode } from "./types/payments"
import type { PaymentMetadata } from "./types/payments"

interface MagicLinkRecord {
  hashedToken: string
  walletAddress: string
  walletSecret?: string
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
  fundingMode: PaymentMode
  explorerUrl?: string
  claimedBy?: string
}

const MAGIC_LINK_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAGIC_LINKS_FILENAME = "magic-links.json"

interface PersistedMagicLinkRecord
  extends Omit<MagicLinkRecord, "expiresAt" | "redeemedAt"> {
  expiresAt: string
  redeemedAt?: string
}

function hydrateMagicLinkStore(): Map<string, MagicLinkRecord> {
  const persisted = readJsonFile<Record<string, PersistedMagicLinkRecord>>(MAGIC_LINKS_FILENAME, {})
  const store = new Map<string, MagicLinkRecord>()

  for (const [key, record] of Object.entries(persisted)) {
    store.set(key, {
      ...record,
      expiresAt: new Date(record.expiresAt),
      redeemedAt: record.redeemedAt ? new Date(record.redeemedAt) : undefined,
      fundingMode: record.fundingMode ?? "simulation",
    })
  }

  return store
}

const globalStores = globalThis as typeof globalThis & {
  __magicLinkStore?: Map<string, MagicLinkRecord>
}

const magicLinkStore =
  globalStores.__magicLinkStore ?? hydrateMagicLinkStore()

if (!globalStores.__magicLinkStore) {
  globalStores.__magicLinkStore = magicLinkStore
}

function persistMagicLinkStore() {
  const serializable: Record<string, PersistedMagicLinkRecord> = {}

  for (const [key, record] of magicLinkStore.entries()) {
    serializable[key] = {
      ...record,
      expiresAt: record.expiresAt.toISOString(),
      redeemedAt: record.redeemedAt ? record.redeemedAt.toISOString() : undefined,
    }
  }

  writeJsonFile(MAGIC_LINKS_FILENAME, serializable)
}

const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"
const NETWORK_PASSPHRASE = Networks.TESTNET
const PAYMENT_MODE =
  (process.env.STELLAR_PAYMENT_MODE?.toLowerCase() as PaymentMode | undefined) || "simulation"
const PREFUND_WITH_FRIENDBOT = process.env.STELLAR_PREFUND_WALLETS === "true"
const FRIENDBOT_URL_BASE = (process.env.STELLAR_FRIENDBOT_URL || "https://friendbot.stellar.org").replace(/\/$/, "")

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

export interface PrefundMetadata {
  txHash: string
  ledger?: number
  fundedAt: string
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

interface FriendbotSuccessResponse {
  hash?: string
  ledger?: number
}

const friendbotCache = new Map<string, PrefundMetadata>()

async function prefundWithFriendbot(publicKey: string): Promise<PrefundMetadata | null> {
  const shouldPrefund = PAYMENT_MODE === "testnet" || PREFUND_WITH_FRIENDBOT

  if (!shouldPrefund) {
    return null
  }

  if (friendbotCache.has(publicKey)) {
    return friendbotCache.get(publicKey) ?? null
  }

  try {
    const response = await fetch(`${FRIENDBOT_URL_BASE}?addr=${encodeURIComponent(publicKey)}`)

    if (!response.ok) {
      console.warn(`Friendbot funding failed with status ${response.status}. Continuing without prefund.`)
      return null
    }

    const payload = (await response.json()) as FriendbotSuccessResponse | { error?: string }

    if (typeof (payload as FriendbotSuccessResponse).hash === "string") {
      const fundedAt = new Date().toISOString()
      const metadata: PrefundMetadata = {
        txHash: (payload as FriendbotSuccessResponse).hash!,
        ledger:
          typeof (payload as FriendbotSuccessResponse).ledger === "number"
            ? (payload as FriendbotSuccessResponse).ledger
            : undefined,
        fundedAt,
      }

      friendbotCache.set(publicKey, metadata)
      return metadata
    }

    console.warn("Friendbot response did not contain a transaction hash. Payload:", payload)
  } catch (error) {
    console.warn("Friendbot funding attempt failed. Proceeding without prefund.", error)
  }

  return null
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
  prefund?: PrefundMetadata | null
}

/**
 * Create a wallet, deploy its contract, and return the relevant metadata.
 */
export async function createWallet(recipient: string): Promise<CreatedWallet> {
  const { publicKey, secretKey } = createWalletKeypair()
  const contractAddress = await deployGhostWallet(publicKey, recipient)
  const prefund = await prefundWithFriendbot(publicKey)

  return {
    address: publicKey,
    secretKey,
    contractAddress,
    prefund,
  }
}

/**
 * Simulate funding a ghost wallet by returning a fake transaction hash after a short delay.
 * This keeps the product flow and notifications intact without submitting a real Stellar payment.
 */
export interface PaymentResult extends PaymentMetadata {
  txHash: string
}

function buildExplorerUrl(txHash: string, mode: PaymentMode): string | undefined {
  if (mode === "testnet") {
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`
  }

  return undefined
}

function simulatePayment(
  walletAddress: string,
  amount: string,
  currency: string,
): PaymentResult {
  const simulatedHash = createHash("sha256")
    .update(walletAddress)
    .update(":")
    .update(amount)
    .update(":")
    .update(currency)
    .update(":")
    .update(Date.now().toString())
    .update(randomBytes(16))
    .digest("hex")

  return {
    txHash: simulatedHash,
    mode: "simulation",
    isSimulated: true,
    explorerUrl: undefined,
  }
}

function simulateClaimTransfer(
  sourceWallet: string,
  destinationWallet: string,
  amount: string,
  currency: string,
): string {
  return createHash("sha256")
    .update("claim")
    .update(":")
    .update(sourceWallet)
    .update(":")
    .update(destinationWallet)
    .update(":")
    .update(amount)
    .update(":")
    .update(currency)
    .update(":")
    .update(Date.now().toString())
    .update(randomBytes(16))
    .digest("hex")
}

export async function sendPayment(
  walletAddress: string,
  amount: string,
  currency: string,
): Promise<PaymentResult> {
  if (PAYMENT_MODE === "testnet") {
    const treasurySecret = process.env.STELLAR_TREASURY_SECRET_KEY

    if (!treasurySecret) {
      console.warn(
        "STELLAR_PAYMENT_MODE is set to testnet but STELLAR_TREASURY_SECRET_KEY is not configured. Falling back to simulation.",
      )
    } else if (currency !== "XLM") {
      console.warn(
        `Testnet mode currently supports XLM payments only. Received ${currency}. Falling back to simulation.`,
      )
    } else {
      try {
        const txHash = await sendToGhostWallet(treasurySecret, walletAddress, amount, currency)
        return {
          txHash,
          mode: "testnet",
          isSimulated: false,
          explorerUrl: buildExplorerUrl(txHash, "testnet"),
        }
      } catch (error) {
        console.error("Failed to submit payment on the Stellar testnet. Falling back to simulation.", error)
      }
    }
  }

  // Simulate a short processing delay so the flow appears realistic
  await new Promise((resolve) => setTimeout(resolve, 500))

  return simulatePayment(walletAddress, amount, currency)
}

/**
 * Generate a magic link for the recipient and store it in-memory until it is claimed or expires.
 */
interface MagicLinkOptions {
  contractAddress?: string
  senderName?: string
  fundingMode?: PaymentMode
  explorerUrl?: string
}

export interface GeneratedMagicLink {
  url: string
  token: string
  hashedToken: string
  expiresAt: string
}

export async function generateMagicLink(
  recipient: string,
  wallet: Pick<CreatedWallet, "address" | "secretKey">,
  amount: string,
  currency: string,
  fundingTxHash?: string,
  options: MagicLinkOptions = {},
): Promise<GeneratedMagicLink> {
  const token = generateMagicLinkToken()
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRATION_MS)

  const fundingMode = options.fundingMode ?? PAYMENT_MODE
  const walletAddress = wallet.address
  const walletSecret = wallet.secretKey

  magicLinkStore.set(hashedToken, {
    hashedToken,
    walletAddress,
    walletSecret,
    recipient,
    amount,
    currency,
    expiresAt,
    redeemed: false,
    fundingTxHash,
    contractAddress: options.contractAddress,
    senderName: options.senderName,
    magicLinkToken: token,
    fundingMode,
    explorerUrl: options.explorerUrl,
  })

  persistMagicLinkStore()

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
  fundingMode: PaymentMode
  explorerUrl?: string
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
    persistMagicLinkStore()
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
    fundingMode: record.fundingMode,
    explorerUrl: record.explorerUrl,
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
  fundingMode: PaymentMode
  explorerUrl?: string
  claimedBy?: string
}

export async function claimFunds(token: string, destinationAddress?: string): Promise<ClaimFundsResult> {
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

  const trimmedDestination = destinationAddress?.trim()
  const claimDestination = trimmedDestination && trimmedDestination.length > 0 ? trimmedDestination : record.walletAddress

  let claimTxHash: string
  let explorerUrl = record.explorerUrl

  if (record.fundingMode === "testnet") {
    if (!record.walletSecret) {
      throw new Error("Unable to access the temporary wallet required to complete this claim")
    }

    try {
      claimTxHash = await sendToGhostWallet(record.walletSecret, claimDestination, record.amount, record.currency)
      explorerUrl = buildExplorerUrl(claimTxHash, "testnet")
    } catch (error) {
      console.error("Failed to transfer funds from ghost wallet:", error)
      throw new Error("Failed to transfer funds to the provided Stellar address")
    }
  } else {
    claimTxHash = simulateClaimTransfer(record.walletAddress, claimDestination, record.amount, record.currency)
  }

  record.redeemed = true
  record.redeemedAt = new Date()
  record.claimedBy = claimDestination
  magicLinkStore.set(hashedToken, record)
  persistMagicLinkStore()

  markTransactionClaimed(hashedToken, claimTxHash, claimDestination)

  return {
    txHash: claimTxHash,
    walletAddress: record.walletAddress,
    amount: record.amount,
    currency: record.currency,
    recipient: record.recipient,
    contractAddress: record.contractAddress,
    fundingMode: record.fundingMode,
    explorerUrl,
    claimedBy: claimDestination,
  }
}
