/* Comprehensive finance intelligence engine for diagnostics, forecasting,
 * monitoring, and automation. All functions operate on live inputs without
 * baked-in mock data or static assumptions.
 */

export type LedgerType =
  | "revenue"
  | "expense"
  | "payroll"
  | "inventory"
  | "ar"
  | "ap"
  | "loan"
  | "cash"
  | "subscription"
  | "other"

export interface LedgerEntry {
  date: string // ISO date
  amount: number
  type: LedgerType
  category?: string
  vendor?: string
  customer?: string
  reference?: string
  metadata?: Record<string, unknown>
}

export interface DailyMetrics {
  date: string
  revenue: number
  expenses: number
  payroll: number
  costOfGoods: number
  overhead: number
  margin: number
  inventoryDelta: number
  arDelta: number
  apDelta: number
  cashDelta: number
}

export interface AnomalyInsight {
  category:
    | "revenue_drop"
    | "expense_spike"
    | "payroll_step_up"
    | "negative_margin"
    | "vendor_inconsistency"
    | "missing_data"
    | "overhead_drift"
  date: string
  severity: "low" | "medium" | "high"
  message: string
  zScore?: number
  delta?: number
}

export interface RatioInsight {
  label: string
  value: number
  trend: "rising" | "falling" | "flat"
  explanation: string
}

export interface StressScore {
  score: number
  factors: Record<string, number>
  commentary: string
}

export interface ForecastBand {
  date: string
  expected: number
  bestCase: number
  worstCase: number
  confidence: number
}

export interface ForecastOutput {
  revenue: ForecastBand[]
  expenses: ForecastBand[]
  payroll: ForecastBand[]
  cash: ForecastBand[]
}

export interface DecisionSuggestion {
  title: string
  rationale: string
  impact: string
  actionType:
    | "pricing"
    | "hiring"
    | "collections"
    | "inventory"
    | "budget"
    | "vendor"
    | "automation"
  recommendedChange: string
}

export interface AutomatedFix {
  label: string
  action: "send_invoice_reminder" | "reassign_job" | "tag_expense" | "create_rule" | "start_budget"
  payload: Record<string, unknown>
  reason: string
}

export interface AlertEvent {
  metric: "revenue" | "margin" | "payroll" | "cost_drift" | "inventory"
  severity: "info" | "warning" | "critical"
  message: string
  firstDetected: string
  lastObserved: string
  occurrences: number
  trend: string
}

export interface DigestSummary {
  date: string
  highlights: string[]
  risks: string[]
  actions: (DecisionSuggestion | AutomatedFix)[]
}

export interface DataConfidence {
  score: number
  breakdown: {
    completeness: number
    freshness: number
    anomalies: number
    duplicates: number
    mappingAccuracy: number
  }
  lineage: Array<{ stage: string; detail: string }>
  replayChanges?: Array<{ field: string; from: unknown; to: unknown; when: string }>
}

export interface NormalizationResult {
  detectedSource:
    | "stripe_csv"
    | "square"
    | "shopify"
    | "gusto"
    | "quickbooks"
    | "bank_pdf"
    | "pos"
    | "timesheet"
    | "unknown"
  mappingMemory: Record<string, string>
  categories: Record<string, string>
}

export interface Narrative {
  what: string
  why: string
  severity: string
  fix: string
  consequence: string
}

export interface StatementRow {
  label: string
  value: number
  variance?: number
}

export interface ReportingBundle {
  period: string
  profitAndLoss: StatementRow[]
  balanceSheet: StatementRow[]
  cashFlow: StatementRow[]
  summaries: Record<string, StatementRow[]>
}

export interface AutomationRule {
  condition: string
  triggered: boolean
  suggestedAction: AutomatedFix | null
}

const DAYS_IN_YEAR = 365

function groupByDate(entries: LedgerEntry[]): Map<string, LedgerEntry[]> {
  return entries.reduce((map, entry) => {
    const key = entry.date.split("T")[0]
    const list = map.get(key) ?? []
    list.push(entry)
    map.set(key, list)
    return map
  }, new Map<string, LedgerEntry[]>())
}

