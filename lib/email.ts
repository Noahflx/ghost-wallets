import nodemailer from "nodemailer"
import path from "path"
import type { PaymentMode } from "./types/payments"

interface EmailOptions {
  senderName?: string
  expiresAt?: string
  message?: string
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

let cachedTransporter: nodemailer.Transporter | null | undefined

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter

  const gmailUser = process.env.GMAIL_USER || "noahef2030@gmail.com"
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD
  if (!gmailAppPassword) {
    throw new Error("Missing GMAIL_APP_PASSWORD environment variable.")
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
 * Send clean, user-facing magic link email
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

  const formattedAmount = Number(amount).toLocaleString("en-US")
  const senderDisplayName = options.senderName
    ? `${options.senderName} via Ghost Wallets`
    : "Ghost Wallets"

  const subject = options.senderName
    ? `${options.senderName} sent you ${formattedAmount} ${tokenSymbol}`
    : `You’ve received ${formattedAmount} ${tokenSymbol}`

  const expiresText = options.expiresAt
    ? `This link expires on ${new Date(options.expiresAt).toLocaleString()}.`
    : `This link expires in 7 days.`

  const messageHtml = options.message
    ? `<div style="margin: 20px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px;">
        <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.5; white-space: pre-wrap;">
          ${escapeHtml(options.message)}
        </p>
      </div>`
    : ""

    const html = `
    <div style="background-color:#f8fafc;padding:40px 0;font-family:Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;
                  box-shadow:0 2px 8px rgba(0,0,0,0.05);overflow:hidden;">
        <div style="text-align:center;padding:32px 24px 16px;">
          <img src="cid:logo" alt="Ghost Wallets" style="width:64px;height:64px;margin-bottom:16px;" />
          <h2 style="margin:0;font-size:22px;color:#0f172a;">
            You’ve received ${formattedAmount} ${tokenSymbol}!
          </h2>
        </div>
        <div style="padding:0 24px 32px;">
          <p style="margin-bottom:16px;color:#334155;font-size:15px;">
            ${
              options.senderName
                ? `<strong>${escapeHtml(options.senderName)}</strong> sent you funds via Ghost Wallets.`
                : `You’ve been sent funds via Ghost Wallets.`
            }
          </p>
          ${messageHtml}
          <p style="margin-bottom:24px;color:#334155;font-size:15px;">
            Click below to claim your payment.
          </p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${magicLinkUrl}"
              style="display:inline-block;background-color:#a78fe0;color:#ffffff;text-decoration:none;
                     padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">
              Claim ${formattedAmount} ${tokenSymbol}
            </a>
          </div>
          <p style="margin-bottom:12px;color:#64748b;font-size:13px;">${expiresText}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;" />
          <div style="text-align:center;color:#94a3b8;font-size:12px;line-height:1.6;">
            <p style="margin:4px 0;">Ghost Wallets is a Stellar-powered payment platform for seamless digital transfers.</p>
            <p style="margin:4px 0;">Built for simplicity — send crypto to anyone with just an email.</p>
            <p style="margin:8px 0 0;">© ${new Date().getFullYear()} Ghost Wallets. All rights reserved.</p>
            <p style="margin:4px 0;">
              <a href="https://ghostwallets.app" style="color:#a78fe0;text-decoration:none;">ghostwallets</a> ·
              <a href="https://twitter.com/ghostwallets" style="color:#a78fe0;text-decoration:none;">founder</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `  

  const text = [
    options.senderName
      ? `${options.senderName} sent you ${formattedAmount} ${tokenSymbol} via Ghost Wallets.`
      : `You’ve received ${formattedAmount} ${tokenSymbol} via Ghost Wallets.`,
    "",
    options.message ? `Message: ${options.message}` : "",
    "",
    `Claim your payment: ${magicLinkUrl}`,
    "",
    expiresText,
    "If you weren’t expecting this, you can ignore this email.",
  ].join("\n")

  await transporter.sendMail({
    from: `${senderDisplayName} <${gmailUser}>`,
    to: recipientEmail,
    subject,
    text,
    html,
    attachments: [
      {
        filename: "logo.png",
        path: path.join(process.cwd(), "public", "logo.png"),
        cid: "logo",
      },
    ],
  })
}
