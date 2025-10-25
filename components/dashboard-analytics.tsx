"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Clock3, Activity, CircleCheck } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CurrencyBreakdown {
  currency: string
  total: number
}

interface AnalyticsSnapshot {
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

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
}

function formatAmount(value: number, currency: string): string {
  const precision = currency === "XLM" ? 2 : 2
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: precision })} ${currency}`
}

function formatRelative(timestamp: string | null): string {
  if (!timestamp) return "—"
  try {
    const date = new Date(timestamp)
    return date.toLocaleString()
  } catch (error) {
    return timestamp
  }
}

export function DashboardAnalytics() {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchSnapshot = async () => {
      try {
        const response = await fetch("/api/analytics")
        const data = (await response.json()) as AnalyticsSnapshot

        if (!cancelled) {
          setSnapshot(data)
        }
      } catch (error) {
        console.warn("Failed to load analytics snapshot", error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchSnapshot()
    const interval = setInterval(fetchSnapshot, 15000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const modeTotal = useMemo(() => {
    if (!snapshot) return 0
    return snapshot.modeBreakdown.simulation + snapshot.modeBreakdown.testnet
  }, [snapshot])

  const testnetShare = snapshot && modeTotal > 0 ? snapshot.modeBreakdown.testnet / modeTotal : 0

  const highlights = snapshot
    ? [
        {
          label: "Transactions/hour",
          value: formatNumber(snapshot.transactionsLastHour),
          icon: Activity,
        },
        {
          label: "Claim rate",
          value: formatPercent(snapshot.claimRate),
          icon: CircleCheck,
        },
        {
          label: "Friendbot funded",
          value: formatNumber(snapshot.prefundedCount),
          icon: TrendingUp,
        },
        {
          label: "Testnet mix",
          value: formatPercent(testnetShare),
          icon: Clock3,
        },
      ]
    : []

  return (
    <Card className="bg-card/70 border border-border/30 shadow-md">
      <CardHeader className="flex flex-col gap-3">
        <div>
          <CardTitle className="text-lg">Live ops metrics</CardTitle>
          <CardDescription>Real-time view across magic links, claims, and on-chain touchpoints.</CardDescription>
        </div>
        {snapshot && (
          <Badge variant="outline" className="w-fit text-xs">
            Updated {formatRelative(snapshot.generatedAt)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {loading && !snapshot
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/20 bg-muted/30 h-24 animate-pulse"
                />
              ))
            : highlights.map(({ label, value, icon: Icon }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-border/20 bg-muted/30 p-4"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{label}</span>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
                </motion.div>
              ))}
        </div>

        {snapshot && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid gap-5"
          >
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Volume by asset</h3>
              <div className="grid gap-2">
                {snapshot.amountByCurrency.length === 0 && (
                  <p className="text-xs text-muted-foreground">No transactions yet — send your first test payment.</p>
                )}
                {snapshot.amountByCurrency.map((entry) => (
                  <div
                    key={entry.currency}
                    className="flex items-center justify-between rounded-lg border border-border/20 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{entry.currency}</span>
                    <span className="font-mono text-xs">
                      {formatAmount(entry.total, entry.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Pending claims</h3>
              {snapshot.pendingByCurrency.length === 0 ? (
                <p className="text-xs text-muted-foreground">All payouts claimed — judges love instant gratification.</p>
              ) : (
                <div className="grid gap-2">
                  {snapshot.pendingByCurrency.map((entry) => (
                    <div
                      key={entry.currency}
                      className="flex items-center justify-between rounded-lg border border-border/20 bg-background/40 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{entry.currency}</span>
                      <span className="font-mono text-xs">
                        {formatAmount(entry.total, entry.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {snapshot.pendingOlderThanHour > 0 ? (
                  <span>
                    {snapshot.pendingOlderThanHour} links older than 1h, {snapshot.pendingOlderThanDay} over 24h.
                  </span>
                ) : (
                  <span>All pending links are fresh (under 1h).</span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Claims velocity</h3>
              <div className="rounded-lg border border-border/20 bg-background/40 px-3 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg claim time</span>
                  <span className="font-medium">{snapshot.averageClaimHumanized ?? "—"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last funded link</span>
                  <span>{formatRelative(snapshot.lastActivityAt)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last claim</span>
                  <span>{formatRelative(snapshot.lastClaimAt)}</span>
                </div>
                {snapshot.topRecipients.length > 0 && (
                  <div className="mt-3 text-xs">
                    <span className="text-muted-foreground">Recent recipients:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {snapshot.topRecipients.map((recipient) => (
                        <Badge key={recipient} variant="secondary" className="text-[10px]">
                          {recipient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
