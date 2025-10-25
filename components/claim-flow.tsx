"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ClaimFlowProps {
  token: string
}

export function ClaimFlow({ token }: ClaimFlowProps) {
  const [step, setStep] = useState<"verify" | "claim" | "success">("verify")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [claimData, setClaimData] = useState<{ amount: string; currency: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch claim details
    const fetchClaimData = async () => {
      try {
        const response = await fetch(`/api/claim/${token}`)
        const data = await response.json()

        if (response.ok) {
          setClaimData(data)
        } else {
          toast({
            title: "Invalid link",
            description: "This claim link is invalid or has expired.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("[v0] Failed to fetch claim data:", error)
      }
    }

    fetchClaimData()
  }, [token, toast])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp }),
      })

      if (!response.ok) {
        throw new Error("Invalid verification code")
      }

      setStep("claim")
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        throw new Error("Failed to claim funds")
      }

      setStep("success")
    } catch (error) {
      toast({
        title: "Claim failed",
        description: error instanceof Error ? error.message : "Failed to claim funds",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!claimData) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Identity</CardTitle>
          <CardDescription>Enter the verification code sent to your email or phone</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-sm text-muted-foreground mb-1">You're claiming</p>
              <p className="text-2xl font-bold">
                {claimData.amount} {claimData.currency}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (step === "claim") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Claim Your Funds</CardTitle>
          <CardDescription>Your identity has been verified. Claim your funds now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 rounded-lg bg-muted text-center">
            <p className="text-sm text-muted-foreground mb-2">Available to claim</p>
            <p className="text-3xl font-bold mb-4">
              {claimData.amount} {claimData.currency}
            </p>
            <Button onClick={handleClaim} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim Funds"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="text-center space-y-4 py-8">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Funds Claimed!</h2>
          <p className="text-muted-foreground">
            {claimData.amount} {claimData.currency} has been transferred to your wallet.
          </p>
          <Button asChild className="w-full">
            <a href="/">Return to Home</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
