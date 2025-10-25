import { type NextRequest, NextResponse } from "next/server"
import { createWalletKeypair, deployGhostWallet } from "@/lib/stellar"
import { generateMagicLinkToken, createMagicLinkUrl, hashToken } from "@/lib/magic-link"
import { sendMagicLinkEmail, sendMagicLinkSMS } from "@/lib/email"

// In-memory storage for demo (use database in production)
const magicLinks = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientEmail, recipientPhone, amount, tokenSymbol, senderName } = body

    // Validate input
    if (!recipientEmail && !recipientPhone) {
      return NextResponse.json({ error: "Either email or phone number is required" }, { status: 400 })
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    // Create new wallet keypair
    const wallet = createWalletKeypair()

    // Deploy ghost wallet contract
    const contractAddress = await deployGhostWallet(wallet.publicKey, recipientEmail || recipientPhone || "")

    // Generate magic link token
    const token = generateMagicLinkToken()
    const magicLinkUrl = createMagicLinkUrl(token)

    // Store magic link data (use database in production)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    const hashedToken = hashToken(token)
    magicLinks.set(hashedToken, {
      walletPublicKey: wallet.publicKey,
      walletSecretKey: wallet.secretKey,
      contractAddress,
      recipientEmail: recipientEmail || null,
      recipientPhone: recipientPhone || null,
      amount,
      tokenSymbol: tokenSymbol || "USDC",
      senderName: senderName || null,
      expiresAt,
      claimed: false,
      createdAt: new Date(),
    })

    // Send magic link via email or SMS
    if (recipientEmail) {
      await sendMagicLinkEmail(recipientEmail, magicLinkUrl, amount, tokenSymbol || "USDC", senderName)
    } else if (recipientPhone) {
      await sendMagicLinkSMS(recipientPhone, magicLinkUrl, amount, tokenSymbol || "USDC")
    }

    return NextResponse.json({
      success: true,
      magicLinkUrl,
      walletAddress: wallet.publicKey,
      contractAddress,
    })
  } catch (error) {
    console.error("Error sending payment:", error)
    return NextResponse.json({ error: "Failed to send payment" }, { status: 500 })
  }
}