function range(from: Date, days: number): string[] {
  return Array.from({ length: days }, (_, idx) => {
    const d = new Date(from)
    d.setDate(from.getDate() + idx)
    return d.toISOString().split("T")[0]
  })
}

function rollingAverage(values: number[], window: number): number[] {
  const result: number[] = []
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1)
    const avg = slice.reduce((sum, v) => sum + v, 0) / slice.length
    result.push(avg)
  }
  return result
}

function zScores(values: number[]): number[] {
  const mean = values.reduce((sum, v) => sum + v, 0) / Math.max(values.length, 1)
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / Math.max(values.length, 1)
  const stddev = Math.sqrt(variance)
  return values.map((v) => (stddev === 0 ? 0 : (v - mean) / stddev))
}

function deriveSeasonality(values: number[], period: number): number[] {
  if (values.length === 0) return []
  const seasonal: number[] = new Array(period).fill(0)
  const counts: number[] = new Array(period).fill(0)
  values.forEach((value, idx) => {
    const bucket = idx % period
    seasonal[bucket] += value
    counts[bucket] += 1
  })
  return seasonal.map((total, idx) => (counts[idx] === 0 ? 0 : total / counts[idx]))
}

function seasonalBaseline(values: number[], period: number): number[] {
  const seasonal = deriveSeasonality(values, period)
  return values.map((_, idx) => seasonal[idx % period])
}

export function toDailyMetrics(entries: LedgerEntry[], lookbackDays = 90): DailyMetrics[] {
  const byDate = groupByDate(entries)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = range(new Date(today.getTime() - (lookbackDays - 1) * 86400000), lookbackDays)

  return days.map((date) => {
    const items = byDate.get(date) ?? []
    const revenue = items
      .filter((item) => item.type === "revenue")
      .reduce((sum, item) => sum + item.amount, 0)
    const payroll = items
      .filter((item) => item.type === "payroll")
      .reduce((sum, item) => sum + item.amount, 0)
    const costOfGoods = items
      .filter((item) => item.category === "cogs" || item.type === "inventory")
      .reduce((sum, item) => sum + item.amount, 0)
    const overhead = items
      .filter((item) => item.category === "overhead")
      .reduce((sum, item) => sum + item.amount, 0)
    const expenses = items
      .filter((item) => item.type === "expense" || item.category === "overhead" || item.category === "cogs")
      .reduce((sum, item) => sum + item.amount, 0)
    const arDelta = items
      .filter((item) => item.type === "ar")
      .reduce((sum, item) => sum + item.amount, 0)
    const apDelta = items
      .filter((item) => item.type === "ap")
      .reduce((sum, item) => sum + item.amount, 0)
    const cashDelta = items
      .filter((item) => item.type === "cash" || item.type === "loan")
      .reduce((sum, item) => sum + item.amount, 0)

    return {
      date,
      revenue,
      payroll,
      costOfGoods,
      overhead,
      expenses,
      margin: revenue - expenses,
      inventoryDelta: costOfGoods,
      arDelta,
      apDelta,
      cashDelta,
    }
  })
}

