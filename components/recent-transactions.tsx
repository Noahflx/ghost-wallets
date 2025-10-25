"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Clock } from "lucide-react"

// Mock data for demo
const mockTransactions = [
  {
    id: "1",
    recipient: "alice@example.com",
    amount: "50.00",
    token: "USDC",
    status: "claimed",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    recipient: "+1234567890",
    amount: "100.00",
    token: "PYUSD",
    status: "pending",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    recipient: "bob@example.com",
    amount: "25.50",
    token: "USDC",
    status: "claimed",
    timestamp: "1 day ago",
  },
]

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your recent payment activity</CardDescription>
      </CardHeader>
      <CardContent>
        {mockTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Send your first payment to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{tx.recipient}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tx.timestamp}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {tx.amount} {tx.token}
                  </p>
                  <Badge variant={tx.status === "claimed" ? "default" : "secondary"} className="mt-1">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
