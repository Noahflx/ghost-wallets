"use client"

import { motion } from "framer-motion"
import { MailCheck, Link2, Wallet, Rocket } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const STEPS = [
  {
    title: "1. Send to any email",
    description: "Type an email, amount, and asset. We spin up a Soroban-backed wallet contract for that recipient.",
    icon: MailCheck,
    badge: "Live on the dashboard",
  },
  {
    title: "2. Magic link receipt",
    description: "The inbox gets a cinematic email with the funding hash and explorer link. Works in simulation or testnet mode.",
    icon: Link2,
    badge: "Inbox moment",
  },
  {
    title: "3. Claim to Stellar",
    description: "Recipient pastes their Stellar address. We mark the link claimed, transfer ownership, and log the claim metrics.",
    icon: Wallet,
    badge: "Ownership recorded",
  },
  {
    title: "4. Storytelling beat",
    description: "Show the dashboard: balance animation, analytics, and the explorer link for judges to verify on-chain movement.",
    icon: Rocket,
    badge: "2-minute win",
  },
]

export function DemoWalkthrough() {
  return (
    <Card className="bg-card/70 border border-border/30 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Cinematic demo script</CardTitle>
        <CardDescription>Follow this flow during judging to sell the vision end-to-end.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="flex items-start gap-4 rounded-xl border border-border/20 bg-muted/20 p-4"
            >
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold leading-none">{step.title}</h3>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {step.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          )
        })}
      </CardContent>
    </Card>
  )
}
