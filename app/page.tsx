"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Send,
  ShieldCheck,
  Zap,
  Clock,
} from "lucide-react"

export default function LandingPage() {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })

  // Parallax for hero shapes
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.25])

  return (
    <div ref={ref} className="min-h-screen bg-background text-foreground">
      <SiteChrome />

      {/* Background: subtle radial + grid (no button gradients) */}
      <BackgroundDecor />

      <main>
        <Hero heroY={heroY} heroOpacity={heroOpacity} />
        <LogosRow />
        <Steps />
        <LivePreview />
        <FeatureGrid />
        <UseCases />
        <FAQ />
        <CTA />
      </main>

      <Footer />
    </div>
  )
}

export function SiteChrome() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsCollapsed(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      animate={{
        height: isCollapsed ? 56 : 64,
        backgroundColor: "rgba(var(--background), 0.7)",
        backdropFilter: "blur(10px)",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="sticky top-0 z-40 border-b border-border/40 supports-[backdrop-filter]:bg-background/70"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Left side: logo + text */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            animate={{ width: isCollapsed ? 24 : 32, height: isCollapsed ? 24 : 32 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <Image
              src="/logo.png"
              alt="Ghost Wallets logo"
              fill
              className="object-contain rounded-md"
            />
          </motion.div>

          <motion.span
            animate={{
              opacity: isCollapsed ? 0 : 1,
              y: isCollapsed ? 4 : 0,
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Ghost Wallets
          </motion.span>
        </Link>

        {/* Center nav (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="#how" className="text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#preview" className="text-muted-foreground hover:text-foreground transition-colors">
            Preview
          </Link>
          <Link href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
        </nav>

        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="#docs"
            className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:bg-muted/20 transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-3 py-2 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Open app <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </motion.header>
  )
}

function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/* radial glow */}
      <div className="absolute inset-0 [mask-image:radial-gradient(60%_50%_at_50%_20%,black,transparent)]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[1200px] rounded-full opacity-[0.35] blur-3xl"
           style={{background: "radial-gradient(closest-side, rgba(139,92,246,0.35), transparent 70%)"}} />

      {/* faint grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
    </div>
  )
}

function Hero({ heroY, heroOpacity }: { heroY: any; heroOpacity: any }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 md:pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight"
            >
              Send stablecoins to any email.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
              className="mt-4 text-base text-muted-foreground max-w-prose"
            >
              Clean handoff. Instant confirmations. No wallets to set up. USDC and PYUSD supported out of the box.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="mt-6 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity"
              >
                Open app <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#preview"
                className="inline-flex items-center gap-2 rounded-md border border-border/60 px-4 py-2.5 text-sm hover:bg-muted/20 transition-colors"
              >
                Live preview
              </Link>
            </motion.div>

            <motion.ul
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-20%" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              className="mt-10 grid grid-cols-2 gap-4 text-sm"
            >
              {[
                { icon: Mail, text: "Email-based claims" },
                { icon: ShieldCheck, text: "Audited flows" },
                { icon: Zap, text: "Fast on Stellar" },
                { icon: Clock, text: "Instant confirmations" },
              ].map((f, i) => (
                <motion.li
                  key={i}
                  variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 240, damping: 20 } } }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <f.icon className="size-4 text-primary" />
                  <span>{f.text}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Parallax panel */}
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative">
            <HeroCard />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function HeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative rounded-2xl border border-border/30 bg-card/70 shadow-xl"
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Available balance</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">$7,572.54</p>
          </div>
          <div className="rounded-md px-2.5 py-1 text-xs border border-border/40 text-muted-foreground">USDC • PYUSD</div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground text-background h-10 px-3 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity">
            <Send className="size-4" /> Send
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 h-10 px-3 text-sm hover:bg-muted/20 transition-colors">
            <Mail className="size-4" /> Request
          </button>
        </div>

        <div className="mt-6 rounded-lg border border-border/30 overflow-hidden">
          <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border/30">Recent activity</div>
          <ul className="divide-y divide-border/30 text-sm">
            {[
              { who: "alex@upbank.io", what: "Sent", amt: "-$120.00", tag: "USDC" },
              { who: "maya@studio.dev", what: "Received", amt: "+$245.50", tag: "PYUSD" },
              { who: "sam@orbit.com", what: "Sent", amt: "-$38.90", tag: "USDC" },
            ].map((t, i) => (
              <motion.li key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.who}</p>
                  <p className="text-xs text-muted-foreground">{t.what} • {t.tag}</p>
                </div>
                <span className={`text-sm ${t.amt.startsWith("-") ? "text-rose-400" : "text-emerald-400"}`}>{t.amt}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

function LogosRow() {
  const logos = [
    { src: "/stellar.png", alt: "Stellar" },
    { src: "/soroban.png", alt: "Soroban" },
    { src: "/next.png", alt: "Next.js" },
    { src: "/framer.svg", alt: "Framer Motion" },
  ]

  return (
    <section aria-label="Trusted by" className="py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground/80">
          Built with modern rails
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-6 opacity-80">
          {logos.map((logo) => (
            <div
              key={logo.alt}
              className="flex items-center justify-center rounded-lg border border-border/30 bg-card/60 p-4"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={90}
                height={40}
                className="object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


function Steps() {
  const cards = [
    {
      title: "Enter email",
      desc: "Type the recipient and amount.",
      icon: Mail,
      cta: "Try it out →",
      overlay: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))",
    },
    {
      title: "Send on Stellar",
      desc: "We move funds on-chain.",
      icon: Send,
      cta: "See the network →",
      overlay: "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(99,102,241,0.12))",
    },
    {
      title: "Claim in 1 tap",
      desc: "Recipient opens the link.",
      icon: CheckCircle2,
      cta: "Claim flow →",
      overlay: "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.12))",
    },
  ]

  return (
    <section id="how" className="py-14 md:py-20 border-t border-border/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Here’s how it works
        </h2>
        <p className="mt-3 text-muted-foreground max-w-prose">
          Three quick steps. No wallet setup.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ type: "spring", stiffness: 240, damping: 22, delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-[20px] border border-border/30 bg-card/70 p-5 transition-shadow duration-500 hover:shadow-[0_24px_48px_rgba(65,98,153,0.15)]"
            >
              {/* soft gradient overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: card.overlay }}
              />

              {/* content */}
              <div className="relative flex items-center gap-3">
                <div className="size-9 grid place-items-center rounded-md border border-primary/30 bg-primary/15">
                  <card.icon className="size-4 text-primary" />
                </div>
                <div className="font-medium text-sm">{card.title}</div>
              </div>

              <p className="relative mt-3 text-sm text-muted-foreground">
                {card.desc}
              </p>

              <motion.div
                initial={false}
                className="relative mt-5 text-sm font-medium text-primary"
              >
                <motion.span
                  initial={{ y: 6, opacity: 0 }}
                  whileHover={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="inline-flex items-center gap-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                >
                  {card.cta}
                  <ArrowRight className="size-3" />
                </motion.span>
              </motion.div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}


function LivePreview() {
  const [sent, setSent] = useState(false)

  function handleSend(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 900)
  }

  return (
    <section id="preview" className="py-14 md:py-20 border-t border-border/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">A demo you can feel</h3>
            <p className="mt-3 text-muted-foreground max-w-prose">
              The preview simulates real flows: balance changes, email handoff, and claims.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity">Open app <ArrowRight className="size-4" /></Link>
              <Link href="#docs" className="inline-flex items-center gap-2 rounded-md border border-border/60 px-4 py-2.5 text-sm hover:bg-muted/20 transition-colors">Docs</Link>
            </div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-2xl border border-border/30 bg-card/70 p-6 shadow-xl"
            >
              {/* Send form mock with inline success check */}
              <div className="relative rounded-xl border border-border/30 p-5 overflow-hidden">
                <div className="grid gap-3 text-sm">
                  <label className="grid gap-1">
                    <span className="text-muted-foreground">To</span>
                    <input placeholder="alex@domain.com" className="h-10 rounded-md bg-background border border-border/40 px-3 outline-none focus:border-primary/60 transition-colors" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-muted-foreground">Amount (USDC)</span>
                    <input placeholder="120.00" className="h-10 rounded-md bg-background border border-border/40 px-3 outline-none focus:border-primary/60 transition-colors" />
                  </label>
                  <button onClick={handleSend} className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-foreground text-background h-10 px-4 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity">
                    <Send className="size-4" /> Send payment
                  </button>
                </div>

                {sent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 240, damping: 18 }}
                    className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-background grid place-items-center text-3xl">✓</div>
                  </motion.div>
                )}
              </div>

              {/* Floating chips */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 grid grid-cols-3 gap-3">
                {["Email → Link", "On-chain settle", "Instant confirm"].map((t, i) => (
                  <motion.div
                    key={t}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.25, delay: 0.35 + i * 0.05 }}
                    className="text-xs rounded-md border border-border/30 px-3 py-2 text-center text-muted-foreground"
                  >
                    {t}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureGrid() {
  return (
    <section id="features" className="py-14 md:py-20 border-t border-border/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Why this hits different</h3>
        <p className="mt-3 text-muted-foreground max-w-prose">Fast, legible, and hard to mess up. Built for real people, not just crypto natives.</p>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            { title: "Zero-setup claims", desc: "Recipients just click a link. No seed phrases.", icon: CheckCircle2 },
            { title: "Realistic sandbox", desc: "Feel the flow without risk.", icon: ShieldCheck },
            { title: "Buttery motion", desc: "Spring physics dialed for smoothness.", icon: Zap },
            { title: "Email-first UX", desc: "Speak human, not hex.", icon: Mail },
            { title: "Instant feedback", desc: "Visual confirmations after every action.", icon: Clock },
            { title: "On Stellar", desc: "Fast, cheap, and battle-tested.", icon: Send },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              className="group relative overflow-hidden rounded-2xl border border-border/30 bg-card/70 p-5 transition-all hover:shadow-[0_26px_60px_rgba(65,98,153,0.14)]"
            >
              <div className="relative flex items-center gap-3">
                <div className="size-9 rounded-md grid place-items-center bg-primary/15 border border-primary/30">
                  <f.icon className="size-4 text-primary" />
                </div>
                <div className="font-medium">{f.title}</div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-16 md:py-24 border-y border-border/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-border/30 bg-card/70 p-8 md:p-10 text-center">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Ready to send your first email transfer?</h3>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Open the app, type an email, and ship a few test dollars. You’ll see why this UI sticks.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity">Open app <ArrowRight className="size-4" /></Link>
            <Link href="#docs" className="inline-flex items-center gap-2 rounded-md border border-border/60 px-4 py-2.5 text-sm hover:bg-muted/20 transition-colors">Docs</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function UseCases() {
  const items = [
    {
      title: "Payouts",
      desc: "Send stipends, refunds, or creator payouts to an email—no wallet setup.",
    },
    {
      title: "Peer transfers",
      desc: "Move funds between teammates with instant confirmations.",
    },
    {
      title: "Customer refunds",
      desc: "Issue crypto refunds that land fast and are easy to claim.",
    },
  ]

  return (
    <section className="py-14 md:py-20 border-t border-border/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Use cases</h3>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {items.map((i, idx) => (
            <motion.div
              key={i.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
              className="group relative overflow-hidden rounded-2xl border border-border/30 bg-card/70 p-5 transition-all hover:shadow-[0_26px_60px_rgba(65,98,153,0.14)]"
            >
              <div className="text-sm font-medium">{i.title}</div>
              <p className="mt-3 text-sm text-muted-foreground">{i.desc}</p>
              <div className="mt-4 text-sm text-primary font-medium">
                <span className="inline-flex items-center gap-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  Try it out <ArrowRight className="size-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const faqs = [
    {
      q: "Do recipients need a wallet?",
      a: "No. They click the email link, review the transfer, and claim. A wallet can be added later if they want.",
    },
    {
      q: "Which assets are supported?",
      a: "USDC and PYUSD to start. More assets can be added based on demand.",
    },
    {
      q: "Can I try it safely?",
      a: "Yes. The demo uses a sandbox so you can experience the flow without risk.",
    },
  ]

  return (
    <section className="py-14 md:py-20 border-t border-border/30">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">FAQ</h3>
        <div className="mt-6 divide-y divide-border/30 rounded-2xl border border-border/30 bg-card/70">
          {faqs.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="px-5 py-4"
            >
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                  {f.q}
                  <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-90">→</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-sm text-muted-foreground">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Ghost Wallets</p>
          <div className="flex items-center gap-5">
            <Link href="#docs" className="hover:text-primary transition-colors">Docs</Link>
            <Link href="#status" className="hover:text-primary transition-colors">Status</Link>
            <Link href="#compliance" className="hover:text-primary transition-colors">Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
