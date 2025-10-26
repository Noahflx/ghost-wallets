import { NextRequest, NextResponse } from "next/server"

import { getStellarRuntimeDetails, type StellarRuntimeDetails } from "@/lib/stellar"
import { setPaymentMode } from "@/lib/config/payment-mode"
import type { PaymentMode } from "@/lib/types/payments"

function formatRuntime(runtime: StellarRuntimeDetails) {
  return {
    mode: runtime.mode,
    demo: runtime.mode === "simulation",
    rpcUrl: runtime.rpcUrl,
    networkPassphrase: runtime.networkPassphrase,
    friendbotUrl: runtime.friendbotUrlBase,
    treasurySecretConfigured: runtime.treasurySecretConfigured,
    requiresTreasurySecret: runtime.mode !== "simulation",
    availableModes: ["simulation", "testnet", "sandbox"],
  }
}

function normalizeRequestedMode(value: unknown): PaymentMode | null {
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase()

    if (lowered === "simulation" || lowered === "testnet" || lowered === "sandbox") {
      return lowered
    }

    if (lowered === "demo" || lowered === "off") {
      return "simulation"
    }

    if (lowered === "on" || lowered === "live") {
      return "testnet"
    }

    if (lowered === "true") {
      return "simulation"
    }

    if (lowered === "false") {
      return "testnet"
    }
  }

  if (typeof value === "boolean") {
    return value ? "simulation" : "testnet"
  }

  return null
}

export async function GET() {
  const runtime = getStellarRuntimeDetails()
  return NextResponse.json(formatRuntime(runtime))
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch (error) {
    body = null
  }

  const payload = (body && typeof body === "object" ? body : {}) as Record<string, unknown>
  const requested =
    normalizeRequestedMode(payload.mode ?? payload.target ?? payload.state) ??
    normalizeRequestedMode(payload.demo)

  if (!requested) {
    return NextResponse.json(
      {
        error:
          "Specify a payment mode ('simulation', 'testnet', or 'sandbox') or pass demo=true/false to toggle the switch.",
      },
      { status: 400 },
    )
  }

  if ((requested === "testnet" || requested === "sandbox") && !process.env.STELLAR_TREASURY_SECRET_KEY) {
    return NextResponse.json(
      {
        error: `Switching to ${requested} mode requires STELLAR_TREASURY_SECRET_KEY to be configured on the server.`,
        missingEnvironment: "STELLAR_TREASURY_SECRET_KEY",
      },
      { status: 400 },
    )
  }

  setPaymentMode(requested)

  const runtime = getStellarRuntimeDetails()
  return NextResponse.json({ ...formatRuntime(runtime), updated: true })
}
