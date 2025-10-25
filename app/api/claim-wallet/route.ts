import { type NextRequest, NextResponse } from "next/server"
import { hashToken } from "@/lib/magic-link"

// In-memory storage for demo (use database in production)
const magicLinks = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userAddress } = body

    if (!token || !userAddress) {
      return NextResponse.json({ error: "Token and user address are required" }, { status: 400 })
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

    // Mark as claimed
    linkData.claimed = true
    linkData.claimedAt = new Date()
    linkData.claimedByAddress = userAddress
    magicLinks.set(hashedToken, linkData)

    // TODO: Transfer ownership of the ghost wallet contract to userAddress
    // This would call the contract's transfer_ownership function

    return NextResponse.json({
      success: true,
      walletAddress: linkData.walletPublicKey,
      contractAddress: linkData.contractAddress,
      amount: linkData.amount,
      tokenSymbol: linkData.tokenSymbol,
    })
  } catch (error) {
    console.error("Error claiming wallet:", error)
    return NextResponse.json({ error: "Failed to claim wallet" }, { status: 500 })
  }
}