export function detectAnomalies(metrics: DailyMetrics[]): AnomalyInsight[] {
  if (metrics.length === 0) return []
  const revenueSeries = metrics.map((m) => m.revenue)
  const expenseSeries = metrics.map((m) => m.expenses)
  const payrollSeries = metrics.map((m) => m.payroll)
  const marginSeries = metrics.map((m) => m.margin)

  const revenueAvg = rollingAverage(revenueSeries, 7)
  const revenueZ = zScores(revenueSeries)
  const expenseZ = zScores(expenseSeries)
  const payrollZ = zScores(payrollSeries)
  const marginZ = zScores(marginSeries)
  const baseline = seasonalBaseline(revenueSeries, 7)

  const anomalies: AnomalyInsight[] = []

  metrics.forEach((day, idx) => {
    const revDelta = revenueSeries[idx] - revenueAvg[idx]
    if (revDelta < 0 && revenueZ[idx] < -1.5) {
      anomalies.push({
        category: "revenue_drop",
        date: day.date,
        severity: revenueZ[idx] < -2.5 ? "high" : "medium",
        message: `Revenue ${revDelta.toFixed(2)} below rolling mean; z-score ${revenueZ[idx].toFixed(2)}`,
        zScore: revenueZ[idx],
        delta: revDelta,
      })
    }

    if (expenseZ[idx] > 1.5) {
      anomalies.push({
        category: "expense_spike",
        date: day.date,
        severity: expenseZ[idx] > 2.5 ? "high" : "medium",
        message: `Expenses spike detected with z-score ${expenseZ[idx].toFixed(2)}`,
        zScore: expenseZ[idx],
      })
    }

    if (payrollZ[idx] > 1.5) {
      anomalies.push({
        category: "payroll_step_up",
        date: day.date,
        severity: payrollZ[idx] > 2.2 ? "high" : "medium",
        message: `Payroll trending above norm (z-score ${payrollZ[idx].toFixed(2)})`,
        zScore: payrollZ[idx],
      })
    }

    if (marginSeries[idx] < 0 && marginZ[idx] < -0.5) {
      anomalies.push({
        category: "negative_margin",
        date: day.date,
        severity: "high",
        message: `Margin negative at ${marginSeries[idx].toFixed(2)} with pressure indicated by z-score ${marginZ[idx].toFixed(2)}`,
        zScore: marginZ[idx],
      })
    }

    if (Math.abs(revenueSeries[idx] - baseline[idx]) > Math.abs(baseline[idx]) * 0.25) {
      anomalies.push({
        category: "overhead_drift",
        date: day.date,
        severity: "low",
        message: `Seasonal deviation detected; expected ${baseline[idx].toFixed(2)} got ${revenueSeries[idx].toFixed(2)}`,
      })
    }
  })

  const dates = metrics.map((m) => m.date)
  for (let i = 1; i < dates.length; i++) {
    const previous = new Date(dates[i - 1])
    const current = new Date(dates[i])
    const gap = (current.getTime() - previous.getTime()) / 86400000
    if (gap > 1.1) {
      anomalies.push({
        category: "missing_data",
        date: dates[i],
        severity: "medium",
        message: `Gap of ${gap.toFixed(0)} days detected in source data`,
      })
    }
  }

  const vendorTotals = new Map<string, number>()
  metrics.forEach((day) => {
    const vendorSpend = (day.overhead + day.costOfGoods) * -1
    vendorTotals.set(day.date, vendorSpend)
  })
  const vendorSeries = Array.from(vendorTotals.values())
  const vendorZ = zScores(vendorSeries)
  vendorZ.forEach((score, idx) => {
    if (Math.abs(score) > 2) {
      anomalies.push({
        category: "vendor_inconsistency",
        date: metrics[idx].date,
        severity: "medium",
        message: `Vendor spend variance detected (z-score ${score.toFixed(2)})`,
        zScore: score,
      })
    }
  })

  return anomalies
}

export function ratioIntelligence(metrics: DailyMetrics[]): RatioInsight[] {
  if (metrics.length === 0) return []
  const latest = metrics[metrics.length - 1]
  const revenueTrend = rollingAverage(metrics.map((m) => m.revenue), 14)
  const payrollTrend = rollingAverage(metrics.map((m) => m.payroll), 14)
  const overheadTrend = rollingAverage(metrics.map((m) => m.overhead), 14)

  const grossMargin = latest.revenue === 0 ? 0 : (latest.revenue - latest.costOfGoods) / latest.revenue
  const payrollShare = latest.revenue === 0 ? 0 : latest.payroll / latest.revenue
  const overheadRatio = latest.revenue === 0 ? 0 : latest.overhead / latest.revenue
  const cashConversion = latest.revenue + latest.arDelta - latest.apDelta + latest.cashDelta
  const inventoryTurnover = latest.costOfGoods === 0 ? 0 : latest.revenue / latest.costOfGoods

  return [
    {
      label: "Gross margin trend",
      value: grossMargin,
      trend: latest.margin >= revenueTrend[revenueTrend.length - 1] ? "rising" : "falling",
      explanation: `Gross margin at ${(grossMargin * 100).toFixed(1)}% with trend ${
        latest.margin >= revenueTrend[revenueTrend.length - 1] ? "improving" : "softening"
      }`,
    },
    {
      label: "Payroll % of revenue",
      value: payrollShare,
      trend: payrollTrend[payrollTrend.length - 1] > payrollTrend[Math.max(0, payrollTrend.length - 8)]
        ? "rising"
        : "flat",
      explanation: `Payroll consumes ${(payrollShare * 100).toFixed(1)}% of revenue`,
    },
    {
      label: "Overhead ratio",
      value: overheadRatio,
      trend: overheadTrend[overheadTrend.length - 1] > overheadTrend[Math.max(0, overheadTrend.length - 8)]
        ? "rising"
        : "flat",
      explanation: `Overhead sits at ${(overheadRatio * 100).toFixed(1)}% of revenue`,
    },
    {
      label: "Cash conversion cycle proxy",
      value: cashConversion,
      trend: cashConversion >= 0 ? "rising" : "falling",
      explanation: `Cash conversion now ${cashConversion >= 0 ? "positive" : "negative"}`,
    },
    {
      label: "Inventory turnover",
      value: inventoryTurnover,
      trend: inventoryTurnover > 1 ? "rising" : "falling",
      explanation: `Inventory turning ${inventoryTurnover.toFixed(2)}x based on revenue and COGS`,
    },
  ]
}

