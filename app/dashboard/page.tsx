"use client"

import { useState } from "react"
import { SendPaymentForm } from "@/components/send-payment-form"
import { RecentTransactions } from "@/components/recent-transactions"
import Image from "next/image"
import {
  motion,
  useMotionValue,
  animate,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion"

export default function DashboardPage() {
  const [showSuccess, setShowSuccess] = useState(false)

  // source of truth for balance animation
  const balance = useMotionValue(7572.54)
  // plain string to render (fixes "Objects are not valid as a React child")
  const [displayBalance, setDisplayBalance] = useState(balance.get().toFixed(2))
  useMotionValueEvent(balance, "change", (v) => {
    setDisplayBalance(Number(v).toFixed(2))
  })

  async function handlePaymentSend(amount: number) {
    const current = balance.get()
    const target = Math.max(current - Number(amount || 0), 0)

    // smooth, any-number → any-number countdown
    animate(current, target, {
      duration: 1.2,
      ease: "easeInOut",
      onUpdate: (v) => balance.set(v),
    })

    // payment sent overlay
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 1600)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Ghost Wallets logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-base sm:text-lg leading-none">
              Ghost Wallets
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-md border border-border/40 px-3 py-1">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-2 w-2 rounded-full bg-emerald-500"
              />
              <span>Operational</span>
            </span>
          </div>
        </div>

        {/* Sub-nav */}
        <nav className="mx-auto max-w-7xl px-4 sm:px-6">
          <ul className="flex gap-2 text-sm">
            {[
              { label: "Overview", href: "#", inactive: true },
              { label: "Send", href: "#", active: true },
              { label: "Activity", href: "#", inactive: true },
              { label: "Settings", href: "#", inactive: true },
            ].map((t) => (
              <li key={t.label}>
                <a
                  href={t.href}
                  className={[
                    "inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                    t.active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  <span className="relative font-medium">
                    {t.label}
                    {t.active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute left-0 -bottom-2 block h-[2px] w-full bg-indigo-500 rounded-full"
                      />
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Page */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-14">
        {/* Page header */}
        <div className="mb-10 md:mb-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Send payment
              </h1>
              <p className="mt-3 text-base text-muted-foreground max-w-prose">
                Send USDC or PYUSD to any email. Clean handoff. Instant confirmations.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left: Primary action */}
          <section
            aria-labelledby="transfer-form"
            className="group rounded-2xl bg-card/70 shadow-md hover:shadow-lg transition-all border border-border/30 relative overflow-hidden"
          >
            <header className="flex items-center justify-between px-6 py-5 border-b border-border/30">
              <div className="min-w-0">
                <h2 id="transfer-form" className="text-lg font-medium leading-none">
                  Transfer
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Funds move over Stellar. Receiver gets a claim link by email.
                </p>
              </div>
            </header>

            <div className="p-6">
              {/* Keep your existing logic; only add the handler for the animations */}
              {/* @ts-ignore - we inject onSend for the animation hook */}
              <SendPaymentForm onSend={(amount: number) => handlePaymentSend(amount)} />
            </div>

            {/* Success overlay animation */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl"
                    >
                      ✓
                    </motion.div>
                    <p className="text-sm font-medium text-emerald-600">
                      Payment Sent
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-6 py-4 border-t border-border/30 text-xs text-muted-foreground">
              Double-check the email before sending. Payments are final once claimed.
            </div>
          </section>

          {/* Right: Context panels */}
          <div className="space-y-10">
            {/* Wallet summary */}
            <section
              aria-labelledby="wallet-summary"
              className="rounded-2xl bg-card/70 shadow-md hover:shadow-lg transition-all border border-border/30"
            >
              <header className="px-6 py-5 border-b border-border/30">
                <h2 id="wallet-summary" className="text-lg font-medium leading-none">
                  Wallet summary
                </h2>
              </header>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-5">
                  <Stat
                    label="Available balance"
                    value={`$${displayBalance}`}
                    hint="Connect a funding source"
                  />
                  <Stat label="Limit remaining" value="—" hint="Set limits in Settings" />
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-medium">Supported assets</h3>
                  <ul className="mt-4 divide-y divide-border/30 rounded-lg border border-border/30">
                    {[
                      { code: "USDC", name: "USD Coin", status: "Enabled" },
                      { code: "PYUSD", name: "PayPal USD", status: "Enabled" },
                    ].map((a) => (
                      <li
                        key={a.code}
                        className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-none">{a.code}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{a.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{a.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Recent activity */}
            <section
              aria-labelledby="recent-activity"
              className="rounded-2xl bg-card/70 shadow-md hover:shadow-lg transition-all border border-border/30"
            >
              <header className="px-6 py-5 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <h2 id="recent-activity" className="text-lg font-medium leading-none">
                    Recent activity
                  </h2>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-indigo-500 transition-colors"
                  >
                    View all
                  </a>
                </div>
              </header>
              <div className="p-3 sm:p-4">
                <RecentTransactions />
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} Ghost Wallets</p>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-indigo-500 transition-colors">Docs</a>
              <a href="#" className="hover:text-indigo-500 transition-colors">Status</a>
              <a href="#" className="hover:text-indigo-500 transition-colors">Compliance</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** Reusable stat card (no MotionValue rendered directly) */
function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl bg-muted/20 p-5 hover:bg-muted/30 transition-colors">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
