import {
  Keypair,
  SorobanRpc,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Networks,
  Server as SorobanServer,
} from "@stellar/stellar-sdk"
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
import { appendTransactionEvent, markTransactionClaimed } from "./transactions"
import { readJsonFile, writeJsonFile } from "./storage/filesystem"
import type { AssetType, PaymentMetadata, PaymentMode } from "./types/payments"
import { getPaymentMode, onPaymentModeChange } from "./config/payment-mode"

export interface SupportedAsset {
  code: string
  issuer?: string
  type: AssetType
  precision: number
  description: string
}

const DEFAULT_TESTNET_USDC_ISSUER =
  process.env.STELLAR_TESTNET_USDC_ISSUER || "GDUKMGUGDZQK6YH2V8YX1Z6KFLSDGQ7Y3TQF6A4O5QZVDGQFQ6VFS75Q"
const DEFAULT_TESTNET_PYUSD_ISSUER =
  process.env.STELLAR_TESTNET_PYUSD_ISSUER || "GDGU5OAPHNPU5UCLE5W7VJGSPB3C5GZ3H5CTM4D4DKRZ7L2ECYQKJJOB"

export const SUPPORTED_ASSETS: Record<string, SupportedAsset> = {
  XLM: {
    code: "XLM",
    type: "native",
    precision: 7,
    description: "Stellar Lumens",
  },
  USDC: {
    code: "USDC",
    issuer: DEFAULT_TESTNET_USDC_ISSUER,
    type: "credit-alphanum4",
    precision: 2,
    description: "Circle USD on Stellar testnet",
  },
  PYUSD: {
    code: "PYUSD",
    issuer: DEFAULT_TESTNET_PYUSD_ISSUER,
    type: "credit-alphanum4",
    precision: 2,
    description: "PayPal USD test asset",
  },
}

export function getSupportedAsset(code: string): SupportedAsset | null {
  const normalized = code.trim().toUpperCase()
  return SUPPORTED_ASSETS[normalized] ?? null
}

export function getSupportedAssetCodes(): string[] {
  return Object.keys(SUPPORTED_ASSETS)
}

interface MagicLinkRecord {
  hashedToken: string
  walletAddress: string
  walletSecret?: string
  recipient: string
  amount: string
  currency: string
  assetType: AssetType
  assetIssuer?: string
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
  lastAcknowledgedAt?: Date
}

const execFileAsync = promisify(execFile)

const MAGIC_LINK_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAGIC_LINKS_FILENAME = "magic-links.json"

const DEFAULT_TESTNET_RPC_URL = "https://soroban-testnet.stellar.org"
const DEFAULT_SANDBOX_RPC_URL = "http://localhost:8000/soroban/rpc"
const DEFAULT_SANDBOX_FRIENDBOT_URL = "http://localhost:8000/friendbot"

interface PersistedMagicLinkRecord
  extends Omit<MagicLinkRecord, "expiresAt" | "redeemedAt"> {
  expiresAt: string
  redeemedAt?: string
  lastAcknowledgedAt?: string
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
      assetType: record.assetType ?? "native",
      lastAcknowledgedAt: record.lastAcknowledgedAt
        ? new Date(record.lastAcknowledgedAt)
        : undefined,
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
      lastAcknowledgedAt: record.lastAcknowledgedAt
        ? record.lastAcknowledgedAt.toISOString()
        : undefined,
    }
  }

  writeJsonFile(MAGIC_LINKS_FILENAME, serializable)
}

const PREFUND_WITH_FRIENDBOT = process.env.STELLAR_PREFUND_WALLETS === "true"
const SOROBAN_CLI = process.env.SOROBAN_CLI_PATH || "soroban"
const SANDBOX_IDENTITY = process.env.SOROBAN_SANDBOX_IDENTITY || "default"
const SANDBOX_WASM_PATH =
  process.env.GHOST_WALLET_WASM_PATH ||
  "contracts/ghost-wallet/target/wasm32-unknown-unknown/release/ghost_wallet.optimized.wasm"

interface StellarNetworkContext {
  mode: PaymentMode
  rpcUrl: string
  networkPassphrase: string
  friendbotUrlBase: string
}

export interface StellarRuntimeDetails extends StellarNetworkContext {
  treasurySecretConfigured: boolean
}

