import { type NextRequest, NextResponse } from "next/server"
import { claimFunds } from "@/lib/stellar"

export async function POST(request: NextRequest) {
  try {
    const { token, userAddress } = await request.json()

    // Process the claim
    const result = await claimFunds(token, userAddress)

    return NextResponse.json({
      success: true,
      transactionHash: result.txHash,
      claimedBy: result.claimedBy ?? null,
    })
  } catch (error) {
    console.error("[v0] Error in claim API:", error)
    return NextResponse.json({ error: "Failed to claim funds" }, { status: 500 })
  }
}
