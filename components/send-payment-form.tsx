"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { PaymentMode } from "@/lib/types/payments"

type SendPaymentFormProps = {
  onSend?: (amount: number) => void
}

export function SendPaymentForm({ onSend }: SendPaymentFormProps) {
  const [recipientEmail, setRecipientEmail] = useState("")
  const [amount, setAmount] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("USDC")
  const [senderName, setSenderName] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null)
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
          message: message.trim() || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to send payment")

      setPaymentMode(data.paymentMode)
      setSuccess(true)
      onSend?.(Number(amount))

      toast({
        title: "Payment sent!",
        description: "A magic link has been emailed to the recipient.",
      })

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
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Payment Sent
          </CardTitle>
          <CardDescription>
            Your payment has been sent successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Button
            onClick={() => setSuccess(false)}
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
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="PYUSD">PYUSD</SelectItem>
                  <SelectItem value="XLM">XLM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender">Your Name (optional)</Label>
            <Input
              id="sender"
              type="text"
              placeholder="John Doe"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Thanks for helping out!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              This note appears in the recipient’s email.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
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
