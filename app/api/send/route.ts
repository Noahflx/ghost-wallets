import { type NextRequest, NextResponse } from "next/server"
import { createWallet, sendPayment, generateMagicLink } from "@/lib/stellar"
import { sendNotification } from "@/lib/notifications"
import { recordTransaction } from "@/lib/transactions"
import { enforceRateLimit } from "@/lib/rate-limit"

const SUPPORTED_CURRENCIES = new Set(["USDC", "PYUSD", "XLM"])
const MAX_SEND_AMOUNT = Number(process.env.NEXT_PUBLIC_MAX_SEND_AMOUNT ?? 10000)
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5

function extractClientIdentifier(request: NextRequest): string {
  const header = request.headers.get("x-forwarded-for")
  if (!header) {
    return request.ip ?? "anonymous"
  }

  return header.split(",")[0]?.trim() || request.ip || "anonymous"
}

function normalizeAmount(raw: string, currency: string): string {
  const parsed = Number(raw)

  if (!Number.isFinite(parsed)) {
    throw new Error("Amount must be numeric")
  }

  const decimals = currency === "XLM" ? 7 : 2
  return parsed.toFixed(decimals).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")
}

function validateEmail(email: string): boolean {
  const trimmed = email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  return emailRegex.test(trimmed)
}

export async function POST(request: NextRequest) {
  try {
    const { recipient, amount, currency, senderName, message } = await request.json()

    const identifier = `send:${extractClientIdentifier(request)}`
    const rateLimit = enforceRateLimit(identifier, {
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many send attempts. Please try again shortly." },
        {
          status: 429,
          headers: { "retry-after": Math.ceil(rateLimit.retryAfterMs / 1000).toString() },
        },
      )
    }

    // Validate input
    if (!recipient || !amount || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sanitizedRecipient = recipient.trim()

    if (!validateEmail(sanitizedRecipient)) {
      return NextResponse.json({ error: "A valid email recipient is required." }, { status: 400 })
    }

    const normalizedCurrency = typeof currency === "string" ? currency.trim().toUpperCase() : ""

    if (!SUPPORTED_CURRENCIES.has(normalizedCurrency)) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 })
    }

    let normalizedAmount: string
    try {
      normalizedAmount = normalizeAmount(amount, normalizedCurrency)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Amount is invalid" },
        { status: 400 },
      )
    }

    const numericAmount = Number(normalizedAmount)

    if (numericAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 })
    }

    if (Number.isFinite(MAX_SEND_AMOUNT) && numericAmount > MAX_SEND_AMOUNT) {
      return NextResponse.json(
        { error: `Amount exceeds the server limit of ${MAX_SEND_AMOUNT.toLocaleString()} units.` },
        { status: 400 },
      )
    }

    const sanitizedSenderName = typeof senderName === "string" ? senderName.trim().slice(0, 120) : undefined
    const trimmedMessage = typeof message === "string" ? message.trim() : undefined
    const sanitizedMessage = trimmedMessage && trimmedMessage.length > 0 ? trimmedMessage.slice(0, 500) : undefined

    // Create a new smart wallet for the recipient
    const wallet = await createWallet(sanitizedRecipient)
    console.log("[v0] Created wallet:", wallet.address)

    // Send payment to the wallet
    const paymentResult = await sendPayment(wallet.address, normalizedAmount, normalizedCurrency)
    console.log("[v0] Payment sent, tx hash:", paymentResult.txHash)

    // Generate magic link for recipient
    const magicLink = await generateMagicLink(
      sanitizedRecipient,
      wallet,
      normalizedAmount,
      normalizedCurrency,
      paymentResult.txHash,
      {
        contractAddress: wallet.contractAddress,
        senderName: sanitizedSenderName,
        message: sanitizedMessage,
        fundingMode: paymentResult.mode,
        explorerUrl: paymentResult.explorerUrl,
      },
    )
    console.log("[v0] Generated magic link:", magicLink.url)

    recordTransaction({
      recipient: sanitizedRecipient,
      amount: normalizedAmount,
      currency: normalizedCurrency,
      walletAddress: wallet.address,
      transactionHash: paymentResult.txHash,
      magicLinkUrl: magicLink.url,
      magicLinkTokenHash: magicLink.hashedToken,
      senderName: sanitizedSenderName,
      message: sanitizedMessage,
      fundingMode: paymentResult.mode,
      explorerUrl: paymentResult.explorerUrl,
      isSimulated: paymentResult.isSimulated,
      prefundTransactionHash: wallet.prefund?.txHash,
      prefundLedger: wallet.prefund?.ledger,
      prefundedAt: wallet.prefund?.fundedAt,
    })

    // Send notification email
    await sendNotification(sanitizedRecipient, magicLink.url, normalizedAmount, normalizedCurrency, {
      senderName: sanitizedSenderName,
      message: sanitizedMessage,
      expiresAt: magicLink.expiresAt,
      fundingMode: paymentResult.mode,
      explorerUrl: paymentResult.explorerUrl,
    })

    return NextResponse.json({
      success: true,
      walletAddress: wallet.address,
      transactionHash: paymentResult.txHash,
      magicLinkUrl: magicLink.url,
      magicLinkExpiresAt: magicLink.expiresAt,
      paymentMode: paymentResult.mode,
      explorerUrl: paymentResult.explorerUrl ?? null,
      simulated: paymentResult.isSimulated,
      prefund: wallet.prefund ?? null,
    })
  } catch (error) {
    console.error("[v0] Error in send API:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
