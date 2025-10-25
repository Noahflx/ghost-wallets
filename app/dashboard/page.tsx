import { SendPaymentForm } from "@/components/send-payment-form"
import { RecentTransactions } from "@/components/recent-transactions"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <div>
              <span className="block font-semibold text-xl">Ghost Wallets</span>
              <span className="block text-sm text-muted-foreground">Send crypto payments instantly</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground hidden sm:block">
            Secure multi-chain payments for teams and creators
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Send Payment</h1>
            <p className="text-muted-foreground leading-relaxed">
              Send USDC or PYUSD to anyone with an email address
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <SendPaymentForm />
            </div>

            <div>
              <RecentTransactions />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
