import { type NextRequest, NextResponse } from "next/server"
import { recordClaimAction, type ClaimActionType } from "@/lib/claim-actions"
import {
  acknowledgeMagicLink,
  getMagicLinkSnapshot,
  reassignMagicLinkRecipient,
} from "@/lib/stellar"
import { sendNotification } from "@/lib/notifications"

interface ForwardPayload {
  recipient: string
  message?: string
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
        const record = recordClaimAction({ token, action, payload: {} })

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

        const record = recordClaimAction({
          token,
          action,
          payload: {
            ...withdrawPayload,
            maskedAccount: maskAccountNumber(withdrawPayload.accountNumber),
            amount: snapshot.amount,
            currency: snapshot.currency,
          },
        })

        acknowledgeMagicLink(token)

        return NextResponse.json({
          success: true,
          action,
          recordId: record.id,
          maskedAccount: maskAccountNumber(withdrawPayload.accountNumber),
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

        const record = recordClaimAction({
          token,
          action,
          payload: {
            ...cashOutPayload,
            amount: snapshot.amount,
            currency: snapshot.currency,
          },
        })

        acknowledgeMagicLink(token)

        return NextResponse.json({ success: true, action, recordId: record.id })
      }
      case "forward": {
        const forwardPayload: ForwardPayload = {
          recipient: normalizeString(payload.recipient),
          message: normalizeString(payload.message),
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
