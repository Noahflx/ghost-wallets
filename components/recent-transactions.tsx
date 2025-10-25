"use client"

import { useEffect, useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Clock, ExternalLink, Sparkles } from "lucide-react"
import type { TransactionRecord } from "@/lib/transactions"

interface TransactionsResponse {
  transactions: TransactionRecord[]
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString()
  } catch (error) {
    return timestamp
  }
}

function getFundingBadgeLabel(tx: TransactionRecord): string {
  if (tx.isSimulated) {
    return "Simulated"
  }

  if (tx.fundingMode === "sandbox") {
    return "Sandbox"
  }

  return "Testnet"
}

function getFundingBadgeVariant(tx: TransactionRecord): "default" | "outline" | "secondary" {
  if (tx.isSimulated) {
    return "outline"
  }

  if (tx.fundingMode === "sandbox") {
    return "secondary"
  }

  return "default"
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadTransactions = async () => {
      try {
        const response = await fetch("/api/transactions")
        const data = (await response.json()) as TransactionsResponse & { error?: string }

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to fetch transactions")
        }

        if (!cancelled) {
          setTransactions(data.transactions)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load transactions")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadTransactions()

    const interval = setInterval(loadTransactions, 15000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Loading recent transactions...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>We couldn't load your transactions.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No transactions yet</p>
          <p className="text-sm mt-1">Send your first payment to get started</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{tx.recipient}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(tx.createdAt)}
                </p>
                {tx.claimedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Claimed {formatTimestamp(tx.claimedAt)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="font-semibold">
                {tx.amount} {tx.currency}
              </p>
              <div className="flex items-center justify-end gap-2">
                <Badge
                  variant={tx.status === "claimed" ? "default" : tx.status === "failed" ? "destructive" : "secondary"}
                >
                  {tx.status}
                </Badge>
                <Badge variant={getFundingBadgeVariant(tx)}>{getFundingBadgeLabel(tx)}</Badge>
                {tx.prefundTransactionHash && (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    Friendbot
                  </Badge>
                )}
              </div>
              {tx.transactionHash && (
                <div className="text-xs text-muted-foreground">
                  {tx.isSimulated ? (
                    <span title={tx.transactionHash}>Simulated hash {tx.transactionHash.slice(0, 10)}…</span>
                  ) : tx.explorerUrl ? (
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      View on Stellar Expert
                    </a>
                  ) : (
                    <span title={tx.transactionHash}>Hash {tx.transactionHash.slice(0, 10)}…</span>
                  )}
                </div>
              )}
              {tx.prefundTransactionHash && (
                <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                  <Sparkles className="h-3 w-3" />
                  {tx.fundingMode === "testnet" ? (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.prefundTransactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Prefund
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-mono">{tx.prefundTransactionHash.slice(0, 12)}…</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your recent payment activity</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  )
}
