import { type NextRequest, NextResponse } from "next/server"

import { createRecoverySession, startRecoveryChallenge, verifyRecoveryChallenge } from "@/lib/recovery"
import { enforceRateLimit } from "@/lib/rate-limit"
import { listTransactions } from "@/lib/transactions"

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 8

function extractIdentifier(request: NextRequest): string {
  const header = request.headers.get("x-forwarded-for")
  if (!header) {
    return request.ip ?? "anonymous"
  }

  return header.split(",")[0]?.trim() || request.ip || "anonymous"
}

function normalizeEmail(raw: unknown): string {
  if (typeof raw !== "string") {
    return ""
  }

  return raw.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const email = normalizeEmail(payload.email)
    const challengeId = typeof payload.challengeId === "string" ? payload.challengeId : undefined
    const otp = typeof payload.otp === "string" ? payload.otp : undefined

    if (!email) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }

    const identifier = `recover:${extractIdentifier(request)}:${email}`
    const rateLimit = enforceRateLimit(identifier, {
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many recovery attempts. Please wait a moment." },
        {
          status: 429,
          headers: { "retry-after": Math.ceil(rateLimit.retryAfterMs / 1000).toString() },
        },
      )
    }

    if (!challengeId || !otp) {
      const challenge = startRecoveryChallenge(email)

      return NextResponse.json({
        success: true,
        challengeId: challenge.id,
        expiresAt: challenge.expiresAt,
      })
    }

    const record = verifyRecoveryChallenge(challengeId, otp)

    if (record.email !== email) {
      return NextResponse.json({ error: "This code does not match the email provided" }, { status: 400 })
    }

    const session = createRecoverySession(record)
    const transactions = listTransactions().filter((tx) => tx.recipient.toLowerCase() === email)

    const wallets = transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      magicLinkUrl: tx.magicLinkUrl,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      claimedAt: tx.claimedAt ?? null,
      explorerUrl: tx.explorerUrl ?? null,
    }))

    return NextResponse.json({
      success: true,
      recoveryToken: session.token,
      expiresAt: session.expiresAt,
      wallets,
    })
  } catch (error) {
    console.error("[ghost-wallets] Error handling recovery:", error)
    return NextResponse.json({ error: "Failed to process recovery request" }, { status: 500 })
  }
}
