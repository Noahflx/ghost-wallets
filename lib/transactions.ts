import crypto from "crypto"

import { readJsonFile, writeJsonFile } from "./storage/filesystem"
import type { PaymentMode } from "./types/payments"

export type TransactionStatus = "sent" | "claimed" | "failed"

export interface TransactionRecord {
  id: string
  recipient: string
  amount: string
  currency: string
  status: TransactionStatus
  walletAddress: string
  transactionHash?: string
  magicLinkUrl: string
  magicLinkTokenHash: string
  senderName?: string
  createdAt: string
  updatedAt: string
  claimedAt?: string
  claimTransactionHash?: string
  fundingMode: PaymentMode
  explorerUrl?: string
  isSimulated: boolean
}

interface RecordTransactionInput {
  recipient: string
  amount: string
  currency: string
  walletAddress: string
  transactionHash?: string
  magicLinkUrl: string
  magicLinkTokenHash: string
  senderName?: string
  fundingMode: PaymentMode
  explorerUrl?: string
  isSimulated: boolean
}

const globalStores = globalThis as typeof globalThis & {
  __transactionStore?: Map<string, TransactionRecord>
}

const TRANSACTIONS_FILENAME = "transactions.json"

interface PersistedTransactionRecord extends TransactionRecord {}

function hydrateTransactionStore(): Map<string, TransactionRecord> {
  const persisted = readJsonFile<Record<string, PersistedTransactionRecord>>(TRANSACTIONS_FILENAME, {})
  const entries = Object.entries(persisted).map<[string, TransactionRecord]>(([key, record]) => [
    key,
    {
      ...record,
      fundingMode: record.fundingMode ?? "simulation",
      isSimulated: record.isSimulated ?? record.fundingMode !== "testnet",
    },
  ])

  return new Map<string, TransactionRecord>(entries)
}

const transactionStore =
  globalStores.__transactionStore ?? hydrateTransactionStore()

if (!globalStores.__transactionStore) {
  globalStores.__transactionStore = transactionStore
}

function persistTransactionStore() {
  const serializable: Record<string, PersistedTransactionRecord> = {}

  for (const [key, record] of transactionStore.entries()) {
    serializable[key] = record
  }

  writeJsonFile(TRANSACTIONS_FILENAME, serializable)
}

export function recordTransaction(input: RecordTransactionInput): TransactionRecord {
  const id = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  const record: TransactionRecord = {
    id,
    recipient: input.recipient,
    amount: input.amount,
    currency: input.currency,
    status: "sent",
    walletAddress: input.walletAddress,
    transactionHash: input.transactionHash,
    magicLinkUrl: input.magicLinkUrl,
    magicLinkTokenHash: input.magicLinkTokenHash,
    senderName: input.senderName,
    createdAt: timestamp,
    updatedAt: timestamp,
    fundingMode: input.fundingMode,
    explorerUrl: input.explorerUrl,
    isSimulated: input.isSimulated,
  }

  transactionStore.set(input.magicLinkTokenHash, record)
  persistTransactionStore()
  return record
}

export function markTransactionClaimed(
  magicLinkTokenHash: string,
  claimTransactionHash?: string,
): TransactionRecord | null {
  const existing = transactionStore.get(magicLinkTokenHash)

  if (!existing) {
    return null
  }

  const claimedAt = new Date().toISOString()
  const updatedRecord: TransactionRecord = {
    ...existing,
    status: "claimed",
    claimedAt,
    updatedAt: claimedAt,
    claimTransactionHash: claimTransactionHash ?? existing.claimTransactionHash,
  }

  transactionStore.set(magicLinkTokenHash, updatedRecord)
  persistTransactionStore()
  return updatedRecord
}

export function listTransactions(): TransactionRecord[] {
  return Array.from(transactionStore.values()).sort((a, b) =>
    a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0,
  )
}

export function getTransactionByTokenHash(magicLinkTokenHash: string): TransactionRecord | null {
  return transactionStore.get(magicLinkTokenHash) ?? null
}
