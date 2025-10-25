import { type NextRequest, NextResponse } from "next/server"
import { verifyMagicLink } from "@/lib/stellar"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

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
      expiresAt: linkData.expiresAt,
      transactionHash: linkData.fundingTxHash ?? null,
    })
  } catch (error) {
    console.error("Error verifying magic link:", error)
    return NextResponse.json({ error: "Failed to verify magic link" }, { status: 500 })
  }
}
