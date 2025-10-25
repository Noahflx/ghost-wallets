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
    <div className="relative min-h-screen overflow-hidden bg-white text-[#110A2F]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(165,145,255,0.35)_0%,_rgba(255,255,255,0)_65%)]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(206,186,255,0.25)_0%,_rgba(255,255,255,0)_70%)]" />
        <div className="absolute bottom-0 right-0 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,_rgba(198,174,255,0.3)_0%,_rgba(255,255,255,0)_75%)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-[#E6E1FF]/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#B7A6FF] to-[#E3D9FF] text-lg font-semibold text-[#110A2F]">
              G
            </div>
            <div>
              <span className="text-lg font-semibold text-[#110A2F]">Ghost</span>
              <p className="text-xs text-[#5F567C]">The invisible co-pilot for crypto ops</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#5F567C] md:flex">
            <Link href="#why" className="transition hover:text-[#110A2F]">
              Why Ghost
            </Link>
            <Link href="#features" className="transition hover:text-[#110A2F]">
              Platform
            </Link>
            <Link href="#how" className="transition hover:text-[#110A2F]">
              Flow
            </Link>
            <Link href="#security" className="transition hover:text-[#110A2F]">
              Safeguards
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden text-sm font-medium text-[#5F567C] transition hover:text-[#110A2F] md:block">
              Sign in
            </Link>
            <Link href="/dashboard">
              <Button className="rounded-full bg-gradient-to-r from-[#C5B6FF] via-[#B49BFF] to-[#E6DCFF] px-6 text-sm font-semibold text-[#110A2F] shadow-[0_0_40px_-10px_rgba(179,158,255,0.6)] transition hover:opacity-90">
                Launch Ghost
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-24 pt-20 md:flex-row md:items-center">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7E2FF] bg-white/80 px-4 py-1 text-xs font-medium text-[#5F567C] shadow-[0_12px_40px_-20px_rgba(98,75,189,0.45)] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#8F7EFF]" />
              <span>Spin up wallets, flows & approvals in minutes</span>
            </div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-[#110A2F] md:text-6xl">
              Ghost makes multi-chain payouts feel like sending a link.
            </h1>
            <p className="max-w-xl text-lg text-[#5F567C] md:text-xl">
              Automate treasury playbooks, program branded payout portals, and let Ghost choreograph the on-chain heavy lifting. Your teams stay focused on relationships—not rails.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E9E0FF] via-[#C8B7FF] to-[#AD97FF] px-8 py-6 text-base font-semibold text-[#110A2F] shadow-[0_0_50px_-12px_rgba(167,141,255,0.85)] transition hover:translate-y-0.5 hover:opacity-95">
                  Start orchestrating
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full rounded-full border-[#D8CEFF] bg-white/70 px-8 py-6 text-base text-[#5F567C] transition hover:border-[#C5B6FF] hover:bg-white sm:w-auto"
              >
                Explore docs
              </Button>
            </div>
            <div className="grid gap-6 text-sm text-[#5F567C] md:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-[#110A2F]">30s</p>
                <p>Average time from CSV upload to executed batch</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#110A2F]">50+</p>
                <p>Preset flows spanning stablecoins, swaps & fiat ramps</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#110A2F]">∞</p>
                <p>Composable automations powered by Ghost scripts</p>
              </div>
            </div>
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-0 -translate-x-8 rounded-[36px] bg-gradient-to-br from-[#E3DAFF]/60 via-[#C9BBFF]/40 to-transparent blur-3xl" />
            <div className="relative rounded-[32px] border border-[#E7E2FF] bg-white/80 p-8 shadow-[0_40px_120px_-45px_rgba(114,88,192,0.45)] backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-[#5F567C]">
                <span>Ghost Playbook</span>
                <span>Live • Autopilot</span>
              </div>
              <div className="mt-6 rounded-3xl border border-[#EFE9FF] bg-white p-6">
                <div className="flex items-center justify-between text-sm text-[#5F567C]">
                  <span>Recipient set</span>
                  <span className="font-semibold text-[#110A2F]">Founders • Series A</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-[#5F567C]">
                  <span>Network</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#C5B6FF]/60 bg-[#F1ECFF] px-3 py-1 text-xs font-medium text-[#7B69D8]">
                    <Globe className="h-3.5 w-3.5" />Multi-chain
                  </span>
                </div>
                <div className="mt-6 rounded-2xl border border-[#ECE4FF] bg-[#F8F5FF] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8D80B5]">Release</p>
                  <p className="mt-3 text-3xl font-semibold text-[#110A2F]">$1.2M USDC</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[#8D80B5]">
                  <span>Triggered via</span>
                  <span>Ghost CLI • v0.9</span>
                </div>
              </div>
              <div className="mt-6 grid gap-4 text-sm text-[#5F567C]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E9E0FF] text-[#7B69D8]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#110A2F]">Policy aware automation</p>
                    <p className="text-xs text-[#8D80B5]">Ghost validates spend limits and signers before dispatch.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4EFFF] text-[#7B69D8]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#110A2F]">Encrypted recoverability</p>
                    <p className="text-xs text-[#8D80B5]">Secrets stay sealed in Ghost Vault with hardware recovery paths.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="relative border-y border-[#EFE9FF] bg-white/60 py-16 backdrop-blur-xl">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 text-sm text-[#5F567C] md:grid-cols-3">
            {["Treasury automation made human", "Purpose-built for globally distributed teams", "Launch once, reuse everywhere"].map((headline) => (
              <div key={headline} className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B39DFF]">Why teams choose Ghost</span>
                <p className="text-lg font-semibold text-[#110A2F]">{headline}</p>
                <p>
                  Ghost eliminates spreadsheet gymnastics with programmable playbooks, live monitoring, and built-in controls that travel with every wallet.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B39DFF]">Platform</span>
            <h2 className="mt-4 text-balance text-3xl font-semibold text-[#110A2F] md:text-4xl">
              Everything your finance squad needs to choreograph crypto.
            </h2>
            <p className="mt-4 text-lg text-[#5F567C]">
              Compose flows, trigger them from Ghost CLI or the dashboard, and sync the results into your ops stack without leaving the canvas.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="group rounded-3xl border border-[#EEE7FF] bg-white/80 p-8 transition hover:border-[#D8CEFF] hover:bg-white">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ECE3FF] text-[#7B69D8]">
                <Send className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-[#110A2F]">Flow builder</h3>
              <p className="mt-3 text-sm text-[#5F567C]">
                Drag triggers, approvals, and actions into reusable automations your teammates can launch in a click.
              </p>
            </div>
            <div className="group rounded-3xl border border-[#EEE7FF] bg-white/80 p-8 transition hover:border-[#D8CEFF] hover:bg-white">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE5FF] text-[#7B69D8]">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-[#110A2F]">Smart wallets</h3>
              <p className="mt-3 text-sm text-[#5F567C]">
                Ghost spins up branded recipient experiences with passkeys, swaps, and instant attestations baked in.
              </p>
            </div>
            <div className="group rounded-3xl border border-[#EEE7FF] bg-white/80 p-8 transition hover:border-[#D8CEFF] hover:bg-white">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3ECFF] text-[#7B69D8]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-[#110A2F]">Reporting sync</h3>
              <p className="mt-3 text-sm text-[#5F567C]">
                Stream activity into Notion, Airtable, or your data warehouse with full audit trails.
              </p>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-5">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B39DFF]">Flow</span>
              <h2 className="text-3xl font-semibold text-[#110A2F] md:text-4xl">
                Coordinate every release with a single command.
              </h2>
              <p className="text-lg text-[#5F567C]">
                Whether you kick off from the dashboard, Ghost CLI, or an API call, every payout inherits the same guardrails, approvals, and real-time visibility.
              </p>
            </div>
            <div className="space-y-6">
              {[
                {
                  step: "01",
                  title: "Draft a playbook",
                  copy: "Select recipients, amounts, and compliance requirements. Ghost suggests templates based on past runs.",
                },
                {
                  step: "02",
                  title: "Simulate & approve",
                  copy: "Preview gas, on/off-ramp routes, and signer assignments. One-click approvals stream to stakeholders.",
                },
                {
                  step: "03",
                  title: "Autopilot execution",
                  copy: "Ghost dispatches on-chain actions, triggers alerts, and posts results to your comms stack instantly.",
                },
              ].map(({ step, title, copy }) => (
                <div
                  key={step}
                  className="relative overflow-hidden rounded-3xl border border-[#EEE7FF] bg-white/80 p-6 backdrop-blur transition hover:border-[#D8CEFF] hover:bg-white"
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F1ECFF] text-sm font-semibold text-[#7B69D8]">
                      {step}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-[#110A2F]">{title}</h3>
                      <p className="mt-2 text-sm text-[#5F567C]">{copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] border border-[#E8E1FF] bg-gradient-to-br from-[#F7F3FF] via-[#F0E8FF] to-[#FFFFFF] px-6 py-20">
          <div className="absolute right-12 top-12 hidden h-32 w-32 rounded-full bg-[radial-gradient(circle,_rgba(173,151,255,0.3)_0%,_rgba(247,243,255,0)_70%)] md:block" />
          <div className="mx-auto flex max-w-4xl flex-col gap-10 md:flex-row md:items-center">
            <div className="flex-1 space-y-4">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#9E89FF]">Safeguards</span>
              <h2 className="text-3xl font-semibold text-[#110A2F] md:text-4xl">Enterprise controls without the friction.</h2>
              <p className="text-lg text-[#5F567C]">
                Ghost Vault stores secrets with threshold encryption, observability surfaces anomalies in real time, and automated recovery paths keep funds accessible across teams.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#EEE7FF] bg-white/80 p-4 text-sm text-[#5F567C]">
                  <div className="mb-2 flex items-center gap-2 text-[#110A2F]">
                    <Shield className="h-4 w-4 text-[#7B69D8]" />
                    Hardware-backed approvals
                  </div>
                  Require Ledger, YubiKey, or passkey sign-offs at any stage of a playbook.
                </div>
                <div className="rounded-2xl border border-[#EEE7FF] bg-white/80 p-4 text-sm text-[#5F567C]">
                  <div className="mb-2 flex items-center gap-2 text-[#110A2F]">
                    <Zap className="h-4 w-4 text-[#7B69D8]" />
                    Live compliance monitoring
                  </div>
                  Sanctions screening, travel-rule exports, and automated journaling keep auditors satisfied.
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <div className="rounded-3xl border border-[#EEE7FF] bg-white/80 p-6 text-sm text-[#5F567C] backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-[#9E89FF]">Resilience</p>
                <p className="mt-3 text-lg text-[#110A2F]">
                  Multi-region relayers and auto-failover scripts mean Ghost keeps working even when networks are congested.
                </p>
              </div>
              <div className="rounded-3xl border border-[#EEE7FF] bg-white/80 p-6 text-sm text-[#5F567C] backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-[#9E89FF]">Auditability</p>
                <p className="mt-3 text-lg text-[#110A2F]">
                  Every playbook run captures immutable context you can export to Notion, Slack, or your ledger.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6 rounded-[40px] border border-[#E5DEFF] bg-gradient-to-r from-[#E9E0FF] via-[#D4C4FF] to-[#F0E8FF] p-[1px]">
            <div className="rounded-[38px] bg-white px-8 py-14">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B39DFF]">Get started</span>
              <h2 className="mt-4 text-3xl font-semibold text-[#110A2F] md:text-4xl">Bring Ghost to your treasury command center.</h2>
              <p className="mt-4 text-lg text-[#5F567C]">
                Launch a sandbox workspace, test automations with Ghost CLI, and invite stakeholders when you are ready to scale.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="w-full rounded-full bg-[#110A2F] px-8 py-6 text-base font-semibold text-white shadow-[0_30px_80px_-30px_rgba(17,10,47,0.55)] transition hover:opacity-90">
                    Launch Ghost
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-[#D8CEFF] bg-white/70 px-8 py-6 text-base text-[#5F567C] transition hover:border-[#C5B6FF] hover:bg-white sm:w-auto"
                >
                  Chat with the team
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E6E1FF] bg-white/80 py-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-[#5F567C] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#B7A6FF] to-[#E3D9FF] text-sm font-semibold text-[#110A2F]">
              G
            </div>
            <div>
              <p className="font-medium text-[#110A2F]">Ghost</p>
              <p className="text-xs text-[#8D80B5]">© {new Date().getFullYear()} Ghost Labs</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs md:text-sm">
            <Link href="#security" className="transition hover:text-[#110A2F]">
              Safeguards
            </Link>
            <Link href="/dashboard" className="transition hover:text-[#110A2F]">
              App
            </Link>
            <Link href="mailto:team@ghost.dev" className="transition hover:text-[#110A2F]">
              team@ghost.dev
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
