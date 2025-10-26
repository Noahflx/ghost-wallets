import { Networks } from "@stellar/stellar-sdk"

import type { PaymentMode } from "@/lib/types/payments"
import { readJsonFile, writeJsonFile } from "@/lib/storage/filesystem"

const STORAGE_FILE = "payment-mode.json"

const VALID_MODES: PaymentMode[] = ["simulation", "testnet", "sandbox"]

function isPaymentMode(value: unknown): value is PaymentMode {
  return typeof value === "string" && (VALID_MODES as string[]).includes(value)
}

interface PersistedMode {
  mode: PaymentMode
  updatedAt: string
}

export interface PaymentEnvironment {
  mode: PaymentMode
  rpcUrl: string
  networkPassphrase: string
  friendbotUrl: string
}

function normalizeMode(value: unknown, fallback: PaymentMode): PaymentMode {
  if (isPaymentMode(value)) {
    return value
  }

  if (typeof value === "string") {
    const lowered = value.toLowerCase()
    if (isPaymentMode(lowered)) {
      return lowered
    }

    if (lowered === "demo" || lowered === "off") {
      return "simulation"
    }

    if (lowered === "live" || lowered === "on") {
      return "testnet"
    }
  }

  return fallback
}

const initialMode = (() => {
  const persisted = readJsonFile<PersistedMode | null>(STORAGE_FILE, null)

  if (persisted && isPaymentMode(persisted.mode)) {
    return persisted.mode
  }

  return normalizeMode(process.env.STELLAR_PAYMENT_MODE, "simulation")
})()

let currentMode: PaymentMode = initialMode

const listeners = new Set<(mode: PaymentMode) => void>()

function persistMode(mode: PaymentMode) {
  const payload: PersistedMode = {
    mode,
    updatedAt: new Date().toISOString(),
  }
  writeJsonFile(STORAGE_FILE, payload)
}

function computeRpcUrl(mode: PaymentMode): string {
  if (process.env.STELLAR_RPC_URL) {
    return process.env.STELLAR_RPC_URL
  }

  if (mode === "sandbox") {
    return "http://localhost:8000/soroban/rpc"
  }

  return "https://soroban-testnet.stellar.org"
}

function computeFriendbotUrl(mode: PaymentMode): string {
  const base =
    process.env.STELLAR_FRIENDBOT_URL ||
    (mode === "sandbox" ? "http://localhost:8000/friendbot" : "https://friendbot.stellar.org")

  return base.replace(/\/$/, "")
}

function computeNetworkPassphrase(mode: PaymentMode): string {
  return mode === "sandbox" ? "Standalone Network ; February 2017" : Networks.TESTNET
}

export function getPaymentMode(): PaymentMode {
  return currentMode
}

export function setPaymentMode(mode: PaymentMode): PaymentMode {
  if (!isPaymentMode(mode)) {
    throw new Error("Unsupported payment mode")
  }

  if (currentMode === mode) {
    return currentMode
  }

  currentMode = mode
  persistMode(mode)

  for (const listener of listeners) {
    listener(mode)
  }

  return currentMode
}

export function updatePaymentMode(mode: unknown): PaymentMode {
  const normalized = normalizeMode(mode, currentMode)
  return setPaymentMode(normalized)
}

export function onPaymentModeChange(listener: (mode: PaymentMode) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function describePaymentEnvironment(): PaymentEnvironment {
  const mode = getPaymentMode()

  return {
    mode,
    rpcUrl: computeRpcUrl(mode),
    networkPassphrase: computeNetworkPassphrase(mode),
    friendbotUrl: computeFriendbotUrl(mode),
  }
}

