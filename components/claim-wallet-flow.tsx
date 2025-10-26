"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Wallet, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ClaimWalletFlowProps {
  token: string
}

type FlowState = "loading" | "verify" | "claim" | "success" | "error"

interface WalletData {
  walletAddress: string
  contractAddress: string | null
  amount: string
  tokenSymbol: string
  recipientEmail?: string | null
  senderName?: string | null
  message?: string | null
  expiresAt?: string | null
}

export function ClaimWalletFlow({ token }: ClaimWalletFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>("loading")
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [userAddress, setUserAddress] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // Verify magic link on mount
  useEffect(() => {
    verifyMagicLink()
  }, [token])

  const verifyMagicLink = async () => {
    try {
      const response = await fetch("/api/verify-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || "Invalid or expired magic link")
        setFlowState("error")
        return
      }

      setWalletData({
        walletAddress: data.walletAddress,
        contractAddress: data.contractAddress,
        amount: data.amount,
        tokenSymbol: data.tokenSymbol,
        recipientEmail: data.recipientEmail,
        senderName: data.senderName,
        message: data.message,
        expiresAt: data.expiresAt,
      })
      setFlowState("verify")
    } catch (error) {
      setErrorMessage("Failed to verify magic link")
      setFlowState("error")
    }
  }

  const handleClaimWallet = async () => {
    if (!userAddress) {
      toast({
        title: "Error",
        description: "Please enter your Stellar address",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/claim-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userAddress }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim wallet")
      }

      setFlowState("success")
      toast({
        title: "Success!",
        description: "Your wallet has been claimed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim wallet",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Loading state
  if (flowState === "loading") {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Verifying magic link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (flowState === "error") {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Invalid Link
            </CardTitle>
            <CardDescription>This magic link is not valid</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => (window.location.href = "/")}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (flowState === "success" && walletData) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Wallet Claimed!
            </CardTitle>
            <CardDescription>Your funds are now accessible</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Amount Received</p>
                <p className="text-2xl font-bold">
                  {walletData.amount} {walletData.tokenSymbol}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Wallet Address</p>
                <p className="text-xs font-mono break-all">{userAddress}</p>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm leading-relaxed">
                Your funds are now in your Stellar wallet. You can view and manage them using any Stellar wallet
                application.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => (window.location.href = "/dashboard")}>
                Send Payment
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => (window.location.href = "/")}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verify and claim state
  if (flowState === "verify" && walletData) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Claim Your Funds
            </CardTitle>
            <CardDescription>You've received a payment via Ghost Wallets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Details */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">You're receiving</p>
              <p className="text-3xl font-bold text-primary">
                {walletData.amount} {walletData.tokenSymbol}
              </p>
              {walletData.recipientEmail && (
                <p className="text-sm text-muted-foreground mt-2">Sent to: {walletData.recipientEmail}</p>
              )}
              {walletData.senderName && (
                <p className="text-sm text-muted-foreground mt-1">From: {walletData.senderName}</p>
              )}
              {walletData.message && (
                <blockquote className="mt-3 border-l-4 border-primary/40 bg-background/60 p-3 text-sm text-muted-foreground italic whitespace-pre-wrap">
                  {walletData.message}
                </blockquote>
              )}
              {walletData.expiresAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires on {new Date(walletData.expiresAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Wallet Address Input */}
            <div className="space-y-2">
              <Label htmlFor="address">Your Stellar Wallet Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="G..."
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Stellar address to claim the funds. Don't have one?{" "}
                <a href="#" className="text-primary hover:underline">
                  Create a wallet
                </a>
              </p>
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertDescription className="text-sm leading-relaxed">
                Once claimed, the funds will be transferred to your Stellar wallet address. This action cannot be
                undone.
              </AlertDescription>
            </Alert>

            {/* Claim Button */}
            <Button onClick={handleClaimWallet} disabled={isProcessing || !userAddress} className="w-full">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming Wallet...
                </>
              ) : (
                <>
                  Claim Funds
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Temporary Wallet Info */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <strong>Temporary Wallet:</strong> {walletData.walletAddress}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
