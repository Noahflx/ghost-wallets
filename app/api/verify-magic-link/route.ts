import { type NextRequest, NextResponse } from "next/server"
import { verifyMagicLink } from "@/lib/stellar"
import { enforceRateLimit } from "@/lib/rate-limit"

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 10

function extractIdentifier(request: NextRequest): string {
  const header = request.headers.get("x-forwarded-for")
  if (!header) {
    return request.ip ?? "anonymous"
  }

  return header.split(",")[0]?.trim() || request.ip || "anonymous"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    const identifier = `verify:${extractIdentifier(request)}`
    const rateLimit = enforceRateLimit(identifier, {
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait before trying again." },
        {
          status: 429,
          headers: { "retry-after": Math.ceil(rateLimit.retryAfterMs / 1000).toString() },
        },
      )
    }

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const linkData = await verifyMagicLink(token)

    if (!linkData) {
      return NextResponse.json({ error: "Invalid or expired magic link" }, { status: 404 })
    }

    // Return wallet info (without secret key for security)
    return NextResponse.json({
      success: true,
      walletAddress: linkData.walletAddress,
      contractAddress: linkData.contractAddress ?? null,
      amount: linkData.amount,
      tokenSymbol: linkData.currency,
      recipientEmail: linkData.recipient,
      senderName: linkData.senderName ?? null,
      message: linkData.message ?? null,
      expiresAt: linkData.expiresAt,
      transactionHash: linkData.fundingTxHash ?? null,
      paymentMode: linkData.fundingMode,
      explorerUrl: linkData.explorerUrl ?? null,
    })
  } catch (error) {
    console.error("Error verifying magic link:", error)
    return NextResponse.json({ error: "Failed to verify magic link" }, { status: 500 })
  }
}