function computeNetworkContext(): StellarNetworkContext {
  const mode = getPaymentMode()
  const defaultRpcUrl = mode === "sandbox" ? DEFAULT_SANDBOX_RPC_URL : DEFAULT_TESTNET_RPC_URL
  const rpcUrl =
    process.env.NEXT_PUBLIC_STELLAR_RPC_URL ||
    process.env.STELLAR_RPC_URL ||
    defaultRpcUrl
  const networkPassphrase = mode === "sandbox" ? "Standalone Network ; February 2017" : Networks.TESTNET
  const friendbotUrlBase = (
    process.env.STELLAR_FRIENDBOT_URL ||
    (mode === "sandbox" ? DEFAULT_SANDBOX_FRIENDBOT_URL : "https://friendbot.stellar.org")
  ).replace(/\/$/, "")

  return {
    mode,
    rpcUrl,
    networkPassphrase,
    friendbotUrlBase,
  }
}

let networkContext = computeNetworkContext()

function getNetworkContext(): StellarNetworkContext {
  return networkContext
}

export function getStellarRuntimeDetails(): StellarRuntimeDetails {
  const context = getNetworkContext()

  return {
    ...context,
    treasurySecretConfigured: Boolean(process.env.STELLAR_TREASURY_SECRET_KEY),
  }
}

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

const TX_HASH_REGEX = /[0-9a-f]{64}/i

function extractTransactionHash(output: string): string | null {
  const match = output.match(TX_HASH_REGEX)
  return match ? match[0] : null
}

function resetSorobanServerCache() {
  cachedServer = undefined
}

