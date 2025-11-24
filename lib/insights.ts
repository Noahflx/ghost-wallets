import { computeAnalyticsSnapshot, type AnalyticsSnapshot } from "./analytics"
import { listTransactions, type TransactionEvent, type TransactionRecord } from "./transactions"

export interface DiagnosticsIssue {
  id: string
  severity: "info" | "warning" | "critical"
  title: string
  summary: string
  affectedTransactions: string[]
}

export interface DiagnosticsReport {
  healthScore: number
  issues: DiagnosticsIssue[]
  generatedAt: string
}

export interface QualityGateResult {
  id: string
  title: string
  status: "pass" | "warn" | "fail"
  details: string
  metric: string
}

export interface LineageStep {
  transactionId: string
  type: string
  timestamp: string
  description: string
  metadata?: Record<string, unknown>
}

export interface LineageReplay {
  transactionId: string
  steps: LineageStep[]
}

export interface CashflowBucket {
  date: string
  currency: string
  total: number
}

export interface CashflowModel {
  realized: CashflowBucket[]
  projected: CashflowBucket[]
  horizonDays: number
  methodology: string
}

export interface AnomalyResult {
  id: string
  metric: string
  value: number
  threshold: number
  direction: "high" | "low"
  transactionId?: string
  context: string
}

