import { type NextRequest, NextResponse } from "next/server"
import { createWallet, sendPayment, generateMagicLink } from "@/lib/stellar"
import { sendNotification } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const { recipient, amount, currency } = await request.json()

    // Validate input
    if (!recipient || !amount || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create a new smart wallet for the recipient
    const wallet = await createWallet(recipient)
    console.log("[v0] Created wallet:", wallet.address)

    // Send payment to the wallet
    const txHash = await sendPayment(wallet.address, amount, currency)
    console.log("[v0] Payment sent, tx hash:", txHash)

    // Generate magic link for recipient
    const magicLink = await generateMagicLink(recipient, wallet.address, amount, currency)
    console.log("[v0] Generated magic link:", magicLink)

    // Send notification (email/SMS)
    await sendNotification(recipient, magicLink, amount, currency)

    return NextResponse.json({
      success: true,
      walletAddress: wallet.address,
      transactionHash: txHash,
    })
  } catch (error) {
    console.error("[v0] Error in send API:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
