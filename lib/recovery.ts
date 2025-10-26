import { createHash, randomBytes } from "crypto"

import { readJsonFile, writeJsonFile } from "@/lib/storage/filesystem"

interface RecoveryChallengeRecord {
  id: string
  email: string
  otpHash: string
  createdAt: string
  expiresAt: string
  attempts: number
  verifiedAt?: string
}

interface PersistedRecoveryChallengeRecord extends RecoveryChallengeRecord {}

interface RecoverySessionRecord {
  token: string
  email: string
  challengeId: string
  createdAt: string
  expiresAt: string
}

const CHALLENGES_FILENAME = "recovery-challenges.json"
const CHALLENGE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const SESSION_TTL_MS = 60 * 60 * 1000 // 1 hour
const MAX_ATTEMPTS = 5

const globalStores = globalThis as typeof globalThis & {
  __ghostRecoveryChallenges?: Map<string, RecoveryChallengeRecord>
  __ghostRecoverySessions?: Map<string, RecoverySessionRecord>
}

const challengeStore =
  globalStores.__ghostRecoveryChallenges ?? hydrateChallengeStore()

if (!globalStores.__ghostRecoveryChallenges) {
  globalStores.__ghostRecoveryChallenges = challengeStore
}

const sessionStore = globalStores.__ghostRecoverySessions ?? new Map()

if (!globalStores.__ghostRecoverySessions) {
  globalStores.__ghostRecoverySessions = sessionStore
}

function hydrateChallengeStore(): Map<string, RecoveryChallengeRecord> {
  const persisted = readJsonFile<Record<string, PersistedRecoveryChallengeRecord>>(CHALLENGES_FILENAME, {})
  const entries = Object.entries(persisted).map<[string, RecoveryChallengeRecord]>(([key, record]) => [
    key,
    record,
  ])

  return new Map(entries)
}

function persistChallengeStore() {
  const serializable: Record<string, PersistedRecoveryChallengeRecord> = {}

  for (const [key, record] of challengeStore.entries()) {
    serializable[key] = record
  }

  writeJsonFile(CHALLENGES_FILENAME, serializable)
}

function createOtp(): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return num.toString()
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex")
}

function now(): Date {
  return new Date()
}

export interface RecoveryChallenge {
  id: string
  email: string
  expiresAt: string
  otpPreview?: string
}

export interface RecoverySession {
  token: string
  email: string
  challengeId: string
  expiresAt: string
}

export function startRecoveryChallenge(email: string): RecoveryChallenge {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error("A valid email is required")
  }

  const otp = createOtp()
  const challengeId = cryptoRandomId()
  const issuedAt = now()
  const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_MS)

  challengeStore.set(challengeId, {
    id: challengeId,
    email: normalizedEmail,
    otpHash: hashOtp(otp),
    createdAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    attempts: 0,
  })

  persistChallengeStore()

  console.info(
    "[ghost-recovery] Issued recovery challenge",
    challengeId,
    "for",
    normalizedEmail,
    "OTP:",
    otp,
  )

  return {
    id: challengeId,
    email: normalizedEmail,
    expiresAt: expiresAt.toISOString(),
    otpPreview: otp,
  }
}

export function verifyRecoveryChallenge(
  challengeId: string,
  otp: string,
): RecoveryChallengeRecord {
  const trimmedOtp = otp.trim()

  if (trimmedOtp.length !== 6) {
    throw new Error("Invalid verification code")
  }

  const record = challengeStore.get(challengeId)

  if (!record) {
    throw new Error("Recovery challenge was not found")
  }

  const expiresAt = new Date(record.expiresAt)

  if (now() > expiresAt) {
    challengeStore.delete(challengeId)
    persistChallengeStore()
    throw new Error("This recovery code has expired")
  }

  if (record.verifiedAt) {
    throw new Error("This recovery challenge was already used")
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many incorrect attempts")
  }

  const expectedHash = record.otpHash
  const providedHash = hashOtp(trimmedOtp)

  if (expectedHash !== providedHash) {
    record.attempts += 1
    challengeStore.set(challengeId, record)
    persistChallengeStore()
    throw new Error("The verification code was incorrect")
  }

  record.verifiedAt = now().toISOString()
  challengeStore.set(challengeId, record)
  persistChallengeStore()

  return record
}

export function createRecoverySession(record: RecoveryChallengeRecord): RecoverySession {
  const token = cryptoRandomId()
  const expiresAt = new Date(now().getTime() + SESSION_TTL_MS)
  const session: RecoverySessionRecord = {
    token,
    email: record.email,
    challengeId: record.id,
    createdAt: now().toISOString(),
    expiresAt: expiresAt.toISOString(),
  }

  sessionStore.set(token, session)

  return {
    token,
    email: record.email,
    challengeId: record.id,
    expiresAt: session.expiresAt,
  }
}

export function getRecoverySession(token: string): RecoverySessionRecord | null {
  const session = sessionStore.get(token)

  if (!session) {
    return null
  }

  if (now() > new Date(session.expiresAt)) {
    sessionStore.delete(token)
    return null
  }

  return session
}

function cryptoRandomId(): string {
  return randomBytes(24).toString("hex")
}
