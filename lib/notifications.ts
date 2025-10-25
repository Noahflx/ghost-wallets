// Notification service for sending emails and SMS

/**
 * Sends a notification (email or SMS) to the recipient with the magic link
 */
export async function sendNotification(
  recipient: string,
  magicLink: string,
  amount: string,
  currency: string,
): Promise<void> {
  // TODO: Implement email/SMS sending
  // 1. Detect if recipient is email or phone
  // 2. Send via appropriate service (SendGrid, Twilio, etc.)
  // 3. Include magic link and amount details

  const isEmail = recipient.includes("@")

  console.log("[v0] Sending notification:", {
    type: isEmail ? "email" : "sms",
    recipient,
    amount,
    currency,
    magicLink,
  })

  // Mock implementation
  if (isEmail) {
    console.log("[v0] Would send email to:", recipient)
  } else {
    console.log("[v0] Would send SMS to:", recipient)
  }
}
