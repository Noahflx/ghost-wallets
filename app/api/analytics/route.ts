import { NextResponse } from "next/server"
import { computeAnalyticsSnapshot } from "@/lib/analytics"

export async function GET() {
  const snapshot = computeAnalyticsSnapshot()
  return NextResponse.json(snapshot)
}
