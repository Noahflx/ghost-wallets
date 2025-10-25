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
    <div style="background-color: #f8fafc; padding: 40px 0; font-family: Arial, sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
        <div style="text-align: center; padding: 32px 24px 16px;">
          <img src="cid:logo" alt="Ghost Wallets" style="width: 64px; height: 64px; margin-bottom: 16px;" />
          <h2 style="margin: 0; font-size: 22px; color: #0f172a;">You've received ${amount} ${tokenSymbol}!</h2>
        </div>
        <div style="padding: 0 24px 32px;">
          <p style="margin-bottom: 16px; color: #334155; font-size: 15px;">
            ${
              options.senderName
                ? `<strong>${options.senderName}</strong> sent you funds via Ghost Wallets.`
                : "You've been sent funds via Ghost Wallets."
            }
          </p>
          <p style="margin-bottom: 24px; color: #334155; font-size: 15px;">
            Click the secure link below to claim your payment. You'll be taken to Ghost Wallets to complete the process.
          </p>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${magicLinkUrl}" 
              style="display: inline-block; background-color: #a78fe0; color: #ffffff; text-decoration: none; 
                     padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px;">
              Claim your ${amount} ${tokenSymbol}
            </a>
          </div>
          <p style="margin-bottom: 12px; color: #64748b; font-size: 13px;">${expiresText}</p>
          <p style="color: #94a3b8; font-size: 12px;">If you weren't expecting this email, you can safely ignore it.</p>
        </div>
      </div>
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
