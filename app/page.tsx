import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Shield,
  Send,
  Wallet,
  Zap,
  Globe,
  CheckCircle2,
  Lock,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05020D] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(118,86,255,0.5)_0%,_rgba(5,2,13,0)_60%)]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(66,196,255,0.35)_0%,_rgba(5,2,13,0)_65%)]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(255,118,188,0.3)_0%,_rgba(5,2,13,0)_70%)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#05020D]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#736BFF] to-[#40E2FF] text-lg font-semibold text-[#05020D]">
              G
            </div>
            <div>
              <span className="text-lg font-semibold">Ghost Wallets</span>
              <p className="text-xs text-white/60">Custody-free global payouts</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
            <Link href="#why" className="transition hover:text-white">
              Why Ghost
            </Link>
            <Link href="#features" className="transition hover:text-white">
              Platform
            </Link>
            <Link href="#how" className="transition hover:text-white">
              How it works
            </Link>
            <Link href="#security" className="transition hover:text-white">
              Security
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden text-sm font-medium text-white/70 transition hover:text-white md:block">
              Sign in
            </Link>
            <Link href="/dashboard">
              <Button className="rounded-full bg-gradient-to-r from-[#6C63FF] via-[#8A5CFF] to-[#3DEBFF] px-6 text-sm font-semibold text-[#05020D] shadow-[0_0_40px_-10px_rgba(108,99,255,0.6)] transition hover:opacity-90">
                Launch app
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-24 pt-20 md:flex-row md:items-center">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium text-white/70 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#7D73FF]" />
              <span>Send branded payouts in seconds</span>
            </div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              The sleekest way to send crypto to anyone on the internet.
            </h1>
            <p className="max-w-xl text-lg text-white/70 md:text-xl">
              Ghost Wallets merges the polish of modern fintech with self-custody. Issue global USDC payouts to email
              addresses, with passkey security and instant settlement on Stellar.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6C63FF] via-[#8A5CFF] to-[#3DEBFF] px-8 py-6 text-base font-semibold text-[#05020D] shadow-[0_0_50px_-12px_rgba(108,99,255,0.9)] transition hover:translate-y-0.5 hover:opacity-95">
                  Create a payout
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full rounded-full border-white/20 bg-white/5 px-8 py-6 text-base text-white/80 transition hover:border-white/40 hover:bg-white/10 sm:w-auto"
              >
                Talk to sales
              </Button>
            </div>
            <div className="grid gap-6 text-sm text-white/60 md:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-white">4.8s</p>
                <p>Average settlement on Stellar</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">38+</p>
                <p>Supported payout destinations</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">99.99%</p>
                <p>Uptime across our smart wallet network</p>
              </div>
            </div>
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-0 -translate-x-8 rounded-[36px] bg-gradient-to-br from-[#7D73FF]/30 via-[#40E2FF]/20 to-transparent blur-3xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_40px_120px_-45px_rgba(15,10,40,0.9)] backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Ghost Payout</span>
                <span>Live • Soroban</span>
              </div>
              <div className="mt-6 rounded-3xl border border-white/5 bg-black/40 p-6">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Recipient</span>
                  <span className="font-semibold text-white">sophia@orbit.studio</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                  <span>Network</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#40E2FF]/40 bg-[#40E2FF]/10 px-3 py-1 text-xs font-medium text-[#40E2FF]">
                    <Globe className="h-3.5 w-3.5" />Stellar
                  </span>
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">Amount</p>
                  <p className="mt-3 text-3xl font-semibold text-white">2,500.00 USDC</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                  <span>Smart wallet created</span>
                  <span>0x82F…991C</span>
                </div>
              </div>
              <div className="mt-6 grid gap-4 text-sm text-white/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7D73FF]/15 text-[#7D73FF]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Instant on-chain escrow</p>
                    <p className="text-xs text-white/50">Soroban contract locks funds until claimed.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#40E2FF]/15 text-[#40E2FF]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Passkey-secured claiming</p>
                    <p className="text-xs text-white/50">Email or passkey verification in under a minute.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="relative border-y border-white/5 bg-white/[0.03] py-16 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-10 px-6 text-sm text-white/40">
            <span>Trusted by treasury teams at</span>
            <div className="flex flex-wrap items-center gap-6 text-white/60">
              <span className="font-semibold tracking-wide">Orbit Labs</span>
              <span className="font-semibold tracking-wide">Nova Guild</span>
              <span className="font-semibold tracking-wide">Stellar Foundation</span>
              <span className="font-semibold tracking-wide">Relay Collective</span>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-white/40">Platform</span>
            <h2 className="mt-4 text-balance text-3xl font-semibold md:text-4xl">
              A self-serve payout desk with enterprise-grade polish.
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Automate USDC distribution, monitor wallet health, and give recipients a delightful claiming experience.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="group rounded-3xl border border-white/5 bg-white/[0.05] p-8 transition hover:border-white/15 hover:bg-white/[0.08]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7D73FF]/15 text-[#7D73FF]">
                <Send className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">Batch or one-off payouts</h3>
              <p className="mt-3 text-sm text-white/60">
                Upload CSVs or trigger payouts via API. We deploy recipient wallets instantly and handle the on-chain flow.
              </p>
            </div>
            <div className="group rounded-3xl border border-white/5 bg-white/[0.05] p-8 transition hover:border-white/15 hover:bg-white/[0.08]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#40E2FF]/15 text-[#40E2FF]">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">Magic link claiming</h3>
              <p className="mt-3 text-sm text-white/60">
                Recipients receive a beautifully branded portal with passkey support and instant swaps to local partners.
              </p>
            </div>
            <div className="group rounded-3xl border border-white/5 bg-white/[0.05] p-8 transition hover:border-white/15 hover:bg-white/[0.08]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF7BCA]/20 text-[#FF7BCA]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">Treasury level insights</h3>
              <p className="mt-3 text-sm text-white/60">
                Monitor flows in real time, reconcile payouts, and export audit trails designed for finance teams.
              </p>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-5">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-white/40">Workflow</span>
              <h2 className="text-3xl font-semibold md:text-4xl">
                Ship payouts without asking your engineers for help.
              </h2>
              <p className="text-lg text-white/60">
                We abstract away wallet creation, recovery, and compliance. Your team focuses on why the funds move—not how.
              </p>
            </div>
            <div className="space-y-6">
              {[
                {
                  step: "01",
                  title: "Load recipients",
                  copy:
                    "Type in an email, upload a CSV, or call our API. We verify destinations and prepare smart wallets on the fly.",
                },
                {
                  step: "02",
                  title: "Approve and dispatch",
                  copy:
                    "Treasury policies, spending limits, and multi-sig reviews are enforced before anything hits the chain.",
                },
                {
                  step: "03",
                  title: "Recipients claim instantly",
                  copy:
                    "Magic links open a Phantom-quality experience with passkey login, fiat ramps, and customer support built-in.",
                },
              ].map(({ step, title, copy }) => (
                <div
                  key={step}
                  className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.04] p-6 backdrop-blur transition hover:border-white/15 hover:bg-white/[0.08]"
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-white/70">
                      {step}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm text-white/60">{copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] border border-white/5 bg-gradient-to-br from-[#17152A] via-[#120F24] to-[#05020D] px-6 py-20">
          <div className="absolute right-12 top-12 hidden h-32 w-32 rounded-full bg-[radial-gradient(circle,_rgba(61,235,255,0.4)_0%,_rgba(18,15,36,0)_70%)] md:block" />
          <div className="mx-auto flex max-w-4xl flex-col gap-10 md:flex-row md:items-center">
            <div className="flex-1 space-y-4">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#3DEBFF]">Security</span>
              <h2 className="text-3xl font-semibold md:text-4xl">Enterprise controls built into every wallet.</h2>
              <p className="text-lg text-white/60">
                Your treasury policies live on-chain. From configurable recovery guardians to real-time anomaly detection,
                Ghost keeps funds safe without slowing your finance team.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70">
                  <div className="mb-2 flex items-center gap-2 text-white">
                    <Shield className="h-4 w-4 text-[#7D73FF]" />
                    Hardware-backed approvals
                  </div>
                  Enforce policy-based approvals with Ledger and YubiKey support.
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70">
                  <div className="mb-2 flex items-center gap-2 text-white">
                    <Zap className="h-4 w-4 text-[#40E2FF]" />
                    Live compliance monitoring
                  </div>
                  Sanctions screening, travel rule exports, and anomaly alerts included.
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 text-sm text-white/70 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">Resilience</p>
                <p className="mt-3 text-lg text-white">
                  Multi-region relayers and automatic wallet recovery ensure 24/7 access even under network pressure.
                </p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 text-sm text-white/70 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">Auditability</p>
                <p className="mt-3 text-lg text-white">
                  Every action writes to an immutable ledger. Export SOC 2-ready reports with a single click.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6 rounded-[40px] border border-white/10 bg-gradient-to-r from-[#6C63FF] via-[#8A5CFF] to-[#3DEBFF] p-[1px]">
            <div className="rounded-[38px] bg-[#05020D] px-8 py-14">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-white/50">Get Started</span>
              <h2 className="mt-4 text-3xl font-semibold md:text-4xl">Bring treasury-grade payouts to your product.</h2>
              <p className="mt-4 text-lg text-white/70">
                Spin up a sandbox in minutes or connect with our team for a tailored deployment plan.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="w-full rounded-full bg-white px-8 py-6 text-base font-semibold text-[#05020D] shadow-[0_30px_80px_-30px_rgba(255,255,255,0.9)] transition hover:opacity-90">
                    Launch the app
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-white/30 bg-white/5 px-8 py-6 text-base text-white/80 transition hover:border-white/60 hover:bg-white/10 sm:w-auto"
                >
                  Book a demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#04000C]/80 py-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#736BFF] to-[#40E2FF] text-sm font-semibold text-[#05020D]">
              G
            </div>
            <div>
              <p className="font-medium text-white">Ghost Wallets</p>
              <p className="text-xs text-white/50">© {new Date().getFullYear()} Ghost Labs, Inc.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs md:text-sm">
            <Link href="#security" className="transition hover:text-white">
              Security
            </Link>
            <Link href="/dashboard" className="transition hover:text-white">
              App
            </Link>
            <Link href="mailto:hello@ghostwallets.xyz" className="transition hover:text-white">
              hello@ghostwallets.xyz
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
