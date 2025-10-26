"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowRight,
  Landmark,
  Send,
  ShieldCheck,
  PiggyBank,
  MapPin,
  ArrowLeft,
  MailCheck,
  Copy,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ClaimWalletFlowProps {
  token: string
}

type FlowState = "loading" | "verify" | "success" | "error"

type ActiveAction = "overview" | "withdraw" | "cashout" | "forward" | "advanced"

type ActionResult =
  | { type: "keep"; acknowledgedAt: string }
  | { type: "withdraw"; recordId: string; maskedAccount: string }
  | { type: "cashout"; recordId: string }
  | {
      type: "forward"
      recordId: string
      newLink: string
      expiresAt: string
      recipient: string
      notificationSent: boolean
    }
  | { type: "advanced"; destination: string; txHash?: string | null; explorerUrl?: string | null }
  | null

interface WalletData {
  walletAddress: string
  contractAddress: string | null
  amount: string
  tokenSymbol: string
  recipientEmail?: string | null
  senderName?: string | null
  message?: string | null
  expiresAt?: string | null
  transactionHash?: string | null
  paymentMode?: string | null
  explorerUrl?: string | null
}

type ClaimAction = "keep" | "withdraw" | "cashout" | "forward"

export function ClaimWalletFlow({ token }: ClaimWalletFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>("loading")
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [userAddress, setUserAddress] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeAction, setActiveAction] = useState<ActiveAction>("overview")
  const [isActionProcessing, setIsActionProcessing] = useState(false)
  const [actionResult, setActionResult] = useState<ActionResult>(null)
  const [forwardRecipient, setForwardRecipient] = useState("")
  const [forwardNote, setForwardNote] = useState("")
  const [withdrawForm, setWithdrawForm] = useState({
    fullName: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    notes: "",
  })
  const [cashoutForm, setCashoutForm] = useState({
    fullName: "",
    country: "",
    city: "",
    contact: "",
  })
  const { toast } = useToast()
  const [isCopying, setIsCopying] = useState(false)

  useEffect(() => {
    verifyMagicLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const verifyMagicLink = async () => {
    setFlowState("loading")
    setActionResult(null)
    setActiveAction("overview")

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
        transactionHash: data.transactionHash,
        paymentMode: data.paymentMode,
        explorerUrl: data.explorerUrl,
      })
      setFlowState("verify")
    } catch (error) {
      setErrorMessage("Failed to verify magic link")
      setFlowState("error")
    }
  }

  const runClaimAction = async (action: ClaimAction, payload: Record<string, unknown> = {}) => {
    setIsActionProcessing(true)

    try {
      const response = await fetch("/api/claim/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, payload }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process request")
      }

      return data as Record<string, unknown>
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Unable to complete that action right now.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsActionProcessing(false)
    }
  }

  const handleKeepBalance = async () => {
    const data = await runClaimAction("keep")

    if (data && typeof data === "object" && "acknowledgedAt" in data) {
      setActionResult({ type: "keep", acknowledgedAt: String(data.acknowledgedAt) })
      toast({
        title: "Balance secured",
        description: "You can come back anytime with this email to access your funds.",
      })
    }
  }

  const handleWithdrawSubmit = async () => {
    if (!walletData) return

    if (!withdrawForm.fullName || !withdrawForm.bankName || !withdrawForm.accountNumber) {
      toast({
        title: "Missing details",
        description: "Please share your name, bank, and account number to continue.",
        variant: "destructive",
      })
      return
    }

    const data = await runClaimAction("withdraw", { ...withdrawForm })

    if (data && typeof data === "object" && "recordId" in data) {
      setActionResult({
        type: "withdraw",
        recordId: String(data.recordId),
        maskedAccount: String((data as { maskedAccount?: string }).maskedAccount ?? "****"),
      })
      setActiveAction("overview")
      setWithdrawForm({ fullName: "", bankName: "", accountNumber: "", routingNumber: "", notes: "" })
      toast({
        title: "Withdrawal request received",
        description: "We'll ping you as soon as the transfer hits your bank.",
      })
    }
  }

  const handleCashoutSubmit = async () => {
    if (!cashoutForm.fullName || !cashoutForm.country) {
      toast({
        title: "Missing details",
        description: "Add your name and country so we can prep the pickup.",
        variant: "destructive",
      })
      return
    }

    const data = await runClaimAction("cashout", { ...cashoutForm })

    if (data && typeof data === "object" && "recordId" in data) {
      setActionResult({ type: "cashout", recordId: String(data.recordId) })
      setActiveAction("overview")
      setCashoutForm({ fullName: "", country: "", city: "", contact: "" })
      toast({
        title: "Cash pickup started",
        description: "We'll email you pickup instructions shortly.",
      })
    }
  }

  const handleForwardSubmit = async () => {
    if (!forwardRecipient) {
      toast({
        title: "Who should receive it?",
        description: "Enter an email or phone so we know where to send the link.",
        variant: "destructive",
      })
      return
    }

    const data = await runClaimAction("forward", {
      recipient: forwardRecipient,
      message: forwardNote,
    })

    if (data && typeof data === "object" && "recordId" in data) {
      setActionResult({
        type: "forward",
        recordId: String(data.recordId),
        newLink: String((data as { newLink?: string }).newLink ?? ""),
        expiresAt: String((data as { expiresAt?: string }).expiresAt ?? ""),
        recipient: forwardRecipient,
        notificationSent: Boolean((data as { notificationSent?: boolean }).notificationSent ?? false),
      })
      setActiveAction("overview")
      setForwardRecipient("")
      setForwardNote("")
      toast({
        title: "Forwarded",
        description: "The recipient just got their own magic link to access the funds.",
      })
    }
  }

  const handleClaimWallet = async () => {
    if (!userAddress) {
      toast({
        title: "Add your wallet",
        description: "Paste the Stellar address you'd like to receive the funds at.",
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
        throw new Error(data.error || "Failed to move funds to your wallet")
      }

      setFlowState("success")
      setActionResult({
        type: "advanced",
        destination: userAddress,
        txHash: (data as { transactionHash?: string }).transactionHash ?? null,
        explorerUrl:
          (data as { explorerUrl?: string | null }).explorerUrl ?? walletData?.explorerUrl ?? null,
      })
      toast({
        title: "Funds on the way",
        description: "Your balance is settling in your wallet now.",
      })
    } catch (error) {
      toast({
        title: "Couldn't complete transfer",
        description: error instanceof Error ? error.message : "Failed to claim wallet",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = async (value: string) => {
    try {
      setIsCopying(true)
      await navigator.clipboard.writeText(value)
      toast({ title: "Link copied", description: "Share it with your recipient however you like." })
    } catch (error) {
      toast({
        title: "Unable to copy",
        description: "Copy the link manually for now.",
        variant: "destructive",
      })
    } finally {
      setIsCopying(false)
    }
  }

  const renderActionResult = () => {
    if (!actionResult || flowState !== "verify") {
      return null
    }

    switch (actionResult.type) {
      case "keep":
        return (
          <Alert className="border-green-200 bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <AlertTitle>Balance saved for later</AlertTitle>
            <AlertDescription>
              <p>
                Come back with this email anytime. We last confirmed your access on{" "}
                {new Date(actionResult.acknowledgedAt).toLocaleString()}.
              </p>
            </AlertDescription>
          </Alert>
        )
      case "withdraw":
        return (
          <Alert className="border-blue-200 bg-blue-50">
            <Landmark className="h-5 w-5 text-blue-600" />
            <AlertTitle>Bank transfer started</AlertTitle>
            <AlertDescription>
              <p>
                We'll move the funds to account {actionResult.maskedAccount}. Confirmation #{actionResult.recordId}
                .
              </p>
              <p className="text-xs text-muted-foreground">
                Expect a follow-up in your inbox within one business day.
              </p>
            </AlertDescription>
          </Alert>
        )
      case "cashout":
        return (
          <Alert className="border-purple-200 bg-purple-50">
            <MapPin className="h-5 w-5 text-purple-600" />
            <AlertTitle>Cash pickup on deck</AlertTitle>
            <AlertDescription>
              <p>
                We'll text or email you pickup instructions shortly. Reference #{actionResult.recordId} for support.
              </p>
            </AlertDescription>
          </Alert>
        )
      case "forward":
        return (
          <Alert className="border-slate-200 bg-slate-50 space-y-3">
            <Send className="h-5 w-5 text-slate-600" />
            <div className="flex flex-col gap-2">
              <div>
                <AlertTitle>Magic link forwarded</AlertTitle>
                <AlertDescription>
                  <p>
                    {actionResult.recipient} now has their own link. Confirmation #{actionResult.recordId}.
                  </p>
                  {actionResult.notificationSent ? (
                    <p className="text-xs text-muted-foreground">
                      We also emailed them automatically for you.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Copy the link below and share it however you like.
                    </p>
                  )}
                </AlertDescription>
              </div>
              {actionResult.newLink && (
                <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-background p-3 text-xs">
                  <div className="font-medium text-muted-foreground">Recipient link</div>
                  <div className="break-all text-slate-900 dark:text-slate-50">{actionResult.newLink}</div>
                  <div className="flex items-center justify-between gap-2 text-muted-foreground">
                    <span>Expires {actionResult.expiresAt ? new Date(actionResult.expiresAt).toLocaleString() : "soon"}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => handleCopy(actionResult.newLink)}
                      disabled={isCopying}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      {isCopying ? "Copying" : "Copy"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Alert>
        )
      default:
        return null
    }
  }

  // Loading state
  if (flowState === "loading") {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Confirming your claim link…</p>
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
              Link unavailable
            </CardTitle>
            <CardDescription>This link may have expired or already been used.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => (window.location.href = "/")}>Return home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state after advanced self-custody claim
  if (flowState === "success" && walletData && actionResult?.type === "advanced") {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Funds en route
            </CardTitle>
            <CardDescription>Your balance is moving to your own wallet now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <p className="text-muted-foreground">Amount sent</p>
              <p className="text-2xl font-semibold text-green-700">
                {walletData.amount} {walletData.tokenSymbol}
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-muted-foreground text-xs">Destination address</p>
                <p className="font-mono text-xs break-all text-slate-900 dark:text-slate-100">
                  {actionResult.destination}
                </p>
              </div>
            </div>

            {actionResult.txHash && (
              <div className="flex items-center justify-between rounded-md border border-border/60 bg-background p-3 text-xs">
                <div>
                  <p className="font-medium text-muted-foreground">Transaction hash</p>
                  <p className="font-mono break-all text-slate-900 dark:text-slate-50">{actionResult.txHash}</p>
                </div>
                {actionResult.explorerUrl && (
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link href={actionResult.explorerUrl} target="_blank" rel="noreferrer">
                      View
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            )}

            <Alert>
              <MailCheck className="h-4 w-4" />
              <AlertDescription className="text-sm leading-relaxed">
                We've emailed you a receipt and a link to check on this transfer anytime.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => (window.location.href = "/dashboard")}>Send your own</Button>
              <Button variant="outline" className="flex-1" onClick={() => (window.location.href = "/")}>Go home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (flowState === "verify" && walletData) {
    const recipientLabel = walletData.recipientEmail ? `for ${walletData.recipientEmail}` : "waiting for you"

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Your Ghost balance is ready
            </CardTitle>
            <CardDescription>
              You're receiving {walletData.amount} {walletData.tokenSymbol} {recipientLabel}. Choose how you'd like to use it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderActionResult()}

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">Available now</p>
              <p className="text-3xl font-bold text-primary">
                {walletData.amount} {walletData.tokenSymbol}
              </p>
              {walletData.senderName && (
                <p className="text-sm text-muted-foreground mt-2">From {walletData.senderName}</p>
              )}
              {walletData.message && (
                <blockquote className="mt-3 border-l-4 border-primary/40 bg-background/70 p-3 text-sm text-muted-foreground italic whitespace-pre-wrap">
                  {walletData.message}
                </blockquote>
              )}
              {walletData.expiresAt && (
                <p className="mt-3 text-xs text-muted-foreground">
                  This magic link stays active until {new Date(walletData.expiresAt).toLocaleString()}.
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                This balance lives in a temporary Ghost wallet—no setup required. Want it elsewhere? Pick an option below.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-start gap-3 rounded-lg border border-border/60 bg-background p-3 text-sm">
                <MailCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Passwordless recovery</p>
                  <p className="text-muted-foreground">
                    {walletData.recipientEmail
                      ? `Use ${walletData.recipientEmail} for instant magic-link access anytime.`
                      : "Use your email for instant magic-link access anytime."}
                  </p>
                </div>
              </div>
              <div className="flex-1 rounded-lg border border-dashed border-border/60 bg-background p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Ghost wallet ID</p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-foreground/80 break-all">
                  {walletData.walletAddress}
                </p>
                <p className="mt-1">
                  Only needed if you contact support or switch to advanced mode later.
                </p>
              </div>
            </div>

            {activeAction === "overview" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="default"
                  className="justify-start gap-2"
                  onClick={() => setActiveAction("withdraw")}
                  disabled={isActionProcessing}
                >
                  <Landmark className="h-4 w-4" />
                  Withdraw to bank
                </Button>
                <Button
                  variant="default"
                  className="justify-start gap-2"
                  onClick={() => setActiveAction("forward")}
                  disabled={isActionProcessing}
                >
                  <Send className="h-4 w-4" />
                  Send to email or phone
                </Button>
                <Button
                  variant="secondary"
                  className="justify-start gap-2"
                  onClick={() => setActiveAction("cashout")}
                  disabled={isActionProcessing}
                >
                  <MapPin className="h-4 w-4" />
                  Cash out near me
                </Button>
                <Button
                  variant="secondary"
                  className="justify-start gap-2"
                  onClick={handleKeepBalance}
                  disabled={isActionProcessing}
                >
                  <PiggyBank className="h-4 w-4" />
                  {isActionProcessing ? "Saving..." : "Keep in Ghost balance"}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 sm:col-span-2"
                  onClick={() => setActiveAction("advanced")}
                  disabled={isActionProcessing}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Get my own wallet (advanced)
                </Button>
              </div>
            )}

            {activeAction !== "overview" && activeAction !== "advanced" && (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 w-fit"
                onClick={() => setActiveAction("overview")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to options
              </Button>
            )}

            {activeAction === "withdraw" && (
              <div className="space-y-4 rounded-lg border border-border/60 bg-background p-4">
                <div>
                  <h3 className="text-lg font-semibold">Transfer to your bank</h3>
                  <p className="text-sm text-muted-foreground">
                    We just need the basics to initiate the payout. Expect a confirmation email shortly after submitting.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="withdraw-name">Full name</Label>
                    <Input
                      id="withdraw-name"
                      value={withdrawForm.fullName}
                      onChange={(event) =>
                        setWithdrawForm((prev) => ({ ...prev, fullName: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="withdraw-bank">Bank name</Label>
                    <Input
                      id="withdraw-bank"
                      value={withdrawForm.bankName}
                      onChange={(event) =>
                        setWithdrawForm((prev) => ({ ...prev, bankName: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="withdraw-account">Account number</Label>
                    <Input
                      id="withdraw-account"
                      value={withdrawForm.accountNumber}
                      onChange={(event) =>
                        setWithdrawForm((prev) => ({ ...prev, accountNumber: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="withdraw-routing">Routing / IBAN (optional)</Label>
                    <Input
                      id="withdraw-routing"
                      value={withdrawForm.routingNumber}
                      onChange={(event) =>
                        setWithdrawForm((prev) => ({ ...prev, routingNumber: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="withdraw-notes">Notes for our team (optional)</Label>
                    <Textarea
                      id="withdraw-notes"
                      value={withdrawForm.notes}
                      onChange={(event) => setWithdrawForm((prev) => ({ ...prev, notes: event.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
                <Button onClick={handleWithdrawSubmit} disabled={isActionProcessing} className="w-full sm:w-fit">
                  {isActionProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting
                    </>
                  ) : (
                    <>
                      Start transfer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {activeAction === "cashout" && (
              <div className="space-y-4 rounded-lg border border-border/60 bg-background p-4">
                <div>
                  <h3 className="text-lg font-semibold">Cash out in person</h3>
                  <p className="text-sm text-muted-foreground">
                    We partner with MoneyGram and other Stellar anchors. Tell us where you are and we'll send pickup details.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="cashout-name">Full name (for pickup)</Label>
                    <Input
                      id="cashout-name"
                      value={cashoutForm.fullName}
                      onChange={(event) =>
                        setCashoutForm((prev) => ({ ...prev, fullName: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cashout-country">Country</Label>
                    <Input
                      id="cashout-country"
                      value={cashoutForm.country}
                      onChange={(event) =>
                        setCashoutForm((prev) => ({ ...prev, country: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cashout-city">City (optional)</Label>
                    <Input
                      id="cashout-city"
                      value={cashoutForm.city}
                      onChange={(event) => setCashoutForm((prev) => ({ ...prev, city: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cashout-contact">Best contact (optional)</Label>
                    <Input
                      id="cashout-contact"
                      placeholder="Email or phone"
                      value={cashoutForm.contact}
                      onChange={(event) =>
                        setCashoutForm((prev) => ({ ...prev, contact: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleCashoutSubmit} disabled={isActionProcessing} className="w-full sm:w-fit">
                  {isActionProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending request
                    </>
                  ) : (
                    <>
                      Reserve pickup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {activeAction === "forward" && (
              <div className="space-y-4 rounded-lg border border-border/60 bg-background p-4">
                <div>
                  <h3 className="text-lg font-semibold">Forward to someone else</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll spin up a fresh magic link for them. They'll get the same balance instantly.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="forward-recipient">Email or phone</Label>
                    <Input
                      id="forward-recipient"
                      placeholder="friend@example.com"
                      value={forwardRecipient}
                      onChange={(event) => setForwardRecipient(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="forward-note">Include a note (optional)</Label>
                    <Textarea
                      id="forward-note"
                      placeholder="Let them know what it's for."
                      value={forwardNote}
                      onChange={(event) => setForwardNote(event.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <Button onClick={handleForwardSubmit} disabled={isActionProcessing} className="w-full sm:w-fit">
                  {isActionProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating link
                    </>
                  ) : (
                    <>
                      Share new link
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {activeAction === "advanced" && (
              <div className="space-y-4 rounded-lg border border-border/60 bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Advanced: send to your Stellar wallet</h3>
                    <p className="text-sm text-muted-foreground">
                      Prefer self-custody today? Paste the Stellar address below and we'll move the balance out of the Ghost
                      wallet.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-2"
                    onClick={() => setActiveAction("overview")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="advanced-address">Stellar address</Label>
                  <Input
                    id="advanced-address"
                    type="text"
                    placeholder="G..."
                    value={userAddress}
                    onChange={(event) => setUserAddress(event.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll guide you through exporting a wallet later if you ever want more control.
                  </p>
                </div>
                <Button onClick={handleClaimWallet} disabled={isProcessing || !userAddress} className="w-full sm:w-fit">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Moving funds
                    </>
                  ) : (
                    <>
                      Send to my wallet
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
