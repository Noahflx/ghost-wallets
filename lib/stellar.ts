import { Keypair, SorobanRpc, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk"
import { createHash, randomBytes } from "crypto"
import { execFile } from "child_process"
import { promisify } from "util"
import { access } from "fs/promises"
import {
  createMagicLinkUrl,
  generateMagicLinkToken,
  hashToken,
  isMagicLinkExpired,
} from "./magic-link"
import { markTransactionClaimed, recordTransaction } from "./transactions"
import { readJsonFile, writeJsonFile } from "./storage/filesystem"
import type { PaymentMode } from "./types/payments"
import type { PaymentMetadata } from "./types/payments"
import { sendNotification } from "./notifications"

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
  message?: string
  magicLinkToken: string
  redeemedAt?: Date
  fundingMode: PaymentMode
  explorerUrl?: string
  claimedBy?: string
  forwardedTo?: string[]
}

const execFileAsync = promisify(execFile)

const MAGIC_LINK_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAGIC_LINKS_FILENAME = "magic-links.json"

const DEFAULT_TESTNET_RPC_URL = "https://soroban-testnet.stellar.org"
const DEFAULT_SANDBOX_RPC_URL = "http://localhost:8000/soroban/rpc"
const DEFAULT_SANDBOX_FRIENDBOT_URL = "http://localhost:8000/friendbot"
const SANDBOX_NETWORK_PASSPHRASE = "Standalone Network ; February 2017"

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

const PAYMENT_MODE =
  (process.env.STELLAR_PAYMENT_MODE?.toLowerCase() as PaymentMode | undefined) || "simulation"
const RPC_URL =
  process.env.STELLAR_RPC_URL ||
  (PAYMENT_MODE === "sandbox" ? DEFAULT_SANDBOX_RPC_URL : DEFAULT_TESTNET_RPC_URL)
const NETWORK_PASSPHRASE = PAYMENT_MODE === "sandbox" ? SANDBOX_NETWORK_PASSPHRASE : Networks.TESTNET
const PREFUND_WITH_FRIENDBOT = process.env.STELLAR_PREFUND_WALLETS === "true"
const FRIENDBOT_URL_BASE = (
  process.env.STELLAR_FRIENDBOT_URL ||
  (PAYMENT_MODE === "sandbox" ? DEFAULT_SANDBOX_FRIENDBOT_URL : "https://friendbot.stellar.org")
).replace(/\/$/, "")
const SOROBAN_CLI = process.env.SOROBAN_CLI_PATH || "soroban"
const SANDBOX_IDENTITY = process.env.SOROBAN_SANDBOX_IDENTITY || "default"
const SANDBOX_WASM_PATH =
  process.env.GHOST_WALLET_WASM_PATH ||
  "contracts/ghost-wallet/target/wasm32-unknown-unknown/release/ghost_wallet.optimized.wasm"

let cachedServer: SorobanRpc.Server | null | undefined

const CONTRACT_ID_REGEX = /C[0-9A-Z]{55}/

async function runSorobanCommand(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(SOROBAN_CLI, args, {
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  })

  return stdout.trim()
}

function parseContractId(output: string): string | null {
  const match = output.match(CONTRACT_ID_REGEX)
  return match ? match[0] : null
}

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
  const fallbackContractId =
    process.env.GHOST_WALLET_CONTRACT_ID || "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"

  if (PAYMENT_MODE !== "sandbox") {
    return fallbackContractId
  }

  try {
    await access(SANDBOX_WASM_PATH)
  } catch (error) {
    console.warn(
      "Sandbox deployment requested but the Ghost Wallet WASM was not found at",
      SANDBOX_WASM_PATH,
      "- falling back to the configured contract id.",
      error,
    )
    return fallbackContractId
  }

  try {
    const deployOutput = await runSorobanCommand([
      "contract",
      "deploy",
      "--wasm",
      SANDBOX_WASM_PATH,
      "--rpc-url",
      RPC_URL,
      "--network-passphrase",
      NETWORK_PASSPHRASE,
      "--source",
      SANDBOX_IDENTITY,
    ])

    const deployedContractId = parseContractId(deployOutput) ?? deployOutput.split(/\s+/).pop() ?? ""

    if (!CONTRACT_ID_REGEX.test(deployedContractId)) {
      throw new Error(`Unable to determine contract id from Soroban CLI output: ${deployOutput}`)
    }

    await runSorobanCommand([
      "contract",
      "invoke",
      "--id",
      deployedContractId,
      "--rpc-url",
      RPC_URL,
      "--network-passphrase",
      NETWORK_PASSPHRASE,
      "--source",
      SANDBOX_IDENTITY,
      "--fn",
      "initialize",
      "--",
      "--owner",
      ownerPublicKey,
      "--recovery_email",
      recoveryEmail,
    ])

    return deployedContractId
  } catch (error) {
    console.warn("Failed to deploy ghost wallet contract to the local sandbox. Using fallback contract id.", error)
    return fallbackContractId
  }
}

interface FriendbotSuccessResponse {
  hash?: string
  ledger?: number
}

const friendbotCache = new Map<string, PrefundMetadata>()

