import { type NextRequest, NextResponse } from "next/server"
import { recordClaimAction, type ClaimActionType } from "@/lib/claim-actions"
import {
  acknowledgeMagicLink,
  getMagicLinkSnapshot,
  reassignMagicLinkRecipient,
  requestOwnershipChangeViaEmail,
  forwardBalanceToSmartWallet,
} from "@/lib/stellar"
import { sendNotification } from "@/lib/notifications"
import { appendTransactionEvent } from "@/lib/transactions"

interface ForwardPayload {
  recipient: string
  message?: string
  destinationWallet?: string
  emailClaim?: string
}

interface WithdrawPayload {
  fullName: string
  bankName: string
  accountNumber: string
  routingNumber?: string
  notes?: string
}

interface CashOutPayload {
  fullName: string
  country: string
  city?: string
  contact?: string
}

interface OwnerTransferPayload {
  newOwner: string
  emailClaim?: string
}

interface AnchorWithdrawPayload {
  amount: string
  assetCode: string
  destinationBank: string
  referenceId?: string
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function maskAccountNumber(accountNumber: string): string {
  const cleaned = accountNumber.replace(/\s+/g, "")
  const last4 = cleaned.slice(-4)
  return `****${last4}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = normalizeString(body.token)
    const action = normalizeString(body.action) as ClaimActionType
    const payload = body.payload ?? {}

    if (!token || !action) {
      return NextResponse.json({ error: "Token and action are required" }, { status: 400 })
    }

    const snapshot = getMagicLinkSnapshot(token)

    if (!snapshot) {
      return NextResponse.json({ error: "Unknown or expired claim link" }, { status: 404 })
    }

    if (snapshot.redeemed) {
      return NextResponse.json(
        { error: "This balance has already been fully claimed" },
        { status: 400 },
      )
    }

    switch (action) {
      case "keep": {
        acknowledgeMagicLink(token)
        const logEntry = `Recipient ${snapshot.recipient} acknowledged the claim without withdrawing.`
        const record = recordClaimAction({ token, action, payload: {}, logs: [logEntry] })

        appendTransactionEvent(record.tokenHash, {
          type: "keep",
          timestamp: new Date().toISOString(),
          data: { recipient: snapshot.recipient },
        })

        return NextResponse.json({
          success: true,
          action,
          acknowledgedAt: new Date().toISOString(),
          recordId: record.id,
        })
      }
      case "withdraw": {
        const withdrawPayload: WithdrawPayload = {
          fullName: normalizeString(payload.fullName),
          bankName: normalizeString(payload.bankName),
          accountNumber: normalizeString(payload.accountNumber),
          routingNumber: normalizeString(payload.routingNumber),
          notes: normalizeString(payload.notes),
        }

        if (!withdrawPayload.fullName || !withdrawPayload.bankName || !withdrawPayload.accountNumber) {
          return NextResponse.json(
            { error: "Full name, bank name, and account number are required" },
            { status: 400 },
          )
        }

        const maskedAccount = maskAccountNumber(withdrawPayload.accountNumber)
        const logs = [
          `Simulated bank withdrawal to ${withdrawPayload.bankName} for ${withdrawPayload.fullName}.`,
          "In production this would call an ACH provider like Wyre or Circle.",
        ]

        const record = recordClaimAction({
          token,
          action,
          payload: {
            ...withdrawPayload,
            maskedAccount,
            amount: snapshot.amount,
            currency: snapshot.currency,
          },
          logs,
        })

        appendTransactionEvent(record.tokenHash, {
          type: "withdraw-request",
          timestamp: new Date().toISOString(),
          data: {
            bankName: withdrawPayload.bankName,
            maskedAccount,
            amount: snapshot.amount,
            currency: snapshot.currency,
          },
        })

        acknowledgeMagicLink(token)

        return NextResponse.json({
          success: true,
          action,
          recordId: record.id,
          maskedAccount,
        })
      }
      case "cashout": {
        const cashOutPayload: CashOutPayload = {
          fullName: normalizeString(payload.fullName),
          country: normalizeString(payload.country),
          city: normalizeString(payload.city),
          contact: normalizeString(payload.contact),
        }

        if (!cashOutPayload.fullName || !cashOutPayload.country) {
          return NextResponse.json(
            { error: "Full name and country are required for cash out" },
            { status: 400 },
          )
        }

        const logs = [
          `Cash-out simulation recorded for ${cashOutPayload.fullName} in ${cashOutPayload.country}.`,
          "Partner integration pending for MoneyGram or local anchor payout.",
        ]

        const record = recordClaimAction({
          token,
          action,
          payload: {
            ...cashOutPayload,
            amount: snapshot.amount,
            currency: snapshot.currency,
          },
          logs,
        })

        appendTransactionEvent(record.tokenHash, {
          type: "cashout-request",
          timestamp: new Date().toISOString(),
          data: {
            country: cashOutPayload.country,
            amount: snapshot.amount,
            currency: snapshot.currency,
          },
        })

        acknowledgeMagicLink(token)

        return NextResponse.json({ success: true, action, recordId: record.id })
      }
      case "owner-transfer": {
        const ownerPayload: OwnerTransferPayload = {
          newOwner: normalizeString(payload.newOwner),
          emailClaim: normalizeString(payload.emailClaim),
        }

        if (!ownerPayload.newOwner) {
          return NextResponse.json(
            { error: "A destination Stellar address is required for ownership transfer" },
            { status: 400 },
          )
        }

        const claimProof = ownerPayload.emailClaim || snapshot.recipient
        const invocation = await requestOwnershipChangeViaEmail(token, ownerPayload.newOwner, claimProof)

        const record = recordClaimAction({
          token,
          action,
          payload: {
            ...ownerPayload,
            amount: snapshot.amount,
            currency: snapshot.currency,
            contractTxHash: invocation.txHash,
            simulated: invocation.simulated,
          },
          logs: invocation.logs,
        })

        acknowledgeMagicLink(token)

        return NextResponse.json({
          success: true,
          action,
          recordId: record.id,
          txHash: invocation.txHash,
          simulated: invocation.simulated,
        })
      }
      case "anchor-withdraw": {
        const anchorPayload: AnchorWithdrawPayload = {
          amount: normalizeString(payload.amount || snapshot.amount),
          assetCode: normalizeString(payload.assetCode || snapshot.currency),
          destinationBank: normalizeString(payload.destinationBank),
          referenceId: normalizeString(payload.referenceId),
        }

        if (!anchorPayload.destinationBank) {
          return NextResponse.json(
            { error: "Destination bank details are required for anchor withdrawal" },
            { status: 400 },
          )
        }

        const timestamp = new Date().toISOString()
        const logs = [
          `Anchor withdrawal simulated at ${timestamp}.`,
          "In production this would POST to a partner like MoneyGram or Wyre with KYC details.",
        ]

        const record = recordClaimAction({
          token,
          action,
          payload: {
            ...anchorPayload,
            amount: anchorPayload.amount,
            currency: anchorPayload.assetCode,
          },
          logs,
        })

        appendTransactionEvent(record.tokenHash, {
          type: "anchor-withdraw",
          timestamp,
          data: {
            bank: anchorPayload.destinationBank,
            amount: anchorPayload.amount,
            asset: anchorPayload.assetCode,
            referenceId: anchorPayload.referenceId,
          },
        })

        acknowledgeMagicLink(token)

        return NextResponse.json({ success: true, action, recordId: record.id, simulated: true })
      }
      case "forward": {
        const forwardPayload: ForwardPayload = {
          recipient: normalizeString(payload.recipient),
          message: normalizeString(payload.message),
          destinationWallet: normalizeString(payload.destinationWallet),
          emailClaim: normalizeString(payload.emailClaim),
        }

        if (forwardPayload.destinationWallet) {
          if (forwardPayload.destinationWallet.length < 10) {
            return NextResponse.json(
              { error: "A valid Stellar wallet address is required to forward on-chain" },
              { status: 400 },
            )
          }

          const claimProof = forwardPayload.emailClaim || snapshot.recipient
          const invocation = await forwardBalanceToSmartWallet(
            token,
            forwardPayload.destinationWallet,
            snapshot.currency,
            claimProof,
          )

          const record = recordClaimAction({
            token,
            action,
            payload: {
              ...forwardPayload,
              amount: snapshot.amount,
              currency: snapshot.currency,
              contractTxHash: invocation.txHash,
              simulated: invocation.simulated,
            },
            logs: invocation.logs,
          })

          acknowledgeMagicLink(token)

          return NextResponse.json({
            success: true,
            action,
            recordId: record.id,
            txHash: invocation.txHash,
            simulated: invocation.simulated,
          })
        }

        if (!forwardPayload.recipient) {
          return NextResponse.json(
            { error: "Please provide an email or phone number to forward funds" },
            { status: 400 },
          )
        }

        const reassigned = reassignMagicLinkRecipient(token, forwardPayload.recipient, {
          message: forwardPayload.message || snapshot.message,
          extendExpirationMs: 3 * 24 * 60 * 60 * 1000, // extend by 3 days
        })

        const record = recordClaimAction({
          token,
          action,
          payload: {
            ...forwardPayload,
            newToken: reassigned.token,
            amount: snapshot.amount,
            currency: snapshot.currency,
          },
        })

        let notificationSent = false

        if (forwardPayload.recipient.includes("@")) {
          try {
            await sendNotification(
              forwardPayload.recipient,
              reassigned.url,
              reassigned.amount,
              reassigned.currency,
              {
                senderName: snapshot.senderName,
                message: forwardPayload.message || snapshot.message,
                expiresAt: reassigned.expiresAt,
                fundingMode: reassigned.fundingMode,
                explorerUrl: reassigned.explorerUrl,
              },
            )
            notificationSent = true
          } catch (error) {
            console.error("Failed to send forwarded notification email:", error)
          }
        }

        return NextResponse.json({
          success: true,
          action,
          recordId: record.id,
          newLink: reassigned.url,
          expiresAt: reassigned.expiresAt,
          notificationSent,
        })
      }
      default:
        return NextResponse.json({ error: "Unsupported claim action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error handling claim action:", error)
    return NextResponse.json({ error: "Failed to process claim action" }, { status: 500 })
  }
}
