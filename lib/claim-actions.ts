import { randomUUID } from "crypto"
import { hashToken } from "./magic-link"
import { readJsonFile, writeJsonFile } from "./storage/filesystem"

export type ClaimActionType = "keep" | "withdraw" | "cashout" | "forward"

export interface ClaimActionRecord {
  id: string
  tokenHash: string
  action: ClaimActionType
  createdAt: string
  payload: Record<string, unknown>
}

const CLAIM_ACTIONS_FILENAME = "claim-actions.json"

function loadActionRecords(): ClaimActionRecord[] {
  return readJsonFile<ClaimActionRecord[]>(CLAIM_ACTIONS_FILENAME, [])
}

function persistActionRecords(records: ClaimActionRecord[]): void {
  writeJsonFile(CLAIM_ACTIONS_FILENAME, records)
}

export interface RecordClaimActionParams {
  token: string
  action: ClaimActionType
  payload?: Record<string, unknown>
}

export interface RecordClaimActionResult {
  id: string
  tokenHash: string
}

export function recordClaimAction({ token, action, payload }: RecordClaimActionParams): RecordClaimActionResult {
  const tokenHash = hashToken(token)
  const records = loadActionRecords()

  const record: ClaimActionRecord = {
    id: randomUUID(),
    tokenHash,
    action,
    createdAt: new Date().toISOString(),
    payload: payload ?? {},
  }

  records.push(record)
  persistActionRecords(records)

  return {
    id: record.id,
    tokenHash,
  }
}
