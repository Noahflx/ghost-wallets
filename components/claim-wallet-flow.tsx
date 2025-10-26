"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Loader2, CheckCircle2, XCircle, ArrowRight, Send, Banknote, MapPin, ShieldCheck, PiggyBank } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ClaimWalletFlowProps {
  token: string
}

type FlowState = "loading" | "verify" | "success" | "error"

type ClaimAction = "keep" | "send" | "cashout" | "withdraw" | "wallet"

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

interface ForwardResult {
  amount: string
  currency: string
  recipient: string
  magicLinkUrl: string
  magicLinkExpiresAt: string
}

interface RecoveryChallengeState {
  id: string
  expiresAt: string
}

interface RecoveryWalletSummary {
  id: string
  amount: string
  currency: string
  status: string
  magicLinkUrl: string
  createdAt: string
  updatedAt: string
  claimedAt: string | null
  explorerUrl: string | null
}

export function ClaimWalletFlow({ token }: ClaimWalletFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>("loading")
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [selectedAction, setSelectedAction] = useState<ClaimAction>("keep")
  const [userAddress, setUserAddress] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const [forwardEmail, setForwardEmail] = useState("")
  const [forwardMessage, setForwardMessage] = useState("")
  const [isForwarding, setIsForwarding] = useState(false)
  const [forwardResult, setForwardResult] = useState<ForwardResult | null>(null)

  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryChallenge, setRecoveryChallenge] = useState<RecoveryChallengeState | null>(null)
  const [recoveryOtp, setRecoveryOtp] = useState("")
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [recoveryWallets, setRecoveryWallets] = useState<RecoveryWalletSummary[] | null>(null)
  const [recoveryTokenExpiresAt, setRecoveryTokenExpiresAt] = useState<string | null>(null)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    verifyMagicLink()
  }, [token])

  useEffect(() => {
    if (walletData?.recipientEmail) {
      setForwardEmail(walletData.recipientEmail)
      setRecoveryEmail(walletData.recipientEmail)
    }
  }, [walletData?.recipientEmail])

  const actionCards = useMemo(
    () => [
      {
        id: "keep" as const,
        title: "Keep it here",
        description: "We'll hold it in your Ghost balance until you're ready.",
        icon: PiggyBank,
      },
      {
        id: "send" as const,
        title: "Send to someone",
        description: "Forward instantly to another email or phone.",
        icon: Send,
      },
      {
        id: "cashout" as const,
        title: "Cash out nearby",
        description: "Use MoneyGram partners for in-person pickup.",
        icon: MapPin,
      },
      {
        id: "withdraw" as const,
        title: "Withdraw to bank",
        description: "Link a bank or fintech account (beta).",
        icon: Banknote,
      },
      {
        id: "wallet" as const,
        title: "Advanced wallet",
        description: "Move to your own Stellar wallet address.",
        icon: ShieldCheck,
      },
    ],
    [],
  )

  const verifyMagicLink = async () => {
    try {
      const response = await fetch("/api/verify-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || "Invalid or expired link")
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
        title: "Add your wallet",
        description: "Enter the Stellar address you want to use.",
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
        throw new Error(data.error || "Failed to complete transfer")
      }

      setFlowState("success")
      toast({
        title: "Funds sent",
        description: "Your transfer is on the way to your wallet address.",
      })
    } catch (error) {
      toast({
        title: "Could not move funds",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleForwardFunds = async () => {
    if (!forwardEmail) {
      toast({
        title: "Recipient required",
        description: "Enter an email address to forward the funds.",
        variant: "destructive",
      })
      return
    }

    setIsForwarding(true)
    setForwardResult(null)

    try {
      const response = await fetch("/api/ghost-wallets/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, destination: forwardEmail, message: forwardMessage, senderName: walletData?.senderName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to forward this transfer")
      }

      setForwardResult({
        amount: data.amount,
        currency: data.currency,
        recipient: data.recipient,
        magicLinkUrl: data.magicLinkUrl,
        magicLinkExpiresAt: data.magicLinkExpiresAt,
      })

      toast({
        title: "Sent!",
        description: `We created a new Ghost wallet for ${data.recipient}.`,
      })
    } catch (error) {
      toast({
        title: "Forwarding failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsForwarding(false)
    }
  }

  const handleRequestRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!recoveryEmail) {
      setRecoveryError("Enter the email you want to recover")
      return
    }

    setRecoveryError(null)
    setIsRequestingOtp(true)
    setRecoveryWallets(null)

    try {
      const response = await fetch("/api/ghost-wallets/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to send code")
      }

      setRecoveryChallenge({ id: data.challengeId, expiresAt: data.expiresAt })
      setRecoveryOtp("")

      toast({
        title: "Check your inbox",
        description: "We just sent a login code to your email.",
      })
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : "Unable to send recovery code")
    } finally {
      setIsRequestingOtp(false)
    }
  }

  const handleVerifyRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!recoveryChallenge) {
      setRecoveryError("Request a code first")
      return
    }

    if (!recoveryOtp || recoveryOtp.length !== 6) {
      setRecoveryError("Enter the 6-digit code from your email")
      return
    }

    setRecoveryError(null)
    setIsVerifyingOtp(true)

    try {
      const response = await fetch("/api/ghost-wallets/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail, challengeId: recoveryChallenge.id, otp: recoveryOtp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid code")
      }

      setRecoveryWallets(data.wallets ?? [])
      setRecoveryTokenExpiresAt(data.expiresAt ?? null)

      toast({
        title: "Recovery unlocked",
        description: "You can access every Ghost wallet tied to this email.",
      })
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : "Could not verify code")
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  if (flowState === "loading") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Checking your transfer…</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (flowState === "error") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Link not available
            </CardTitle>
            <CardDescription>{errorMessage || "This claim link can no longer be used."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {errorMessage || "If you think this is a mistake, ask the sender to generate a new magic link."}
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => (window.location.href = "/")}>Return home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (flowState === "success" && walletData) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Transfer scheduled
            </CardTitle>
            <CardDescription>Your funds are headed to the wallet you provided.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-semibold">
                  {walletData.amount} {walletData.tokenSymbol}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destination wallet</p>
                <p className="text-xs font-mono break-all text-foreground/80">{userAddress}</p>
              </div>
            </div>
            <Alert>
              <AlertDescription className="text-sm leading-relaxed">
                Keep an eye on your wallet—your Ghost funds will arrive shortly. You can always come back with your
                email if you need to resend or check history.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={() => (window.location.href = "/dashboard")}>Open Ghost dashboard</Button>
              <Button variant="outline" className="flex-1" onClick={() => (window.location.href = "/")}>Send your own transfer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (flowState === "verify" && walletData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">You're receiving {walletData.amount} {walletData.tokenSymbol}</CardTitle>
                <CardDescription className="mt-2 text-base text-muted-foreground">
                  Choose how you want to grab it. No wallet setup required unless you want full self-custody.
                </CardDescription>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2">
              {walletData.senderName && (
                <p className="text-sm text-muted-foreground">From {walletData.senderName}</p>
              )}
              {walletData.recipientEmail && (
                <p className="text-sm text-muted-foreground">For {walletData.recipientEmail}</p>
              )}
              {walletData.message && (
                <blockquote className="border-l-2 border-primary/40 pl-3 italic text-sm text-muted-foreground">
                  “{walletData.message}”
                </blockquote>
              )}
              {walletData.expiresAt && (
                <p className="text-xs text-muted-foreground">Claim link valid until {new Date(walletData.expiresAt).toLocaleString()}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {actionCards.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setSelectedAction(action.id)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    selectedAction === action.id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <action.icon className="h-4 w-4 text-primary" />
                    {action.title}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-snug">{action.description}</p>
                </button>
              ))}
            </div>

            {selectedAction === "keep" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your money is already sitting in a Ghost wallet we spun up automatically. Come back any time with your
                  email to move it, spend it, or cash it out. No blockchain jargon, no setup.
                </p>
                <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-medium">Need it later?</p>
                  <p className="text-xs text-muted-foreground">
                    We'll text or email you a one-time code so you can jump back in whenever. It's like logging into a
                    neobank—except it's crypto under the hood.
                  </p>
                  <form className="space-y-3" onSubmit={handleRequestRecovery}>
                    <div className="space-y-1">
                      <Label htmlFor="recovery-email">Email for recovery</Label>
                      <Input
                        id="recovery-email"
                        type="email"
                        value={recoveryEmail}
                        onChange={(event) => setRecoveryEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button type="submit" className="sm:w-auto" disabled={isRequestingOtp}>
                        {isRequestingOtp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending code…
                          </>
                        ) : (
                          "Send me a login code"
                        )}
                      </Button>
                      {recoveryChallenge && (
                        <p className="text-xs text-muted-foreground sm:flex-1">
                          Code expires at {new Date(recoveryChallenge.expiresAt).toLocaleTimeString()}.
                        </p>
                      )}
                    </div>
                  </form>

                  {recoveryChallenge && (
                    <form className="space-y-3" onSubmit={handleVerifyRecovery}>
                      <div className="space-y-1">
                        <Label htmlFor="recovery-otp">Enter 6-digit code</Label>
                        <Input
                          id="recovery-otp"
                          inputMode="numeric"
                          maxLength={6}
                          value={recoveryOtp}
                          onChange={(event) => setRecoveryOtp(event.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="123456"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isVerifyingOtp}>
                        {isVerifyingOtp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying…
                          </>
                        ) : (
                          "Unlock my Ghost wallets"
                        )}
                      </Button>
                    </form>
                  )}

                  {recoveryError && (
                    <p className="text-xs text-destructive">{recoveryError}</p>
                  )}

                  {recoveryWallets && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Wallets linked to {recoveryEmail} (session valid until {" "}
                        {recoveryTokenExpiresAt ? new Date(recoveryTokenExpiresAt).toLocaleTimeString() : "later"})
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {recoveryWallets.length === 0 && (
                          <p className="text-xs text-muted-foreground">No active transfers yet—senders can share fresh ones any time.</p>
                        )}
                        {recoveryWallets.map((wallet) => (
                          <div key={wallet.id} className="rounded-md border border-border/60 bg-background/80 p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground/90">
                                {wallet.amount} {wallet.currency}
                              </span>
                              <span className="uppercase text-[10px] text-muted-foreground">{wallet.status}</span>
                            </div>
                            <p className="text-muted-foreground/80 break-all">{wallet.magicLinkUrl}</p>
                            <p className="text-muted-foreground/60">Sent {new Date(wallet.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedAction === "send" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We'll spin up a brand-new Ghost wallet for the next person and shoot them a magic link instantly. You
                  can keep a note attached if you want.
                </p>
                <div className="rounded-lg border border-border/60 bg-background p-4 space-y-4">
                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="forward-email">Send to email or phone</Label>
                      <Input
                        id="forward-email"
                        type="text"
                        placeholder="friend@example.com"
                        value={forwardEmail}
                        onChange={(event) => setForwardEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="forward-message">Message (optional)</Label>
                      <Textarea
                        id="forward-message"
                        placeholder="Add a note for the recipient"
                        value={forwardMessage}
                        onChange={(event) => setForwardMessage(event.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button onClick={handleForwardFunds} disabled={isForwarding} className="w-full sm:w-auto">
                    {isForwarding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Forwarding…
                      </>
                    ) : (
                      "Forward this transfer"
                    )}
                  </Button>
                  {forwardResult && (
                    <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-xs space-y-1">
                      <p className="font-medium">
                        New magic link for {forwardResult.recipient}
                      </p>
                      <p className="break-all text-muted-foreground">{forwardResult.magicLinkUrl}</p>
                      <p className="text-muted-foreground/80">
                        Link expires {new Date(forwardResult.magicLinkExpiresAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedAction === "cashout" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Prefer cash? Show your phone and ID at any MoneyGram that supports Stellar payouts and give them this
                  claim link. We’ll surface a QR code in the next release so cash pickup is one tap.
                </p>
                <div className="rounded-lg border border-border/60 bg-background p-4 space-y-3 text-sm">
                  <p className="font-medium">How it works</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Find a nearby MoneyGram that supports Stellar cash outs.</li>
                    <li>Share this claim link or show the upcoming QR code at the counter.</li>
                    <li>Walk out with {walletData.amount} {walletData.tokenSymbol} in your local currency.</li>
                  </ol>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild variant="outline" className="sm:w-auto">
                      <a href="https://www.moneygram.com/mgo/us/en/locations" target="_blank" rel="noreferrer">
                        Find a MoneyGram near me
                      </a>
                    </Button>
                    <Button variant="ghost" className="sm:w-auto" disabled>
                      QR claim (coming soon)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedAction === "withdraw" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We're launching direct bank and fintech payouts with Stellar anchors. Connect your account once and
                  future transfers can auto-deposit.
                </p>
                <div className="rounded-lg border border-border/60 bg-background p-4 space-y-3">
                  <p className="text-sm font-medium">Early access</p>
                  <p className="text-xs text-muted-foreground">
                    Drop your email and we'll invite you as soon as bank withdrawals are enabled.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={recoveryEmail}
                      onChange={(event) => setRecoveryEmail(event.target.value)}
                      className="sm:flex-1"
                    />
                    <Button className="sm:w-auto" onClick={() => toast({ title: "You're on the list", description: "We'll reach out as soon as bank withdrawals go live." })}>
                      Join the waitlist
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedAction === "wallet" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Already manage your own Stellar wallet? Drop the public address below and we'll ship the funds there
                  right away.
                </p>
                <div className="rounded-lg border border-border/60 bg-background p-4 space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="wallet-address">Stellar wallet address</Label>
                    <Input
                      id="wallet-address"
                      type="text"
                      placeholder="G..."
                      value={userAddress}
                      onChange={(event) => setUserAddress(event.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Alert>
                    <AlertDescription className="text-xs text-muted-foreground">
                      We'll move the full balance in a single transfer. Double-check your address—blockchain transfers
                      can't be reversed.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleClaimWallet} disabled={isProcessing || !userAddress} className="w-full sm:w-auto">
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Move to my wallet
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <div className="rounded-md border border-dashed border-border/60 bg-muted/40 p-3 text-xs space-y-1">
                    <p className="font-medium">Ghost wallet on file</p>
                    <p className="font-mono break-all text-muted-foreground">{walletData.walletAddress}</p>
                    {walletData.contractAddress && (
                      <p className="text-muted-foreground/70">Contract: {walletData.contractAddress}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
