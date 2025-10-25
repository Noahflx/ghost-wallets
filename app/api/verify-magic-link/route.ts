import { type NextRequest, NextResponse } from "next/server"
import { hashToken } from "@/lib/magic-link"

// In-memory storage for demo (use database in production)
// This should match the storage in send-payment route
const magicLinks = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Hash the token to look it up
    const hashedToken = hashToken(token)
    const linkData = magicLinks.get(hashedToken)

    if (!linkData) {
      return NextResponse.json({ error: "Invalid or expired magic link" }, { status: 404 })
    }

    // Check if expired
    if (new Date() > new Date(linkData.expiresAt)) {
      return NextResponse.json({ error: "Magic link has expired" }, { status: 410 })
    }

    // Check if already claimed
    if (linkData.claimed) {
      return NextResponse.json({ error: "Magic link has already been claimed" }, { status: 410 })
    }

    // Return wallet info (without secret key for security)
    return NextResponse.json({
      success: true,
      walletAddress: linkData.walletPublicKey,
      contractAddress: linkData.contractAddress,
      amount: linkData.amount,
      tokenSymbol: linkData.tokenSymbol,
      recipientEmail: linkData.recipientEmail,
      recipientPhone: linkData.recipientPhone,
    })
  } catch (error) {
    console.error("Error verifying magic link:", error)
    return NextResponse.json({ error: "Failed to verify magic link" }, { status: 500 })
  }
}
