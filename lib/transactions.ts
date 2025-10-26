import crypto from "crypto"

import { readJsonFile, writeJsonFile } from "./storage/filesystem"
import type { AssetType, PaymentMode } from "./types/payments"

export type TransactionStatus = "sent" | "claimed" | "failed"

export interface TransactionEvent {
  type: string
  timestamp: string
  data?: Record<string, unknown>
}

export interface TransactionRecord {
  id: string
  recipient: string
  amount: string
  currency: string
  assetType: AssetType
  assetIssuer?: string
  status: TransactionStatus
  walletAddress: string
  transactionHash?: string
  magicLinkUrl: string
  magicLinkTokenHash: string
  senderName?: string
  message?: string
  createdAt: string
  updatedAt: string
  claimedAt?: string
  claimTransactionHash?: string
  fundingMode: PaymentMode
  explorerUrl?: string
  isSimulated: boolean
  prefundTransactionHash?: string
  prefundLedger?: number
  prefundedAt?: string
  claimedBy?: string
  events: TransactionEvent[]
}

export interface TransactionEventInput extends TransactionEvent {}

interface RecordTransactionInput {
  recipient: string
  amount: string
  currency: string
  assetType: AssetType
  assetIssuer?: string
  walletAddress: string
  transactionHash?: string
  magicLinkUrl: string
  magicLinkTokenHash: string
  senderName?: string
  message?: string
  fundingMode: PaymentMode
  explorerUrl?: string
  isSimulated: boolean
  prefundTransactionHash?: string
  prefundLedger?: number
  prefundedAt?: string
  claimedBy?: string
  events?: TransactionEventInput[]
}

const globalStores = globalThis as typeof globalThis & {
  __transactionStore?: Map<string, TransactionRecord>
}

const TRANSACTIONS_FILENAME = "transactions.json"

interface PersistedTransactionRecord
  extends Omit<TransactionRecord, "events" | "assetType"> {
  events?: TransactionEvent[]
  assetType?: AssetType
}

function hydrateTransactionStore(): Map<string, TransactionRecord> {
  const persisted = readJsonFile<Record<string, PersistedTransactionRecord>>(TRANSACTIONS_FILENAME, {})
  const entries = Object.entries(persisted).map<[string, TransactionRecord]>(([key, record]) => {
    const fundingMode = record.fundingMode ?? "simulation"
    const isSimulated = record.isSimulated ?? fundingMode === "simulation"
    const assetType: AssetType = record.assetType ?? "native"
    const events = record.events ?? []

    return [
      key,
      {
        ...record,
        fundingMode,
        isSimulated,
        assetType,
        events,
      },
    ]
  })

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
    serializable[key] = { ...record }
  }

  writeJsonFile(TRANSACTIONS_FILENAME, serializable)
}

export function recordTransaction(input: RecordTransactionInput): TransactionRecord {
  const id = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  const initialEvents =
    input.events && input.events.length > 0
      ? input.events
      : [
          {
            type: "transaction-recorded",
            timestamp,
            data: {
              mode: input.fundingMode,
              isSimulated: input.isSimulated,
            },
          },
        ]

  const record: TransactionRecord = {
    id,
    recipient: input.recipient,
    amount: input.amount,
    currency: input.currency,
    assetType: input.assetType,
    assetIssuer: input.assetIssuer,
    status: "sent",
    walletAddress: input.walletAddress,
    transactionHash: input.transactionHash,
    magicLinkUrl: input.magicLinkUrl,
    magicLinkTokenHash: input.magicLinkTokenHash,
    senderName: input.senderName,
    message: input.message,
    createdAt: timestamp,
    updatedAt: timestamp,
    fundingMode: input.fundingMode,
    explorerUrl: input.explorerUrl,
    isSimulated: input.isSimulated,
    prefundTransactionHash: input.prefundTransactionHash,
    prefundLedger: input.prefundLedger,
    prefundedAt: input.prefundedAt,
    claimedBy: input.claimedBy,
    events: initialEvents,
  }

  transactionStore.set(input.magicLinkTokenHash, record)
  persistTransactionStore()
  return record
}

export function appendTransactionEvent(
  magicLinkTokenHash: string,
  event: TransactionEventInput,
): TransactionRecord | null {
  const existing = transactionStore.get(magicLinkTokenHash)

  if (!existing) {
    return null
  }

  const events = existing.events.concat(event)
  const updated: TransactionRecord = { ...existing, events, updatedAt: event.timestamp }
  transactionStore.set(magicLinkTokenHash, updated)
  persistTransactionStore()
  return updated
}

export function markTransactionClaimed(
  magicLinkTokenHash: string,
  claimTransactionHash?: string,
  claimedBy?: string,
): TransactionRecord | null {
  const existing = transactionStore.get(magicLinkTokenHash)

  if (!existing) {
    return null
  }

  const claimedAt = new Date().toISOString()
  const event: TransactionEventInput = {
    type: "claimed",
    timestamp: claimedAt,
    data: {
      claimTransactionHash: claimTransactionHash ?? existing.claimTransactionHash,
      claimedBy: claimedBy ?? existing.claimedBy,
    },
  }

  const updatedRecord: TransactionRecord = {
    ...existing,
    status: "claimed",
    claimedAt,
    updatedAt: claimedAt,
    claimTransactionHash: claimTransactionHash ?? existing.claimTransactionHash,
    claimedBy: claimedBy ?? existing.claimedBy,
    events: existing.events.concat(event),
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