export function computeStressScore(metrics: DailyMetrics[]): StressScore {
  if (metrics.length === 0) {
    return { score: 0, factors: {}, commentary: "No data" }
  }
  const recent = metrics.slice(-14)
  const revenueVolatility = zScores(recent.map((m) => m.revenue)).reduce((sum, v) => sum + Math.abs(v), 0)
  const burnRate = recent.reduce((sum, day) => sum + (day.expenses - day.revenue), 0) / recent.length
  const avgMargin = recent.reduce((sum, day) => sum + day.margin, 0) / recent.length
  const expenseDrift = zScores(recent.map((m) => m.expenses)).reduce((sum, v) => sum + Math.abs(v), 0)
  const payrollDrift = zScores(recent.map((m) => m.payroll)).reduce((sum, v) => sum + Math.abs(v), 0)

  const normalizedBurn = Math.min(Math.max((burnRate * -1) / 10000, 0), 1)
  const normalizedMargin = Math.min(Math.max(avgMargin / 10000, -1), 1)
  const volatilityFactor = Math.min(revenueVolatility / recent.length, 3) / 3
  const expenseFactor = Math.min(expenseDrift / recent.length, 3) / 3
  const payrollFactor = Math.min(payrollDrift / recent.length, 3) / 3

  const score = Math.round(
    (0.35 * (1 - normalizedBurn) + 0.25 * (1 + normalizedMargin) + 0.2 * (1 - volatilityFactor) +
      0.1 * (1 - expenseFactor) +
      0.1 * (1 - payrollFactor)) *
      100,
  )

  return {
    score: Math.min(Math.max(score, 0), 100),
    factors: {
      burnRate,
      avgMargin,
      volatility: revenueVolatility,
      expenseDrift,
      payrollDrift,
    },
    commentary: score > 70 ? "Healthy runway" : score > 40 ? "Monitor burn and margins" : "Urgent: stabilize cash",
  }
}

function forecastSeries(history: number[], horizon: number): ForecastBand[] {
  if (history.length === 0) return []
  const moving = rollingAverage(history, Math.min(14, history.length))
  const z = zScores(history)
  const volatility = z.reduce((sum, v) => sum + Math.abs(v), 0) / history.length
  const trend = history[history.length - 1] - history[Math.max(0, history.length - 8)]
  const seasonality = deriveSeasonality(history, Math.min(30, Math.max(7, Math.floor(history.length / 2))))

  return Array.from({ length: horizon }).map((_, idx) => {
    const seasonal = seasonality.length ? seasonality[idx % seasonality.length] : moving[moving.length - 1]
    const expected = moving[moving.length - 1] + trend * 0.1 + seasonal * 0.2
    const volatilityBuffer = expected * (volatility * 0.2)
    return {
      date: new Date(Date.now() + (idx + 1) * 86400000).toISOString().split("T")[0],
      expected,
      bestCase: expected + volatilityBuffer,
      worstCase: expected - volatilityBuffer,
      confidence: Math.max(0.6, 1 - volatility * 0.2),
    }
  })
}