function getSorobanServer(): SorobanRpc.Server | null {
  const { mode, rpcUrl } = getNetworkContext()

  if (mode === "simulation") {
    return null
  }

  if (cachedServer !== undefined) {
    return cachedServer
  }

  cachedServer = null

  try {
    cachedServer = new SorobanServer(rpcUrl) as unknown as SorobanRpc.Server
    console.log("[v0] Soroban RPC client initialized at", rpcUrl)
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

  const { mode, rpcUrl, networkPassphrase } = getNetworkContext()

  if (mode !== "sandbox") {
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
      rpcUrl,
      "--network-passphrase",
      networkPassphrase,
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
      rpcUrl,
      "--network-passphrase",
      networkPassphrase,
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

onPaymentModeChange(() => {
  networkContext = computeNetworkContext()
  resetSorobanServerCache()
  friendbotCache.clear()
})

async function prefundWithFriendbot(publicKey: string): Promise<PrefundMetadata | null> {
  const { mode, friendbotUrlBase } = getNetworkContext()
  const shouldPrefund = mode !== "simulation" || PREFUND_WITH_FRIENDBOT

  if (!shouldPrefund) {
    return null
  }

  if (friendbotCache.has(publicKey)) {
    return friendbotCache.get(publicKey) ?? null
  }

  try {
    const response = await fetch(`${friendbotUrlBase}?addr=${encodeURIComponent(publicKey)}`)

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
  asset: SupportedAsset,
): Promise<string> {
  const server = getSorobanServer()
  const { networkPassphrase } = getNetworkContext()

  if (!server) {
    throw new Error("Soroban RPC server is not available")
  }

  try {
    const sourceKeypair = Keypair.fromSecret(fromSecretKey)
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey())

    // Build transaction to send tokens
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: toWalletAddress,
          asset: toStellarAsset(asset),
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

interface SimulationOptions {
  deterministicSeed?: string
}

interface BalanceSummary {
  asset_type: string
  asset_code?: string
  asset_issuer?: string
  balance: string
}

function toStellarAsset(asset: SupportedAsset): Asset {
  if (asset.type === "native") {
    return Asset.native()
  }

  if (!asset.issuer) {
    throw new Error(`Asset ${asset.code} is missing an issuer`)
  }

  return new Asset(asset.code, asset.issuer)
}

function matchesAsset(balance: BalanceSummary, asset: SupportedAsset): boolean {
  if (asset.type === "native") {
    return balance.asset_type === "native"
  }

  return (
    balance.asset_type !== "native" &&
    balance.asset_code === asset.code &&
    balance.asset_issuer === asset.issuer
  )
}

function computeConversionSendAmount(amount: string): string {
  const numeric = Number(amount)

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return amount
  }

  const sendValue = Math.max(numeric * 2, numeric + 1)
  return sendValue.toFixed(7)
}

function extractBalance(account: SorobanRpc.AccountResponse, asset: SupportedAsset): string | null {
  const balances = (account as SorobanRpc.AccountResponse & { balances?: BalanceSummary[] }).balances

  if (!balances) {
    return null
  }

  const match = balances.find((balance) => matchesAsset(balance, asset))
  return match?.balance ?? null
}

async function ensureTrustline(
  secretKey: string,
  asset: SupportedAsset,
  server: SorobanRpc.Server,
  networkPassphrase: string,
  contextLabel: string,
): Promise<void> {
  if (asset.type === "native") {
    return
  }

  const keypair = Keypair.fromSecret(secretKey)
  const account = await server.getAccount(keypair.publicKey())

  const existingBalance = extractBalance(account, asset)

  if (existingBalance !== null) {
    return
  }

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.changeTrust({
        asset: toStellarAsset(asset),
      }),
    )
    .setTimeout(60)
    .build()

  transaction.sign(keypair)

  const response = await server.sendTransaction(transaction)

  if (!response.hash) {
    throw new Error(`Unable to establish ${asset.code} trustline for ${contextLabel}`)
  }
}

async function requestFriendbotFunding(
  publicKey: string,
  asset: SupportedAsset,
  amount: string,
): Promise<boolean> {
  const { friendbotUrlBase } = getNetworkContext()

  try {
    const url = new URL(friendbotUrlBase)
    url.searchParams.set("addr", publicKey)

    if (asset.type !== "native" && asset.issuer) {
      url.searchParams.set("asset", `${asset.code}:${asset.issuer}`)
      url.searchParams.set("amount", amount)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.warn(
        `[v0] Friendbot funding for ${asset.code} failed with status ${response.status}.`,
      )
      return false
    }

    const payload = (await response.json()) as FriendbotSuccessResponse | { hash?: string; result?: string }

    const hash = (payload as FriendbotSuccessResponse).hash ?? (payload as { hash?: string }).hash

    if (typeof hash === "string" && hash.length > 0) {
      console.log(`[v0] Friendbot provided ${asset.code} funding: ${hash}`)
      return true
    }

    console.warn(`[v0] Friendbot response missing transaction hash for ${asset.code}.`, payload)
  } catch (error) {
    console.warn(`[v0] Friendbot funding attempt threw for ${asset.code}.`, error)
  }

  return false
}

async function attemptXlmConversion(
  secretKey: string,
  asset: SupportedAsset,
  amount: string,
  server: SorobanRpc.Server,
  networkPassphrase: string,
): Promise<boolean> {
  if (asset.type === "native") {
    return true
  }

  try {
    const keypair = Keypair.fromSecret(secretKey)
    const account = await server.getAccount(keypair.publicKey())

    const sendAmount = computeConversionSendAmount(amount)

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset: Asset.native(),
          sendAmount,
          destination: keypair.publicKey(),
          destAsset: toStellarAsset(asset),
          destMin: amount,
          path: [],
        }),
      )
      .setTimeout(60)
      .build()

    transaction.sign(keypair)

    const response = await server.sendTransaction(transaction)

    if (!response.hash) {
      console.warn(`[v0] XLM conversion for ${asset.code} did not yield a transaction hash.`)
      return false
    }

    console.log(`[v0] Executed XLM conversion for ${asset.code}: ${response.hash}`)
    return true
  } catch (error) {
    console.warn(`[v0] XLM conversion attempt failed for ${asset.code}.`, error)
    return false
  }
}

