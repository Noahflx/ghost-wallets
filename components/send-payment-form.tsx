"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SendPaymentForm() {
  const [recipientEmail, setRecipientEmail] = useState("")
  const [amount, setAmount] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("USDC")
  const [senderName, setSenderName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [magicLinkUrl, setMagicLinkUrl] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(false)

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientEmail,
          amount,
          currency: tokenSymbol,
          senderName: senderName || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send payment")
      }

      setSuccess(true)
      setMagicLinkUrl(data.magicLinkUrl)
      toast({
        title: "Payment sent!",
        description: "The recipient will receive a magic link to claim their funds.",
      })

      // Reset form
      setRecipientEmail("")
      setAmount("")
      setSenderName("")
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
          <Button onClick={() => setSuccess(false)} className="w-full">
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

          {/* Info Alert */}
          <Alert>
            <AlertDescription className="text-sm leading-relaxed">
              The recipient will receive a magic link at their email address. They don't need a crypto wallet to get
              started.
            </AlertDescription>
          </Alert>

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
