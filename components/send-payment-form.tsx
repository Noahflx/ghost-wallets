"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, Mail, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { PaymentMode } from "@/lib/types/payments"

type SendPaymentFormProps = {
  onSend?: (amount: number) => void
}

interface PaymentSuccessDetails {
  walletAddress: string
  transactionHash: string | null
  magicLinkUrl: string
  paymentMode: PaymentMode
  explorerUrl: string | null
  simulated: boolean
  prefundHash: string | null
}

export function SendPaymentForm({ onSend }: SendPaymentFormProps) {
  const [recipientEmail, setRecipientEmail] = useState("")
  const [amount, setAmount] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("USDC")
  const [senderName, setSenderName] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [magicLinkUrl, setMagicLinkUrl] = useState("")
  const [paymentDetails, setPaymentDetails] = useState<PaymentSuccessDetails | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(false)
    setPaymentDetails(null)

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientEmail,
          amount,
          currency: tokenSymbol,
          senderName: senderName || undefined,
          message: message.trim() ? message : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send payment")
      }

      setSuccess(true)
      setMagicLinkUrl(data.magicLinkUrl)
      setPaymentDetails({
        walletAddress: data.walletAddress,
        transactionHash: data.transactionHash ?? null,
        magicLinkUrl: data.magicLinkUrl,
        paymentMode: data.paymentMode as PaymentMode,
        explorerUrl: data.explorerUrl ?? null,
        simulated: Boolean(data.simulated),
        prefundHash: data?.prefund?.txHash ?? null,
      })
      onSend?.(Number(amount))
      toast({
        title: "Payment sent!",
        description: "The recipient will receive a magic link to claim their funds.",
      })

      // Reset form
      setRecipientEmail("")
      setAmount("")
      setSenderName("")
      setMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send payment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Payment Sent Successfully!
          </CardTitle>
          <CardDescription>The recipient will receive a magic link to claim their funds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Magic Link</Label>
            <div className="mt-1 p-3 bg-muted rounded-lg break-all text-sm font-mono">{magicLinkUrl}</div>
          </div>
          {paymentDetails && (
            <div className="grid gap-4 rounded-lg border border-border/40 p-4 bg-muted/30 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Funding mode</span>
                <span className="font-medium uppercase tracking-wide text-xs">
                  {paymentDetails.paymentMode === "testnet"
                    ? "Testnet"
                    : paymentDetails.paymentMode === "sandbox"
                    ? "Sandbox"
                    : "Simulation"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Wallet address</span>
                <span className="font-mono text-xs">{paymentDetails.walletAddress}</span>
              </div>
              {paymentDetails.transactionHash && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Funding hash</span>
                  {paymentDetails.explorerUrl ? (
                    <a
                      href={paymentDetails.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                    >
                      {paymentDetails.transactionHash.slice(0, 12)}…
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-mono text-xs">{paymentDetails.transactionHash}</span>
                  )}
                </div>
              )}
              {paymentDetails.prefundHash && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Friendbot prefund</span>
                  <span className="font-mono text-xs">{paymentDetails.prefundHash.slice(0, 12)}…</span>
                </div>
              )}
            </div>
          )}
          <Button
            onClick={() => {
              setSuccess(false)
              setPaymentDetails(null)
            }}
            className="w-full"
          >
            Send Another Payment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Payment</CardTitle>
        <CardDescription>Enter the recipient email and amount to send</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Recipient Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>

          {/* Amount and Token */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Select value={tokenSymbol} onValueChange={setTokenSymbol}>
                <SelectTrigger id="token">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="PYUSD">PYUSD</SelectItem>
                  <SelectItem value="XLM">XLM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional Sender Name */}
          <div className="space-y-2">
            <Label htmlFor="sender">Your Name (Optional)</Label>
            <Input
              id="sender"
              type="text"
              placeholder="John Doe"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message to Recipient (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Thanks for helping out with the event!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">This note appears in the recipient's email.</p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Payment...
              </>
            ) : (
              "Send Payment"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
