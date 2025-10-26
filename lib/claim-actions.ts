import { randomUUID } from "crypto"
import { hashToken } from "./magic-link"
import { readJsonFile, writeJsonFile } from "./storage/filesystem"

export type ClaimActionType =
  | "keep"
  | "withdraw"
  | "cashout"
  | "forward"
  | "owner-transfer"
  | "anchor-withdraw"

export interface ClaimActionRecord {
  id: string
  tokenHash: string
  action: ClaimActionType
  createdAt: string
  payload: Record<string, unknown>
  logs: string[]
}

const CLAIM_ACTIONS_FILENAME = "claim-actions.json"

function loadActionRecords(): ClaimActionRecord[] {
  const records = readJsonFile<ClaimActionRecord[]>(CLAIM_ACTIONS_FILENAME, [])
  return records.map((record) => ({ ...record, logs: record.logs ?? [] }))
}

function persistActionRecords(records: ClaimActionRecord[]): void {
  writeJsonFile(CLAIM_ACTIONS_FILENAME, records)
}

export interface RecordClaimActionParams {
  token: string
  action: ClaimActionType
  payload?: Record<string, unknown>
  logs?: string[]
}

export interface RecordClaimActionResult {
  id: string
  tokenHash: string
}

export function recordClaimAction({ token, action, payload, logs = [] }: RecordClaimActionParams): RecordClaimActionResult {
  const tokenHash = hashToken(token)
  const records = loadActionRecords()

  const record: ClaimActionRecord = {
    id: randomUUID(),
    tokenHash,
    action,
    createdAt: new Date().toISOString(),
    payload: payload ?? {},
    logs,
  }

  records.push(record)
  persistActionRecords(records)

  return {
    id: record.id,
    tokenHash,
  }
}