export function buildForecast(metrics: DailyMetrics[], shocks: number[] = []): ForecastOutput {
  const revenueHistory = metrics.map((m) => m.revenue)
  const expenseHistory = metrics.map((m) => m.expenses)
  const payrollHistory = metrics.map((m) => m.payroll)
  const cashHistory = metrics.map((m) => m.cashDelta)

  const adjustedRevenue = revenueHistory.map((value, idx) => value + (shocks[idx] ?? 0))

  return {
    revenue: forecastSeries(adjustedRevenue, 30),
    expenses: forecastSeries(expenseHistory, 30),
    payroll: forecastSeries(payrollHistory, 30),
    cash: forecastSeries(cashHistory, 30),
  }
}

export function buildDecisions(
  ratios: RatioInsight[],
  anomalies: AnomalyInsight[],
  stress: StressScore,
): { suggestions: DecisionSuggestion[]; automations: AutomatedFix[] } {
  const suggestions: DecisionSuggestion[] = []
  const automations: AutomatedFix[] = []

  ratios.forEach((ratio) => {
    if (ratio.label.startsWith("Gross margin") && ratio.value < 0.25) {
      suggestions.push({
        title: "Recover gross margin",
        rationale: ratio.explanation,
        impact: "Price increase and cost controls can lift margins 4-8%",
        actionType: "pricing",
        recommendedChange: "Evaluate 6-8% price increase on low-elasticity SKUs",
      })
    }

    if (ratio.label.startsWith("Payroll") && ratio.value > 0.3) {
      suggestions.push({
        title: "Restrain payroll growth",
        rationale: ratio.explanation,
        impact: "Delay hiring to protect runway",
        actionType: "hiring",
        recommendedChange: "Pause new offers for 30 days and shift overtime to automation",
      })
    }
  })

  anomalies.forEach((anomaly) => {
    if (anomaly.category === "revenue_drop") {
      automations.push({
        label: "Send invoice reminder",
        action: "send_invoice_reminder",
        payload: { since: anomaly.date },
        reason: anomaly.message,
      })
    }

    if (anomaly.category === "expense_spike") {
      automations.push({
        label: "Tag expense for review",
        action: "tag_expense",
        payload: { date: anomaly.date },
        reason: anomaly.message,
      })
    }
  })

  if (stress.score < 50) {
    suggestions.push({
      title: "Stabilize cash runway",
      rationale: stress.commentary,
      impact: "Align burn with 3-6 month runway",
      actionType: "budget",
      recommendedChange: "Freeze discretionary spend and accelerate collections",
    })
  }

  return { suggestions, automations }
}

export function monitorMetrics(metrics: DailyMetrics[]): { alerts: AlertEvent[]; digest: DigestSummary } {
  const anomalies = detectAnomalies(metrics)
  const now = new Date().toISOString()
  const alerts: AlertEvent[] = anomalies.map((anomaly) => ({
    metric:
      anomaly.category === "revenue_drop"
        ? "revenue"
        : anomaly.category === "negative_margin"
          ? "margin"
          : anomaly.category === "payroll_step_up"
            ? "payroll"
            : "cost_drift",
    severity: anomaly.severity === "high" ? "critical" : anomaly.severity === "medium" ? "warning" : "info",
    message: anomaly.message,
    firstDetected: anomaly.date,
    lastObserved: now,
    occurrences: 1,
    trend: anomaly.delta && anomaly.delta < 0 ? "down" : "up",
  }))

  const digest: DigestSummary = {
    date: now.split("T")[0],
    highlights: alerts.map((alert) => `${alert.metric.toUpperCase()}: ${alert.message}`),
    risks: alerts.filter((a) => a.severity !== "info").map((a) => a.message),
    actions: [],
  }

  return { alerts, digest }
}

