import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, otp } = await request.json()

    // In production, verify OTP against stored value
    // For demo, accept any 6-digit code
    if (otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in verify-otp API:", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
