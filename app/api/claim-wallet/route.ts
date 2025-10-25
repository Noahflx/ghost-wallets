import { type NextRequest, NextResponse } from "next/server"
import { claimFunds } from "@/lib/stellar"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userAddress } = body

    if (!token || !userAddress) {
      return NextResponse.json({ error: "Token and user address are required" }, { status: 400 })
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
    })
  } catch (error) {
    console.error("Error claiming wallet:", error)
    return NextResponse.json({ error: "Failed to claim wallet" }, { status: 500 })
  }
}