async function prefundWithFriendbot(publicKey: string): Promise<PrefundMetadata | null> {
  const shouldPrefund =
    PAYMENT_MODE === "testnet" || PAYMENT_MODE === "sandbox" || PREFUND_WITH_FRIENDBOT

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
  if (PAYMENT_MODE === "testnet" || PAYMENT_MODE === "sandbox") {
    const treasurySecret = process.env.STELLAR_TREASURY_SECRET_KEY
    const networkLabel = PAYMENT_MODE === "testnet" ? "Stellar testnet" : "Soroban sandbox"

    if (!treasurySecret) {
      console.warn(
        `STELLAR_PAYMENT_MODE is set to ${PAYMENT_MODE} but STELLAR_TREASURY_SECRET_KEY is not configured. Falling back to simulation.`,
      )
    } else if (currency !== "XLM") {
      console.warn(
        `${networkLabel} mode currently supports XLM payments only. Received ${currency}. Falling back to simulation.`,
      )
    } else {
      try {
        const txHash = await sendToGhostWallet(treasurySecret, walletAddress, amount, currency)
        return {
          txHash,
          mode: PAYMENT_MODE,
          isSimulated: false,
          explorerUrl: buildExplorerUrl(txHash, PAYMENT_MODE),
        }
      } catch (error) {
        console.error(`Failed to submit payment on the ${networkLabel}. Falling back to simulation.`, error)
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
  message?: string
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
    message: options.message,
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
  message?: string
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
    message: record.message,
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

  if (record.fundingMode === "testnet" || record.fundingMode === "sandbox") {
    if (!record.walletSecret) {
      throw new Error("Unable to access the temporary wallet required to complete this claim")
    }

    try {
      claimTxHash = await sendToGhostWallet(record.walletSecret, claimDestination, record.amount, record.currency)
      explorerUrl = buildExplorerUrl(claimTxHash, record.fundingMode)
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

interface ForwardMagicLinkOptions {
  senderName?: string | null
  message?: string | null
}

export interface ForwardMagicLinkResult {
  amount: string
  currency: string
  recipient: string
  walletAddress: string
  contractAddress?: string
  transactionHash: string
  newMagicLinkUrl: string
  magicLinkTokenHash: string
  magicLinkExpiresAt: string
  paymentMode: PaymentMode
  explorerUrl?: string
  simulated: boolean
}

export async function forwardMagicLink(
  token: string,
  newRecipient: string,
  options: ForwardMagicLinkOptions = {},
): Promise<ForwardMagicLinkResult> {
  const hashedToken = hashToken(token)
  const record = magicLinkStore.get(hashedToken)

  if (!record) {
    throw new Error("This transfer could not be found")
  }

  if (record.redeemed) {
    throw new Error("This transfer has already been claimed or forwarded")
  }

  if (isMagicLinkExpired(record.expiresAt)) {
    magicLinkStore.delete(hashedToken)
    persistMagicLinkStore()
    throw new Error("This transfer has expired")
  }

  const sanitizedRecipient = newRecipient.trim().toLowerCase()

  if (!sanitizedRecipient || !sanitizedRecipient.includes("@")) {
    throw new Error("A valid email address is required")
  }

  const wallet = await createWallet(sanitizedRecipient)
  const paymentResult = await sendPayment(wallet.address, record.amount, record.currency)

  const senderName = options.senderName ?? record.senderName
  const message = options.message ?? record.message

  const magicLink = await generateMagicLink(
    sanitizedRecipient,
    wallet,
    record.amount,
    record.currency,
    paymentResult.txHash,
    {
      contractAddress: wallet.contractAddress,
      senderName: senderName ?? undefined,
      message: message ?? undefined,
      fundingMode: paymentResult.mode,
      explorerUrl: paymentResult.explorerUrl,
    },
  )

  const forwardedTo = new Set(record.forwardedTo ?? [])
  forwardedTo.add(sanitizedRecipient)

  record.redeemed = true
  record.redeemedAt = new Date()
  record.claimedBy = `forward:${sanitizedRecipient}`
  record.forwardedTo = Array.from(forwardedTo)
  magicLinkStore.set(hashedToken, record)
  persistMagicLinkStore()

  markTransactionClaimed(hashedToken, paymentResult.txHash, record.claimedBy)

  recordTransaction({
    recipient: sanitizedRecipient,
    amount: record.amount,
    currency: record.currency,
    walletAddress: wallet.address,
    transactionHash: paymentResult.txHash,
    magicLinkUrl: magicLink.url,
    magicLinkTokenHash: magicLink.hashedToken,
    senderName: senderName ?? undefined,
    message: message ?? undefined,
    fundingMode: paymentResult.mode,
    explorerUrl: paymentResult.explorerUrl,
    isSimulated: paymentResult.isSimulated,
    prefundTransactionHash: wallet.prefund?.txHash,
    prefundLedger: wallet.prefund?.ledger,
    prefundedAt: wallet.prefund?.fundedAt,
  })

  await sendNotification(sanitizedRecipient, magicLink.url, record.amount, record.currency, {
    senderName: senderName ?? undefined,
    expiresAt: magicLink.expiresAt,
    fundingMode: paymentResult.mode,
    explorerUrl: paymentResult.explorerUrl,
    message: message ?? undefined,
  })

  return {
    amount: record.amount,
    currency: record.currency,
    recipient: sanitizedRecipient,
    walletAddress: wallet.address,
    contractAddress: wallet.contractAddress,
    transactionHash: paymentResult.txHash,
    newMagicLinkUrl: magicLink.url,
    magicLinkTokenHash: magicLink.hashedToken,
    magicLinkExpiresAt: magicLink.expiresAt,
    paymentMode: paymentResult.mode,
    explorerUrl: paymentResult.explorerUrl,
    simulated: paymentResult.isSimulated,
  }
}
