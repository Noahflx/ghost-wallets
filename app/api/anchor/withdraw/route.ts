import { type NextRequest, NextResponse } from "next/server"

import { recordClaimAction } from "@/lib/claim-actions"
import { acknowledgeMagicLink, getMagicLinkSnapshot, getSupportedAsset } from "@/lib/stellar"
import { appendTransactionEvent } from "@/lib/transactions"
import { enforceRateLimit } from "@/lib/rate-limit"

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 3

function extractIdentifier(request: NextRequest): string {
  const header = request.headers.get("x-forwarded-for")
  if (!header) {
    return request.ip ?? "anonymous"
  }

  return header.split(",")[0]?.trim() || request.ip || "anonymous"
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = normalize(body.token)
    const amount = normalize(body.amount)
    const assetCode = normalize(body.assetCode)
    const destinationBank = normalize(body.destinationBank)
    const referenceId = normalize(body.referenceId)

    if (!token) {
      return NextResponse.json({ error: "A claim token is required" }, { status: 400 })
    }

    const identifier = `anchor-withdraw:${extractIdentifier(request)}`
    const rateLimit = enforceRateLimit(identifier, {
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many anchor withdrawal attempts. Please slow down." },
        {
          status: 429,
          headers: { "retry-after": Math.ceil(rateLimit.retryAfterMs / 1000).toString() },
        },
      )
    }

    const snapshot = getMagicLinkSnapshot(token)

    if (!snapshot) {
      return NextResponse.json({ error: "Unknown or expired claim link" }, { status: 404 })
    }

    if (!destinationBank) {
      return NextResponse.json({ error: "Destination bank details are required" }, { status: 400 })
    }

    const resolvedAsset = getSupportedAsset(assetCode || snapshot.currency)

    if (!resolvedAsset) {
      return NextResponse.json({ error: "Unsupported asset for withdrawal" }, { status: 400 })
    }

    const effectiveAmount = amount || snapshot.amount
    const timestamp = new Date().toISOString()
    const logs = [
      `Anchor withdrawal simulated at ${timestamp} for ${effectiveAmount} ${resolvedAsset.code}.`,
      "In production this endpoint would exchange JSON payloads with a fiat partner (e.g. MoneyGram or Wyre) after KYC checks.",
    ]

    const record = recordClaimAction({
      token,
      action: "anchor-withdraw",
      payload: {
        amount: effectiveAmount,
        assetCode: resolvedAsset.code,
        assetIssuer: resolvedAsset.issuer,
        destinationBank,
        referenceId: referenceId || `demo-${Date.now()}`,
      },
      logs,
    })

    appendTransactionEvent(record.tokenHash, {
      type: "anchor-withdraw",
      timestamp,
      data: {
        bank: destinationBank,
        amount: effectiveAmount,
        assetCode: resolvedAsset.code,
        assetIssuer: resolvedAsset.issuer,
        referenceId: referenceId || null,
      },
    })

    acknowledgeMagicLink(token)

    return NextResponse.json({
      success: true,
      simulated: true,
      recordId: record.id,
      logs,
    })
  } catch (error) {
    console.error("[anchor] Failed to simulate anchor withdrawal:", error)
    return NextResponse.json({ error: "Failed to process anchor withdrawal" }, { status: 500 })
  }
}
