// Notification service for sending emails

import { sendMagicLinkEmail } from "./email"
import type { PaymentMode } from "./types/payments"

interface NotificationOptions {
  senderName?: string
  expiresAt?: string
  fundingMode: PaymentMode
  explorerUrl?: string
}

/**
 * Sends an email notification to the recipient with the magic link
 */
export async function sendNotification(
  recipient: string,
  magicLink: string,
  amount: string,
  currency: string,
  options: NotificationOptions = {},
): Promise<void> {
  if (!recipient.includes("@")) {
    throw new Error("Email notifications are the only supported channel")
  }

  await sendMagicLinkEmail(recipient, magicLink, amount, currency, {
    senderName: options.senderName,
    expiresAt: options.expiresAt,
    fundingMode: options.fundingMode ?? "simulation",
    explorerUrl: options.explorerUrl,
  })
}
