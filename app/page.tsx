import Link from "next/link"
import { ArrowRight, Shield, Zap, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <span className="font-semibold text-xl">Ghost Wallets</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>
          <Link href="/dashboard">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-6">
            Send crypto to anyone, anywhere
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto leading-relaxed">
            Send USDC or PYUSD on Stellar to any email or phone number. No wallet required. Recipients claim funds with
            a simple magic link.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Send Your First Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Crypto payments made simple</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Delivery</h3>
              <p className="text-muted-foreground leading-relaxed">
                Send USDC or PYUSD instantly to any email or phone number. Funds arrive in seconds on the Stellar
                network.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Safe</h3>
              <p className="text-muted-foreground leading-relaxed">
                Smart contract wallets with built-in recovery. Your funds are protected by Stellar's battle-tested
                security.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Wallet Needed</h3>
              <p className="text-muted-foreground leading-relaxed">
                Recipients don't need a crypto wallet. They receive a magic link to claim funds with email or passkey
                verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How it works</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Enter recipient details</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Simply enter the recipient's email or phone number and the amount you want to send.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">We create a smart wallet</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our system automatically deploys a secure Soroban smart contract wallet and sends the funds.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Recipient claims funds</h3>
                <p className="text-muted-foreground leading-relaxed">
                  They receive a magic link, verify their identity, and can view their balance or cash out instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">G</span>
              </div>
              <span className="text-sm text-muted-foreground">Ghost Wallets</span>
            </div>
            <p className="text-sm text-muted-foreground">Built on Stellar. Powered by Soroban smart contracts.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
