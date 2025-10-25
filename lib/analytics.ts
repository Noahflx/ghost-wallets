import { listTransactions } from "./transactions"

export interface CurrencyBreakdown {
  currency: string
  total: number
}

export interface AnalyticsSnapshot {
  totals: {
    transactions: number
    claimed: number
    pending: number
    failed: number
  }
  transactionsLastHour: number
  transactionsLast24h: number
  claimRate: number
  pendingOlderThanHour: number
  pendingOlderThanDay: number
  amountByCurrency: CurrencyBreakdown[]
  pendingByCurrency: CurrencyBreakdown[]
  averageClaimSeconds: number | null
  averageClaimHumanized: string | null
  modeBreakdown: {
    simulation: number
    testnet: number
  }
  prefundedCount: number
  lastActivityAt: string | null
  lastClaimAt: string | null
  topRecipients: string[]
  generatedAt: string
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

function safeNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function addToMap(map: Map<string, number>, currency: string, amount: number) {
  const key = currency.toUpperCase()
  const current = map.get(key) ?? 0
  map.set(key, current + amount)
}

function humanizeDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "< 1 min"
  }

  const minutes = Math.round(seconds / 60)

  if (minutes < 1) {
    return "< 1 min"
  }

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) {
      return `${days}d`
    }
    return `${days}d ${remainingHours}h`
  }

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

function toBreakdown(map: Map<string, number>): CurrencyBreakdown[] {
  return Array.from(map.entries())
    .filter(([, total]) => total > 0)
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total)
}

export function computeAnalyticsSnapshot(): AnalyticsSnapshot {
  const transactions = listTransactions()
  const now = Date.now()
  const totals = {
    transactions: transactions.length,
    claimed: 0,
    pending: 0,
    failed: 0,
  }

  let transactionsLastHour = 0
  let transactionsLast24h = 0
  let pendingOlderThanHour = 0
  let pendingOlderThanDay = 0
  let prefundedCount = 0
  let lastActivityAt: string | null = null
  let lastClaimAt: string | null = null

  const amountByCurrency = new Map<string, number>()
  const pendingByCurrency = new Map<string, number>()
  const claimDurations: number[] = []
  const modeBreakdown = {
    simulation: 0,
    testnet: 0,
  }
  const recentRecipients: string[] = []
  const seenRecipients = new Set<string>()

  for (const tx of transactions) {
    const createdAt = Date.parse(tx.createdAt)
    const claimedAt = tx.claimedAt ? Date.parse(tx.claimedAt) : null
    const ageMs = Number.isFinite(createdAt) ? now - createdAt : null
    const amount = safeNumber(tx.amount)

    addToMap(amountByCurrency, tx.currency, amount)

    if (lastActivityAt === null || new Date(tx.createdAt) > new Date(lastActivityAt)) {
      lastActivityAt = tx.createdAt
    }

    if (tx.prefundTransactionHash) {
      prefundedCount += 1
    }

    if (createdAt && now - createdAt <= HOUR_MS) {
      transactionsLastHour += 1
    }

    if (createdAt && now - createdAt <= DAY_MS) {
      transactionsLast24h += 1
    }

    if (!seenRecipients.has(tx.recipient)) {
      recentRecipients.push(tx.recipient)
      seenRecipients.add(tx.recipient)
    }

    if (tx.isSimulated) {
      modeBreakdown.simulation += 1
    } else {
      modeBreakdown.testnet += 1
    }

    switch (tx.status) {
      case "claimed": {
        totals.claimed += 1
        if (claimedAt) {
          if (lastClaimAt === null || new Date(tx.claimedAt!) > new Date(lastClaimAt)) {
            lastClaimAt = tx.claimedAt!
          }
          claimDurations.push((claimedAt - createdAt) / 1000)
        }
        break
      }
      case "failed":
        totals.failed += 1
        break
      default:
        totals.pending += 1
        addToMap(pendingByCurrency, tx.currency, amount)

        if (ageMs !== null) {
          if (ageMs > HOUR_MS) {
            pendingOlderThanHour += 1
          }
          if (ageMs > DAY_MS) {
            pendingOlderThanDay += 1
          }
        }
        break
    }
  }

  const averageClaimSeconds = claimDurations.length
    ? claimDurations.reduce((sum, value) => sum + value, 0) / claimDurations.length
    : null

  return {
    totals,
    transactionsLastHour,
    transactionsLast24h,
    claimRate: totals.transactions > 0 ? totals.claimed / totals.transactions : 0,
    pendingOlderThanHour,
    pendingOlderThanDay,
    amountByCurrency: toBreakdown(amountByCurrency),
    pendingByCurrency: toBreakdown(pendingByCurrency),
    averageClaimSeconds,
    averageClaimHumanized: averageClaimSeconds ? humanizeDuration(averageClaimSeconds) : null,
    modeBreakdown,
    prefundedCount,
    lastActivityAt,
    lastClaimAt,
    topRecipients: recentRecipients.slice(0, 4),
    generatedAt: new Date(now).toISOString(),
  }
}
