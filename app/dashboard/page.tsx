import { SendPaymentForm } from "@/components/send-payment-form"
import { RecentTransactions } from "@/components/recent-transactions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <span className="font-semibold text-xl">Ghost Wallets</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Send Payment</h1>
            <p className="text-muted-foreground leading-relaxed">
              Send USDC or PYUSD to anyone via email or phone number
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Send Payment Form */}
            <div>
              <SendPaymentForm />
            </div>

            {/* Recent Transactions */}
            <div>
              <RecentTransactions />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