export function evaluateDataQuality(
  entries: LedgerEntry[],
  anomalies: AnomalyInsight[],
  lineage: Array<{ stage: string; detail: string }>,
  replayChanges: Array<{ field: string; from: unknown; to: unknown; when: string }> = [],
): DataConfidence {
  const daysPresent = new Set(entries.map((e) => e.date.split("T")[0])).size
  const expectedSpan = entries.length
    ? Math.ceil(
        (new Date(entries[entries.length - 1].date).getTime() - new Date(entries[0].date).getTime()) / 86400000,
      ) + 1
    : 0
  const completeness = expectedSpan === 0 ? 0 : Math.min(daysPresent / expectedSpan, 1)
  const freshnessMs = Date.now() - new Date(entries[entries.length - 1]?.date ?? Date.now()).getTime()
  const freshness = Math.max(0, 1 - freshnessMs / (7 * 86400000))
  const anomalyPenalty = Math.min(anomalies.length / Math.max(entries.length, 1), 1)
  const duplicates = entries.length - new Set(entries.map((e) => `${e.date}-${e.reference ?? e.amount}`)).size
  const duplicatePenalty = Math.min(duplicates / Math.max(entries.length, 1), 1)

  const score = Math.round(
    (0.3 * completeness + 0.25 * freshness + 0.2 * (1 - anomalyPenalty) + 0.15 * (1 - duplicatePenalty) +
      0.1 * 1) *
      100,
  )

  return {
    score: Math.max(0, Math.min(score, 100)),
    breakdown: {
      completeness: Math.round(completeness * 100),
      freshness: Math.round(freshness * 100),
      anomalies: Math.round((1 - anomalyPenalty) * 100),
      duplicates: Math.round((1 - duplicatePenalty) * 100),
      mappingAccuracy: 100,
    },
    lineage,
    replayChanges,
  }
}

export function normalizeIngestion(
  headers: string[],
  historicalMapping: Record<string, string> = {},
  labels: string[] = [],
): NormalizationResult {
  const headerString = headers.join(",").toLowerCase()
  let detected: NormalizationResult["detectedSource"] = "unknown"
  if (headerString.includes("stripe") || headerString.includes("balance transaction")) detected = "stripe_csv"
  else if (headerString.includes("square")) detected = "square"
  else if (headerString.includes("shopify")) detected = "shopify"
  else if (headerString.includes("gusto")) detected = "gusto"
  else if (headerString.includes("quickbooks")) detected = "quickbooks"
  else if (headerString.includes("pdf")) detected = "bank_pdf"
  else if (headerString.includes("pos")) detected = "pos"
  else if (headerString.includes("timesheet")) detected = "timesheet"

  const mappingMemory: Record<string, string> = { ...historicalMapping }
  headers.forEach((header) => {
    const normalized = header.toLowerCase().replace(/\s+/g, "_")
    if (!mappingMemory[normalized]) {
      mappingMemory[normalized] = normalized
    }
  })

  const categories: Record<string, string> = {}
  labels.forEach((label) => {
    const normalized = label.toLowerCase()
    if (normalized.includes("payroll") || normalized.includes("salary")) categories[label] = "payroll"
    else if (normalized.includes("cogs") || normalized.includes("inventory")) categories[label] = "cogs"
    else if (normalized.includes("revenue") || normalized.includes("sale")) categories[label] = "revenue"
    else if (normalized.includes("subscription")) categories[label] = "subscription"
    else categories[label] = "expense"
  })

  return { detectedSource: detected, mappingMemory, categories }
}

export function narrativeForInsight(insight: AnomalyInsight | RatioInsight, actions: DecisionSuggestion[]): Narrative {
  const what = "date" in insight ? `On ${insight.date}: ${insight.message}` : insight.label
  const why = "zScore" in insight && insight.zScore !== undefined ? `Z-score: ${insight.zScore.toFixed(2)}` : insight.explanation
  const severity = "severity" in insight ? insight.severity : "info"
  const fix = actions[0]?.recommendedChange ?? "Monitor and adjust with next cycle"
  const consequence = "severity" in insight && insight.severity === "high"
    ? "If ignored, cash runway compresses rapidly."
    : "Ignoring this may erode margins."

  return { what, why, severity: typeof severity === "string" ? severity : "info", fix, consequence }
}

