import crypto from "crypto"

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
}

const globalStores = globalThis as typeof globalThis & {
  __transactionStore?: Map<string, TransactionRecord>
}

const transactionStore =
  globalStores.__transactionStore ?? new Map<string, TransactionRecord>()

if (!globalStores.__transactionStore) {
  globalStores.__transactionStore = transactionStore
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
  }

  transactionStore.set(input.magicLinkTokenHash, record)
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
