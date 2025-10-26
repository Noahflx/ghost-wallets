import crypto from "crypto"

export interface MagicLinkData {
  token: string
  walletPublicKey: string
  recipientEmail: string
  amount: string
  tokenSymbol: string
  expiresAt: Date
}

/**
 * Generate a secure magic link token
 */
export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Create a magic link URL
 */
export function createMagicLinkUrl(token: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://ghost-wallets.vercel.app"
  return `${baseUrl}/claim/${token}`
}

/**
 * Verify magic link token expiration
 */
export function isMagicLinkExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Hash a token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}