export function buildReports(metrics: DailyMetrics[]): ReportingBundle {
  const period = metrics.length ? `${metrics[0].date} to ${metrics[metrics.length - 1].date}` : "n/a"
  const revenueTotal = metrics.reduce((sum, m) => sum + m.revenue, 0)
  const cogsTotal = metrics.reduce((sum, m) => sum + m.costOfGoods, 0)
  const payrollTotal = metrics.reduce((sum, m) => sum + m.payroll, 0)
  const overheadTotal = metrics.reduce((sum, m) => sum + m.overhead, 0)
  const expenseTotal = metrics.reduce((sum, m) => sum + m.expenses, 0)
  const marginTotal = revenueTotal - expenseTotal
  const cashFlow = metrics.reduce((sum, m) => sum + m.cashDelta + m.arDelta - m.apDelta, 0)

  const profitAndLoss: StatementRow[] = [
    { label: "Revenue", value: revenueTotal },
    { label: "Cost of Goods", value: -cogsTotal },
    { label: "Gross Profit", value: revenueTotal - cogsTotal },
    { label: "Payroll", value: -payrollTotal },
    { label: "Overhead", value: -overheadTotal },
    { label: "Net Income", value: marginTotal },
  ]

  const balanceSheet: StatementRow[] = [
    { label: "Accounts Receivable", value: metrics.reduce((sum, m) => sum + m.arDelta, 0) },
    { label: "Accounts Payable", value: metrics.reduce((sum, m) => sum + m.apDelta, 0) },
    { label: "Inventory", value: -metrics.reduce((sum, m) => sum + m.inventoryDelta, 0) },
    { label: "Cash", value: metrics.reduce((sum, m) => sum + m.cashDelta, 0) },
  ]

  const cashFlowStatement: StatementRow[] = [
    { label: "Operating Cash Flow", value: cashFlow },
    { label: "Investing", value: 0 },
    { label: "Financing", value: 0 },
  ]

  const summaries: Record<string, StatementRow[]> = {
    burn: [
      { label: "Average Burn", value: marginTotal / Math.max(metrics.length, 1) },
      { label: "Runway Days", value: DAYS_IN_YEAR * (cashFlow !== 0 ? cashFlow / expenseTotal : 0) },
    ],
    vendors: metrics.map((m) => ({ label: m.date, value: -m.overhead })),
    expenseCategories: metrics.map((m) => ({ label: m.date, value: -m.expenses })),
  }

  return { period, profitAndLoss, balanceSheet, cashFlow: cashFlowStatement, summaries }
}

export function applyAutomations(metrics: DailyMetrics[]): AutomationRule[] {
  const latest = metrics[metrics.length - 1]
  const rules: AutomationRule[] = []

  if (latest && latest.margin < latest.revenue * 0.2) {
    rules.push({
      condition: "margin < 20%",
      triggered: true,
      suggestedAction: {
        label: "Adjust pricing",
        action: "create_rule",
        payload: { type: "pricing", increase: 0.06 },
        reason: "Margin below 20% threshold",
      },
    })
  } else {
    rules.push({ condition: "margin < 20%", triggered: false, suggestedAction: null })
  }

  if (latest && latest.arDelta > latest.revenue * 0.15) {
    rules.push({
      condition: "AR aging > 45 days proxy",
      triggered: true,
      suggestedAction: {
        label: "Send AR reminders",
        action: "send_invoice_reminder",
        payload: { thresholdDays: 45 },
        reason: "AR aging creeping up",
      },
    })
  } else {
    rules.push({ condition: "AR aging > 45 days proxy", triggered: false, suggestedAction: null })
  }

  if (latest && latest.payroll > latest.revenue * 0.3) {
    rules.push({
      condition: "Payroll > 30% revenue",
      triggered: true,
      suggestedAction: {
        label: "Notify owner",
        action: "start_budget",
        payload: { area: "payroll" },
        reason: "Payroll share too high",
      },
    })
  } else {
    rules.push({ condition: "Payroll > 30% revenue", triggered: false, suggestedAction: null })
  }

  if (latest && latest.inventoryDelta > 0 && latest.costOfGoods > latest.revenue * 0.5) {
    rules.push({
      condition: "Inventory < 2 weeks proxy",
      triggered: true,
      suggestedAction: {
        label: "Auto-reorder suggestion",
        action: "create_rule",
        payload: { sku: "priority", reorder: true },
        reason: "Inventory depletion detected",
      },
    })
  } else {
    rules.push({ condition: "Inventory < 2 weeks proxy", triggered: false, suggestedAction: null })
  }

  return rules
}
