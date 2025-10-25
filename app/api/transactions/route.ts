import { NextResponse } from "next/server"
import { listTransactions } from "@/lib/transactions"

export async function GET() {
  const transactions = listTransactions()
  return NextResponse.json({ transactions })
}
