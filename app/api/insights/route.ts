import { NextResponse } from "next/server"

import { buildInsights } from "@/lib/insights"

export async function GET() {
  const insights = buildInsights()
  return NextResponse.json(insights)
}
