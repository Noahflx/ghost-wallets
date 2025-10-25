import nodemailer from "nodemailer"

interface EmailOptions {
  senderName?: string
  expiresAt?: string
}

let cachedTransporter: nodemailer.Transporter | null | undefined

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const gmailUser = process.env.GMAIL_USER || "noahef2030@gmail.com"
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailAppPassword) {
    throw new Error(
      "GMAIL_APP_PASSWORD environment variable is required to send magic link emails",
    )
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  })

  return cachedTransporter
}

/**
 * Send magic link email to recipient using Gmail SMTP
 */
export async function sendMagicLinkEmail(
  recipientEmail: string,
  magicLinkUrl: string,
  amount: string,
  tokenSymbol: string,
  options: EmailOptions = {},
): Promise<void> {
  const transporter = getTransporter()
  const gmailUser = process.env.GMAIL_USER || "noahef2030@gmail.com"

  const senderDisplayName = options.senderName
    ? `${options.senderName} via Ghost Wallets`
    : "Ghost Wallets"

  const subject = options.senderName
    ? `${options.senderName} sent you ${amount} ${tokenSymbol}`
    : `You've received ${amount} ${tokenSymbol}`

  const expiresText = options.expiresAt
    ? `This link will expire on ${new Date(options.expiresAt).toLocaleString()}.`
    : "This link will expire in 7 days."

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin-bottom: 16px;">You've received ${amount} ${tokenSymbol}!</h2>
      <p style="margin-bottom: 16px;">
        ${options.senderName ? `<strong>${options.senderName}</strong> sent you funds via Ghost Wallets.` : "You've been sent funds via Ghost Wallets."}
      </p>
      <p style="margin-bottom: 24px;">
        Click the secure link below to claim your payment. You'll be taken to Ghost Wallets to complete the process.
      </p>
      <p style="margin-bottom: 24px;">
        <a href="${magicLinkUrl}" style="display: inline-block; padding: 12px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;">
          Claim your ${amount} ${tokenSymbol}
        </a>
      </p>
      <p style="margin-bottom: 16px;">${expiresText}</p>
      <p style="color: #64748b; font-size: 12px;">If you weren't expecting this email, you can safely ignore it.</p>
    </div>
  `

  const text = [
    options.senderName
      ? `${options.senderName} sent you ${amount} ${tokenSymbol} via Ghost Wallets.`
      : `You've received ${amount} ${tokenSymbol} via Ghost Wallets.`,
    "",
    `Claim your payment: ${magicLinkUrl}`,
    "",
    expiresText,
    "",
    "If you weren't expecting this email, you can ignore it.",
  ].join("\n")

  await transporter.sendMail({
    from: `${senderDisplayName} <${gmailUser}>`,
    to: recipientEmail,
    subject,
    text,
    html,
  })
}