async function ensureTreasuryAssetBalance(
  secretKey: string,
  asset: SupportedAsset,
  amount: string,
  server: SorobanRpc.Server,
  networkPassphrase: string,
): Promise<void> {
  const treasuryKeypair = Keypair.fromSecret(secretKey)
  const account = await server.getAccount(treasuryKeypair.publicKey())
  const currentBalance = extractBalance(account, asset)

  if (asset.type === "native") {
    return
  }

  const numericBalance = currentBalance ? Number(currentBalance) : 0

  if (numericBalance >= Number(amount)) {
    return
  }

  const fundedViaFriendbot = await requestFriendbotFunding(treasuryKeypair.publicKey(), asset, amount)

  if (fundedViaFriendbot) {
    const refreshed = await server.getAccount(treasuryKeypair.publicKey())
    const refreshedBalance = extractBalance(refreshed, asset)

    if (refreshedBalance && Number(refreshedBalance) >= Number(amount)) {
      return
    }
  }

  const converted = await attemptXlmConversion(secretKey, asset, amount, server, networkPassphrase)

  if (!converted) {
    throw new Error(`Treasury does not have sufficient ${asset.code} balance and could not be funded automatically.`)
  }

  const postConversion = await server.getAccount(treasuryKeypair.publicKey())
  const postBalance = extractBalance(postConversion, asset)

  if (!postBalance || Number(postBalance) < Number(amount)) {
    throw new Error(`Treasury ${asset.code} balance remains insufficient after conversion attempts.`)
  }
}

function simulatePayment(
  walletAddress: string,
  amount: string,
  asset: SupportedAsset,
  options: SimulationOptions = {},
): PaymentResult {
  const hash = createHash("sha256")
    .update(walletAddress)
    .update(":")
    .update(amount)
    .update(":")
    .update(asset.code)

  if (options.deterministicSeed) {
    hash.update(":").update(options.deterministicSeed)
  } else {
    hash.update(":").update(Date.now().toString()).update(randomBytes(16))
  }

  const simulatedHash = hash.digest("hex")

  return {
    txHash: simulatedHash,
    mode: "simulation",
    isSimulated: true,
    explorerUrl: undefined,
    assetCode: asset.code,
    assetType: asset.type,
    assetIssuer: asset.issuer,
  }
}

function simulateClaimTransfer(
  sourceWallet: string,
  destinationWallet: string,
  amount: string,
  asset: SupportedAsset,
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
    .update(asset.code)
    .update(":")
    .update(Date.now().toString())
    .update(randomBytes(16))
    .digest("hex")
}

export async function sendPayment(
  walletAddress: string,
  amount: string,
  currency: string,
  walletSecret?: string,
): Promise<PaymentResult> {
  const asset = getSupportedAsset(currency) ?? SUPPORTED_ASSETS.XLM
  const { mode, networkPassphrase } = getNetworkContext()

  if (mode === "testnet" || mode === "sandbox") {
    const treasurySecret = process.env.STELLAR_TREASURY_SECRET_KEY
    const networkLabel = mode === "testnet" ? "Stellar testnet" : "Soroban sandbox"

    if (!treasurySecret) {
      console.warn(
        `Payment mode is set to ${mode} but STELLAR_TREASURY_SECRET_KEY is not configured. Falling back to simulation.`,
      )
    } else {
      const server = getSorobanServer()

      if (!server) {
        console.warn(`Unable to reach Soroban RPC server. Falling back to simulation for ${asset.code}.`)
      } else {
        try {
          await ensureTrustline(treasurySecret, asset, server, networkPassphrase, "treasury")

          if (asset.type !== "native") {
            if (!walletSecret) {
              throw new Error(
                "Recipient wallet secret is required to create a trustline for credit assets.",
              )
            }

            await ensureTrustline(walletSecret, asset, server, networkPassphrase, "recipient")
            await ensureTreasuryAssetBalance(treasurySecret, asset, amount, server, networkPassphrase)
          }

          const txHash = await sendToGhostWallet(treasurySecret, walletAddress, amount, asset)

          console.log(`[v0] On-chain ${mode} transfer completed (${asset.code})`)

          return {
            txHash,
            mode,
            isSimulated: false,
            explorerUrl: buildExplorerUrl(txHash, mode),
            assetCode: asset.code,
            assetType: asset.type,
            assetIssuer: asset.issuer,
          }
        } catch (error) {
          console.error(
            `Failed to submit payment on the ${networkLabel}. Falling back to simulation.`,
            error,
          )
        }
      }
    }
  }

  // Simulate a short processing delay so the flow appears realistic
  await new Promise((resolve) => setTimeout(resolve, 500))

  const deterministicSeed = `${walletAddress}:${amount}:${asset.code}`
  console.log(`[v0] Simulated transfer completed (${asset.code})`)
  return simulatePayment(walletAddress, amount, asset, {
    deterministicSeed: asset.type === "native" ? undefined : deterministicSeed,
  })
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
  assetType?: AssetType
  assetIssuer?: string
}