export interface InsightPayload {
  diagnostics: DiagnosticsReport
  quality: QualityGateResult[]
  lineage: LineageStep[]
  replay: LineageReplay[]
  cashflow: CashflowModel
  anomalies: AnomalyResult[]
  narratives: string[]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function buildDiagnostics(snapshot: AnalyticsSnapshot, transactions: TransactionRecord[]): DiagnosticsReport {
  const issues: DiagnosticsIssue[] = []

  const stalePending = transactions.filter((tx) => tx.status === "sent" && Date.now() - Date.parse(tx.createdAt) > 60 * 60 * 1000)
  if (stalePending.length > 0) {
    issues.push({
      id: "stale-pending",
      severity: stalePending.length > 3 ? "critical" : "warning",
      title: "Pending transactions aging",
      summary: `${stalePending.length} transactions have been pending for over an hour. Consider investigating email delivery or claim issues.`,
      affectedTransactions: stalePending.map((tx) => tx.id),
    })
  }

  const failed = transactions.filter((tx) => tx.status === "failed")
  if (failed.length > 0) {
    issues.push({
      id: "failures-present",
      severity: failed.length > 1 ? "critical" : "warning",
      title: "Failures detected",
      summary: `${failed.length} transactions have failed. Review funding mode logs for more detail.`,
      affectedTransactions: failed.map((tx) => tx.id),
    })
  }

  if (snapshot.claimRate < 0.7 && snapshot.totals.transactions > 3) {
    issues.push({
      id: "low-claim-rate",
      severity: "warning",
      title: "Low claim conversion",
      summary: `Claim rate is ${(snapshot.claimRate * 100).toFixed(1)}%. Recipients may need reminders or improved messaging.`,
      affectedTransactions: transactions.filter((tx) => tx.status !== "claimed").map((tx) => tx.id),
    })
  }

  const healthScore = clamp(
    100 - issues.reduce((score, issue) => score + (issue.severity === "critical" ? 30 : issue.severity === "warning" ? 15 : 0), 0),
    35,
    99,
  )

  return { healthScore, issues, generatedAt: new Date().toISOString() }
}

function evaluateQualityGates(snapshot: AnalyticsSnapshot): QualityGateResult[] {
  const gates: QualityGateResult[] = []

  const claimRatePct = snapshot.claimRate * 100
  gates.push({
    id: "claim-rate",
    title: "Claim rate >= 80%",
    status: claimRatePct >= 80 ? "pass" : claimRatePct >= 65 ? "warn" : "fail",
    details: `Current claim rate is ${claimRatePct.toFixed(1)}%.`,
    metric: claimRatePct.toFixed(1),
  })

  const avgClaimSeconds = snapshot.averageClaimSeconds ?? 0
  gates.push({
    id: "claim-latency",
    title: "Claims within 1 hour",
    status: avgClaimSeconds <= 3600 ? "pass" : avgClaimSeconds <= 3 * 3600 ? "warn" : "fail",
    details: snapshot.averageClaimHumanized ? `Average time to claim is ${snapshot.averageClaimHumanized}.` : "No claims recorded yet.",
    metric: avgClaimSeconds.toFixed(0),
  })

  gates.push({
    id: "stale-pending",
    title: "Pending older than a day",
    status: snapshot.pendingOlderThanDay === 0 ? "pass" : snapshot.pendingOlderThanDay <= 2 ? "warn" : "fail",
    details: `${snapshot.pendingOlderThanDay} pending transfers are older than 24 hours.`,
    metric: snapshot.pendingOlderThanDay.toString(),
  })

  gates.push({
    id: "mode-coverage",
    title: "Testnet coverage",
    status: snapshot.modeBreakdown.testnet > 0 ? "pass" : "warn",
    details: snapshot.modeBreakdown.testnet > 0
      ? `${snapshot.modeBreakdown.testnet} testnet transfers captured.`
      : "Only simulation transfers observed. Add at least one live testnet transfer for parity.",
    metric: snapshot.modeBreakdown.testnet.toString(),
  })

  return gates
}

function buildLineageSteps(transactions: TransactionRecord[]): LineageStep[] {
  const steps: LineageStep[] = []

  for (const tx of transactions) {
    const baseEvents: TransactionEvent[] = tx.events.length
      ? tx.events
      : [
          { type: "transaction-recorded", timestamp: tx.createdAt },
          { type: tx.status === "claimed" ? "claimed" : "pending", timestamp: tx.updatedAt },
        ]

    for (const event of baseEvents) {
      steps.push({
        transactionId: tx.id,
        type: event.type,
        timestamp: event.timestamp,
        description: `Event ${event.type} for ${tx.recipient}`,
        metadata: event.data,
      })
    }
  }

  return steps.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
}

function buildReplay(transactions: TransactionRecord[]): LineageReplay[] {
  return transactions.map((tx) => ({
    transactionId: tx.id,
    steps: buildLineageSteps([tx]),
  }))
}

function bucketByDay(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`
}

function buildCashflowModel(transactions: TransactionRecord[], horizonDays = 7): CashflowModel {
  const realizedMap = new Map<string, Map<string, number>>()

  for (const tx of transactions) {
    const bucket = bucketByDay(tx.createdAt)
    if (!realizedMap.has(bucket)) {
      realizedMap.set(bucket, new Map())
    }
    const perCurrency = realizedMap.get(bucket)!
    perCurrency.set(tx.currency, (perCurrency.get(tx.currency) ?? 0) + Number(tx.amount))
  }

  const realized: CashflowBucket[] = []
  for (const [date, currencyMap] of realizedMap.entries()) {
    for (const [currency, total] of currencyMap.entries()) {
      realized.push({ date, currency, total })
    }
  }
  realized.sort((a, b) => (a.date > b.date ? 1 : -1))

  // simple projection using moving average of last 3 buckets per currency
  const projected: CashflowBucket[] = []
  const currencyBuckets = new Map<string, CashflowBucket[]>()
  for (const bucket of realized) {
    const arr = currencyBuckets.get(bucket.currency) ?? []
    arr.push(bucket)
    currencyBuckets.set(bucket.currency, arr)
  }

  const today = new Date()
  for (const [currency, buckets] of currencyBuckets.entries()) {
    const lastValues = buckets.slice(-3).map((b) => b.total)
    const avg = lastValues.length ? lastValues.reduce((sum, v) => sum + v, 0) / lastValues.length : 0

    for (let i = 1; i <= horizonDays; i += 1) {
      const future = new Date(today)
      future.setDate(today.getDate() + i)
      const date = bucketByDay(future.toISOString())
      projected.push({ date, currency, total: Number(avg.toFixed(2)) })
    }
  }

  return {
    realized,
    projected,
    horizonDays,
    methodology: "Moving average projection using recent transfer volume per currency",
  }
}

function detectAnomalies(transactions: TransactionRecord[]): AnomalyResult[] {
  const anomalies: AnomalyResult[] = []
  if (transactions.length === 0) return anomalies

  const amounts = transactions.map((tx) => Number(tx.amount)).filter((value) => Number.isFinite(value))
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length
  const variance = amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length
  const stdDev = Math.sqrt(variance)
  const upper = mean + 2.5 * stdDev
  const lower = Math.max(mean - 2.5 * stdDev, 0)

  for (const tx of transactions) {
    const value = Number(tx.amount)
    if (!Number.isFinite(value)) continue
    if (value > upper) {
      anomalies.push({
        id: `high-${tx.id}`,
        metric: "amount",
        value,
        threshold: upper,
        direction: "high",
        transactionId: tx.id,
        context: `${tx.currency} amount ${value} is unusually high compared to typical transfers.`,
      })
    } else if (value < lower) {
      anomalies.push({
        id: `low-${tx.id}`,
        metric: "amount",
        value,
        threshold: lower,
        direction: "low",
        transactionId: tx.id,
        context: `${tx.currency} amount ${value} is unusually low compared to typical transfers.`,
      })
    }
  }

  return anomalies
}

function buildNarratives(snapshot: AnalyticsSnapshot, anomalies: AnomalyResult[], cashflow: CashflowModel): string[] {
  const narratives: string[] = []

  const latestCashflow = cashflow.realized.slice(-1)[0]
  if (latestCashflow) {
    narratives.push(
      `Processed ${latestCashflow.currency} ${latestCashflow.total.toFixed(2)} on ${latestCashflow.date}. Pending conversions: ${snapshot.pendingOlderThanHour}.`,
    )
  }

  narratives.push(
    `Claim conversion sits at ${(snapshot.claimRate * 100).toFixed(1)}% with ${snapshot.totals.transactions} total transfers and ${snapshot.totals.claimed} claims.`,
  )

  if (anomalies.length > 0) {
    const high = anomalies.filter((a) => a.direction === "high")
    narratives.push(`Detected ${anomalies.length} anomalies (${high.length} high-value). Review for fraud risk.`)
  } else {
    narratives.push("No anomalies detected across recent transfers based on dynamic thresholds.")
  }

  narratives.push(
    cashflow.projected.length > 0
      ? `Projected ${cashflow.horizonDays}-day runway shows steady average outflow of ${(cashflow.projected[0]?.total ?? 0).toFixed(2)} per day using moving averages.`
      : "Not enough data to generate a projection yet.",
  )

  return narratives
}

export function buildInsights(): InsightPayload {
  const snapshot = computeAnalyticsSnapshot()
  const transactions = listTransactions()
  const diagnostics = buildDiagnostics(snapshot, transactions)
  const quality = evaluateQualityGates(snapshot)
  const lineage = buildLineageSteps(transactions)
  const replay = buildReplay(transactions)
  const cashflow = buildCashflowModel(transactions)
  const anomalies = detectAnomalies(transactions)
  const narratives = buildNarratives(snapshot, anomalies, cashflow)

  return { diagnostics, quality, lineage, replay, cashflow, anomalies, narratives }
}
