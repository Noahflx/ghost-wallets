import { type NextRequest, NextResponse } from "next/server"

import { forwardMagicLink } from "@/lib/stellar"
import { enforceRateLimit } from "@/lib/rate-limit"

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5

function extractIdentifier(request: NextRequest): string {
  const header = request.headers.get("x-forwarded-for")
  if (!header) {
    return request.ip ?? "anonymous"
  }

  return header.split(",")[0]?.trim() || request.ip || "anonymous"
}

export async function POST(request: NextRequest) {
  try {
    const { token, destination, message, senderName } = await request.json()

    const identifier = `forward:${extractIdentifier(request)}`
    const rateLimit = enforceRateLimit(identifier, {
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many forward attempts. Please try again soon." },
        {
          status: 429,
          headers: { "retry-after": Math.ceil(rateLimit.retryAfterMs / 1000).toString() },
        },
      )
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "A valid claim token is required" }, { status: 400 })
    }

    if (!destination || typeof destination !== "string") {
      return NextResponse.json({ error: "A destination email is required" }, { status: 400 })
    }

    const forwardResult = await forwardMagicLink(token, destination, {
      senderName: typeof senderName === "string" ? senderName : undefined,
      message: typeof message === "string" ? message : undefined,
    })

    return NextResponse.json({
      success: true,
      amount: forwardResult.amount,
      currency: forwardResult.currency,
      recipient: forwardResult.recipient,
      walletAddress: forwardResult.walletAddress,
      contractAddress: forwardResult.contractAddress ?? null,
      transactionHash: forwardResult.transactionHash,
      magicLinkUrl: forwardResult.newMagicLinkUrl,
      magicLinkTokenHash: forwardResult.magicLinkTokenHash,
      magicLinkExpiresAt: forwardResult.magicLinkExpiresAt,
      paymentMode: forwardResult.paymentMode,
      explorerUrl: forwardResult.explorerUrl ?? null,
      simulated: forwardResult.simulated,
    })
  } catch (error) {
    console.error("[ghost-wallets] Error forwarding magic link:", error)
    return NextResponse.json({ error: "Failed to forward this transfer" }, { status: 500 })
  }
}