export interface GeneratedMagicLink {
  url: string
  token: string
  hashedToken: string
  expiresAt: string
}

function getMagicLinkRecord(token: string): MagicLinkRecord | null {
  const hashedToken = hashToken(token)
  const record = magicLinkStore.get(hashedToken)

  if (!record) {
    return null
  }

  return record
}

export interface MagicLinkSnapshot {
  walletAddress: string
  amount: string
  currency: string
  assetType: AssetType
  assetIssuer?: string
  recipient: string
  expiresAt: string
  fundingTxHash?: string
  contractAddress?: string
  senderName?: string
  message?: string
  fundingMode: PaymentMode
  explorerUrl?: string
  redeemed: boolean
  claimedBy?: string
  lastAcknowledgedAt?: string
}

export function getMagicLinkSnapshot(token: string): MagicLinkSnapshot | null {
  const record = getMagicLinkRecord(token)

  if (!record) {
    return null
  }

  return {
    walletAddress: record.walletAddress,
    amount: record.amount,
    currency: record.currency,
    assetType: record.assetType,
    assetIssuer: record.assetIssuer,
    recipient: record.recipient,
    expiresAt: record.expiresAt.toISOString(),
    fundingTxHash: record.fundingTxHash,
    contractAddress: record.contractAddress,
    senderName: record.senderName,
    message: record.message,
    fundingMode: record.fundingMode,
    explorerUrl: record.explorerUrl,
    redeemed: record.redeemed,
    claimedBy: record.claimedBy,
    lastAcknowledgedAt: record.lastAcknowledgedAt
      ? record.lastAcknowledgedAt.toISOString()
      : undefined,
  }
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

  const fundingMode = options.fundingMode ?? getNetworkContext().mode
  const walletAddress = wallet.address
  const walletSecret = wallet.secretKey
  const asset = getSupportedAsset(currency) ?? SUPPORTED_ASSETS.XLM
  const assetType = options.assetType ?? asset.type
  const assetIssuer = options.assetIssuer ?? asset.issuer

  magicLinkStore.set(hashedToken, {
    hashedToken,
    walletAddress,
    walletSecret,
    recipient,
    amount,
    currency,
    assetType,
    assetIssuer,
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
  assetType: AssetType
  assetIssuer?: string
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
    assetType: record.assetType,
    assetIssuer: record.assetIssuer,
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

interface ReassignMagicLinkOptions {
  message?: string
  extendExpirationMs?: number
}

export interface ReassignMagicLinkResult {
  token: string
  hashedToken: string
  url: string
  expiresAt: string
  amount: string
  currency: string
  assetType: AssetType
  assetIssuer?: string
  recipient: string
  fundingMode: PaymentMode
  explorerUrl?: string
}

export function reassignMagicLinkRecipient(
  token: string,
  newRecipient: string,
  options: ReassignMagicLinkOptions = {},
): ReassignMagicLinkResult {
  const record = getMagicLinkRecord(token)

  if (!record) {
    throw new Error("Invalid or unknown claim token")
  }

  if (record.redeemed) {
    throw new Error("This link has already been redeemed")
  }

  if (isMagicLinkExpired(record.expiresAt)) {
    throw new Error("This link has expired and cannot be reassigned")
  }

  const trimmedRecipient = newRecipient.trim()

  if (!trimmedRecipient) {
    throw new Error("A recipient is required to forward this balance")
  }

  const previousHashedToken = record.hashedToken
  const newToken = generateMagicLinkToken()
  const newHashedToken = hashToken(newToken)
  const expirationExtension = options.extendExpirationMs ?? 0
  const newExpiration = new Date(
    Math.max(Date.now(), record.expiresAt.getTime()) + expirationExtension,
  )

  const updatedRecord: MagicLinkRecord = {
    ...record,
    hashedToken: newHashedToken,
    magicLinkToken: newToken,
    recipient: trimmedRecipient,
    message: options.message ?? record.message,
    expiresAt: newExpiration,
    lastAcknowledgedAt: undefined,
    claimedBy: undefined,
    redeemed: false,
    redeemedAt: undefined,
  }

  magicLinkStore.delete(previousHashedToken)
  magicLinkStore.set(newHashedToken, updatedRecord)
  persistMagicLinkStore()

  return {
    token: newToken,
    hashedToken: newHashedToken,
    url: createMagicLinkUrl(newToken),
    expiresAt: newExpiration.toISOString(),
    amount: updatedRecord.amount,
    currency: updatedRecord.currency,
    assetType: updatedRecord.assetType,
    assetIssuer: updatedRecord.assetIssuer,
    recipient: updatedRecord.recipient,
    fundingMode: updatedRecord.fundingMode,
    explorerUrl: updatedRecord.explorerUrl,
  }
}

export function acknowledgeMagicLink(token: string): void {
  const record = getMagicLinkRecord(token)

  if (!record) {
    throw new Error("Unknown claim token")
  }

  record.lastAcknowledgedAt = new Date()
  magicLinkStore.set(record.hashedToken, record)
  persistMagicLinkStore()

  appendTransactionEvent(record.hashedToken, {
    type: "acknowledged",
    timestamp: new Date().toISOString(),
    data: {
      recipient: record.recipient,
    },
  })
}

/**
 * Claim funds associated with a magic link token.
 */
export interface ClaimFundsResult {
  txHash: string
  walletAddress: string
  amount: string
  currency: string
  assetType: AssetType
  assetIssuer?: string
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
      claimTxHash = await sendToGhostWallet(
        record.walletSecret,
        claimDestination,
        record.amount,
        record.currency,
      )
      explorerUrl = buildExplorerUrl(claimTxHash, record.fundingMode)
    } catch (error) {
      console.error("Failed to transfer funds from ghost wallet:", error)
      throw new Error("Failed to transfer funds to the provided Stellar address")
    }
  } else {
    const asset = getSupportedAsset(record.currency) ?? SUPPORTED_ASSETS.XLM
    claimTxHash = simulateClaimTransfer(record.walletAddress, claimDestination, record.amount, asset)
  }

  record.redeemed = true
  record.redeemedAt = new Date()
  record.claimedBy = claimDestination
  magicLinkStore.set(hashedToken, record)
  persistMagicLinkStore()

  appendTransactionEvent(hashedToken, {
    type: "claim-transfer",
    timestamp: new Date().toISOString(),
    data: {
      destination: claimDestination,
      txHash: claimTxHash,
      assetCode: record.currency,
      assetType: record.assetType,
      assetIssuer: record.assetIssuer,
      mode: record.fundingMode,
    },
  })

  markTransactionClaimed(hashedToken, claimTxHash, claimDestination)

  return {
    txHash: claimTxHash,
    walletAddress: record.walletAddress,
    amount: record.amount,
    currency: record.currency,
    assetType: record.assetType,
    assetIssuer: record.assetIssuer,
    recipient: record.recipient,
    contractAddress: record.contractAddress,
    fundingMode: record.fundingMode,
    explorerUrl,
    claimedBy: claimDestination,
  }
}

export interface ContractInvocationResult {
  txHash: string
  simulated: boolean
  mode: PaymentMode
  logs: string[]
  contractAddress?: string
}

function simulateContractInvocation(
  contractAddress: string | undefined,
  fn: string,
  context: Record<string, string>,
): ContractInvocationResult {
  const hash = createHash("sha256")
    .update(contractAddress ?? "SIM")
    .update(":")
    .update(fn)

  for (const [key, value] of Object.entries(context)) {
    hash.update(":").update(key).update("=").update(value)
  }

  return {
    txHash: hash.digest("hex"),
    simulated: true,
    mode: getNetworkContext().mode,
    logs: [
      `Simulated ${fn} with context ${JSON.stringify(context)}`,
      "No on-chain transaction submitted (demo mode)",
    ],
    contractAddress,
  }
}

async function invokeGhostWalletContract(
  contractAddress: string,
  fn: string,
  args: string[],
  context: Record<string, string>,
): Promise<ContractInvocationResult> {
  const { mode, rpcUrl, networkPassphrase } = getNetworkContext()

  if (mode !== "sandbox") {
    return simulateContractInvocation(contractAddress, fn, context)
  }

  try {
    const output = await runSorobanCommand([
      "contract",
      "invoke",
      "--id",
      contractAddress,
      "--rpc-url",
      rpcUrl,
      "--network-passphrase",
      networkPassphrase,
      "--source",
      SANDBOX_IDENTITY,
      "--fn",
      fn,
      "--",
      ...args,
    ])

    const txHash = extractTransactionHash(output) ?? simulateContractInvocation(contractAddress, fn, context).txHash

    return {
      txHash,
      simulated: false,
      mode,
      logs: [output.trim()],
      contractAddress,
    }
  } catch (error) {
    console.error(`Failed to invoke ${fn} on ghost wallet ${contractAddress}. Using simulation fallback.`, error)
    return simulateContractInvocation(contractAddress, fn, context)
  }
}

function getMagicLinkRecordOrThrow(token: string): MagicLinkRecord {
  const record = getMagicLinkRecord(token)

  if (!record) {
    throw new Error("Invalid or unknown claim token")
  }

  return record
}

export async function requestOwnershipChangeViaEmail(
  token: string,
  newOwner: string,
  emailClaim: string,
): Promise<ContractInvocationResult> {
  const record = getMagicLinkRecordOrThrow(token)
  const context = {
    token: hashToken(token),
    newOwner,
    emailClaim,
  }

  const contractAddress = record.contractAddress

  const result = contractAddress
    ? await invokeGhostWalletContract(contractAddress, "social_recover", [
        "--new_owner",
        newOwner,
        "--email_claim",
        emailClaim,
      ], context)
    : simulateContractInvocation(contractAddress, "social_recover", context)

  appendTransactionEvent(record.hashedToken, {
    type: "owner-change-request",
    timestamp: new Date().toISOString(),
    data: {
      newOwner,
      emailClaimed: Boolean(emailClaim),
      simulated: result.simulated,
      txHash: result.txHash,
      contractAddress: contractAddress ?? null,
    },
  })

  return result
}

export async function transferGhostWalletOwnership(
  token: string,
  newOwner: string,
): Promise<ContractInvocationResult> {
  const record = getMagicLinkRecordOrThrow(token)
  const trimmedOwner = newOwner.trim()

  if (!trimmedOwner) {
    throw new Error("A destination owner address is required to transfer ownership")
  }

  const context = {
    token: hashToken(token),
    newOwner: trimmedOwner,
  }

  const contractAddress = record.contractAddress

  const result = contractAddress
    ? await invokeGhostWalletContract(
        contractAddress,
        "transfer_ownership",
        ["--new_owner", trimmedOwner],
        context,
      )
    : simulateContractInvocation(contractAddress, "transfer_ownership", context)

  appendTransactionEvent(record.hashedToken, {
    type: "ownership-transferred",
    timestamp: new Date().toISOString(),
    data: {
      newOwner: trimmedOwner,
      simulated: result.simulated,
      txHash: result.txHash,
      contractAddress: contractAddress ?? null,
    },
  })

  return result
}

export async function forwardBalanceToSmartWallet(
  token: string,
  destinationWallet: string,
  assetCode: string,
  emailClaim: string,
): Promise<ContractInvocationResult> {
  const record = getMagicLinkRecordOrThrow(token)
  const context = {
    token: hashToken(token),
    destinationWallet,
    assetCode,
    emailClaim,
  }

  const contractAddress = record.contractAddress

  // TODO: surface the correct token contract address once deployments are automated.
  const args = contractAddress
    ? [
        "--token_address",
        contractAddress,
        "--asset_code",
        assetCode,
        "--destination_wallet",
        destinationWallet,
        "--email_claim",
        emailClaim,
      ]
    : []

  const result = contractAddress
    ? await invokeGhostWalletContract(contractAddress, "forward_balance", args, context)
    : simulateContractInvocation(contractAddress, "forward_balance", context)

  appendTransactionEvent(record.hashedToken, {
    type: "forward-balance",
    timestamp: new Date().toISOString(),
    data: {
      destinationWallet,
      assetCode,
      simulated: result.simulated,
      txHash: result.txHash,
    },
  })

  return result
}
