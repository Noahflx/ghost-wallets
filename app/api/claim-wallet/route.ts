import { type NextRequest, NextResponse } from "next/server"
import { claimFunds } from "@/lib/stellar"
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
    const body = await request.json()
    const { token, userAddress } = body

    const identifier = `claim:${extractIdentifier(request)}`
    const rateLimit = enforceRateLimit(identifier, {
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many claim attempts. Please try again later." },
        {
          status: 429,
          headers: { "retry-after": Math.ceil(rateLimit.retryAfterMs / 1000).toString() },
        },
      )
    }

    if (!token || !userAddress) {
      return NextResponse.json({ error: "Token and user address are required" }, { status: 400 })
    }

    if (typeof userAddress !== "string" || userAddress.length < 10) {
      return NextResponse.json({ error: "A valid Stellar address is required" }, { status: 400 })
    }

    const claimResult = await claimFunds(token)

    // TODO: Transfer ownership of the ghost wallet contract to userAddress
    // This would call the contract's transfer_ownership function

    return NextResponse.json({
      success: true,
      walletAddress: claimResult.walletAddress,
      contractAddress: claimResult.contractAddress ?? null,
      amount: claimResult.amount,
      tokenSymbol: claimResult.currency,
      transactionHash: claimResult.txHash,
      recipientEmail: claimResult.recipient,
      claimedBy: userAddress,
      paymentMode: claimResult.fundingMode,
      explorerUrl: claimResult.explorerUrl ?? null,
    })
  } catch (error) {
    console.error("Error claiming wallet:", error)
    return NextResponse.json({ error: "Failed to claim wallet" }, { status: 500 })
  }
}
