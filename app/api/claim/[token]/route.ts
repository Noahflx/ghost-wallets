import { type NextRequest, NextResponse } from "next/server"
import { verifyMagicLink } from "@/lib/stellar"

interface RouteParams {
  params: Promise<{
    token: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params

    // Verify the magic link token
    const claimData = await verifyMagicLink(token)

    if (!claimData) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    return NextResponse.json(claimData)
  } catch (error) {
    console.error("[v0] Error in claim API:", error)
    return NextResponse.json({ error: "Failed to verify claim link" }, { status: 500 })
  }
}
