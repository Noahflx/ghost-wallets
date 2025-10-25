import { NextResponse } from "next/server"

// Mock transactions for demo
const mockTransactions = [
  {
    id: "1",
    recipient: "alice@example.com",
    amount: "50.00",
    currency: "USDC",
    status: "claimed" as const,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    recipient: "+1234567890",
    amount: "25.50",
    currency: "PYUSD",
    status: "pending" as const,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
]

export async function GET() {
  // In production, fetch from database
  return NextResponse.json({ transactions: mockTransactions })
}
