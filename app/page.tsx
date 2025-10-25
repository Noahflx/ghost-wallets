"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Code2,
  Cpu,
  Globe2,
  Headphones,
  PhoneCall,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

/**
 * Bolna — Stripe‑grade Landing Page (Next.js + Tailwind + Framer Motion)
 * ----------------------------------------------------------------------
 * This version focuses on Stripe's core patterns:
 *  - Light theme with strong typography and generous whitespace
 *  - Cinematic gradient hero + product demo card
 *  - Tight information architecture, one idea per section
 *  - Subtle, intentional motion (no gimmicks)
 *
 * Usage:
 *  1) Ensure Tailwind + Inter font. Install framer‑motion: `npm i framer-motion`
 *  2) Drop this file as a page or component and render <BolnaLanding />
 *  3) Swap placeholder assets (logos, audio, case studies) with real ones
 */

// -----------------------------
// Shared UI
// -----------------------------

type SvgLogoProps = React.SVGProps<SVGSVGElement> & { className?: string };

type TextOptions = {
  x?: number;
  y?: number;
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: string;
  textAnchor?: "start" | "middle" | "end";
  fontFamily?: string;
  opacity?: number;
};

type WordmarkOptions = {
  label: string;
  ariaLabel?: string;
  background?: string | ((id: string) => string);
  borderColor?: string | ((id: string) => string);
  borderWidth?: number;
  textColor?: string;
  labelOptions?: TextOptions;
  tagline?: { text: string; color: string; options?: TextOptions };
  defs?: (id: string) => React.ReactNode;
  backgroundExtras?: (id: string) => React.ReactNode;
  foregroundExtras?: (id: string) => React.ReactNode;
};

type LogoComponent = (props: SvgLogoProps) => JSX.Element;

function resolveOption(
  value: WordmarkOptions["background" | "borderColor"],
  id: string,
): string | undefined {
  if (!value) return undefined;
  return typeof value === "function" ? value(id) : value;
}

function createWordmarkLogo(options: WordmarkOptions): LogoComponent {
  return function Logo({ className, ...props }: SvgLogoProps) {
    const rawId = useId();
    const baseId = rawId.replace(/:/g, "");
    const backgroundFill = resolveOption(options.background, baseId) ?? "#ffffff";
    const borderColor = resolveOption(options.borderColor, baseId);
    const borderWidth = borderColor ? options.borderWidth ?? 1.5 : 0;

    const labelOptions = options.labelOptions ?? {};
    const labelAnchor = labelOptions.textAnchor ?? "middle";
    const labelX = labelOptions.x ?? (labelAnchor === "start" ? 28 : labelAnchor === "end" ? 132 : 80);
    const labelY = labelOptions.y ?? 34;
    const labelFontFamily = labelOptions.fontFamily ?? "'Inter', 'Segoe UI', system-ui, sans-serif";

    const taglineOptions = options.tagline?.options ?? {};
    const taglineAnchor = taglineOptions.textAnchor ?? labelAnchor;
    const taglineX = taglineOptions.x ??
      (taglineAnchor === "start" ? labelX : taglineAnchor === "end" ? labelX : 80);
    const taglineY = taglineOptions.y ?? 48;
    const taglineFontFamily = taglineOptions.fontFamily ?? labelFontFamily;

    return (
      <svg
        viewBox="0 0 160 60"
        role="img"
        aria-label={options.ariaLabel ?? `${options.label} logo`}
        className={className}
        {...props}
      >
        {options.defs ? <defs>{options.defs(baseId)}</defs> : null}
        <rect
          width="160"
          height="60"
          rx="14"
          fill={backgroundFill}
          stroke={borderColor}
          strokeWidth={borderWidth}
        />
        {options.backgroundExtras ? options.backgroundExtras(baseId) : null}
        <text
          x={labelX}
          y={labelY}
          fill={options.textColor ?? "#0f172a"}
          fontSize={labelOptions.fontSize ?? 22}
          fontWeight={labelOptions.fontWeight ?? 600}
          letterSpacing={labelOptions.letterSpacing ?? "0.05em"}
          textAnchor={labelAnchor}
          fontFamily={labelFontFamily}
          opacity={labelOptions.opacity ?? 1}
        >
          {options.label}
        </text>
        {options.tagline ? (
          <text
            x={taglineX}
            y={taglineY}
            fill={options.tagline.color}
            fontSize={taglineOptions.fontSize ?? 10}
            fontWeight={taglineOptions.fontWeight ?? 600}
            letterSpacing={taglineOptions.letterSpacing ?? "0.28em"}
            textAnchor={taglineAnchor}
            fontFamily={taglineFontFamily}
            opacity={taglineOptions.opacity ?? 0.85}
          >
            {options.tagline.text}
          </text>
        ) : null}
        {options.foregroundExtras ? options.foregroundExtras(baseId) : null}
      </svg>
    );
  };
}

const LOGO_LIBRARY = {
  Bolna: createWordmarkLogo({
    label: "bolna",
    background: (id) => `url(#${id}-bg)` ,
    textColor: "#f8fafc",
    labelOptions: {
      x: 54,
      y: 34,
      textAnchor: "start",
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: "0.08em",
    },
    tagline: {
      text: "VOICE AI",
      color: "#fbbf24",
      options: {
        x: 54,
        y: 48,
        textAnchor: "start",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.42em",
      },
    },
    defs: (id) => (
      <>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="55%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id={`${id}-orb`} cx="0.42" cy="0.36" r="0.6">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
      </>
    ),
    backgroundExtras: (id) => (
      <>
        <circle cx="36" cy="30" r="18" fill={`url(#${id}-orb)`} />
        <circle cx="36" cy="30" r="11" fill="#1d4ed8" opacity="0.45" />
        <text
          x="36"
          y="34"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="#f8fafc"
          fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
        >
          BN
        </text>
      </>
    ),
  }),
  "Physics Wallah": createWordmarkLogo({
    label: "Physics Wallah",
    background: "#0f172a",
    textColor: "#e2e8f0",
    labelOptions: {
      x: 68,
      y: 32,
      textAnchor: "start",
      fontSize: 17,
      fontWeight: 600,
      letterSpacing: "0.16em",
    },
    tagline: {
      text: "LEARNERS",
      color: "#94a3b8",
      options: {
        x: 68,
        y: 46,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.42em",
      },
    },
    backgroundExtras: () => (
      <>
        <circle cx="40" cy="30" r="18" fill="#1d4ed8" opacity="0.25" />
        <circle cx="40" cy="30" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.5" />
        <text
          x="40"
          y="34"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#e0f2fe"
          fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
        >
          PW
        </text>
      </>
    ),
  }),
  Paytm: createWordmarkLogo({
    label: "paytm",
    background: "#ecfeff",
    textColor: "#0f172a",
    labelOptions: {
      x: 28,
      y: 34,
      textAnchor: "start",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.04em",
    },
    tagline: {
      text: "PAYMENTS",
      color: "#0ea5e9",
      options: {
        x: 28,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.44em",
      },
    },
    backgroundExtras: () => (
      <>
        <path d="M122 16h24v28c0 8-6 14-14 14h-10Z" fill="#0ea5e9" opacity="0.18" />
        <circle cx="122" cy="24" r="9" fill="#22d3ee" opacity="0.24" />
      </>
    ),
  }),
  GoKwik: createWordmarkLogo({
    label: "GoKwik",
    background: "#f8fafc",
    textColor: "#0f172a",
    labelOptions: {
      x: 28,
      y: 34,
      textAnchor: "start",
      fontSize: 23,
      fontWeight: 700,
      letterSpacing: "0.08em",
    },
    tagline: {
      text: "CHECKOUTS",
      color: "#10b981",
      options: {
        x: 28,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.36em",
      },
    },
    backgroundExtras: () => (
      <>
        <path d="M120 18h22l-12 20h12l-22 12Z" fill="#34d399" opacity="0.22" />
        <path d="M114 20h10l-8 14h10l-16 12" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </>
    ),
  }),
  Futwork: createWordmarkLogo({
    label: "Futwork",
    background: "#fef2f2",
    textColor: "#7f1d1d",
    labelOptions: {
      x: 24,
      y: 34,
      textAnchor: "start",
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.08em",
    },
    tagline: {
      text: "HIRING",
      color: "#dc2626",
      options: {
        x: 24,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.4em",
      },
    },
    backgroundExtras: () => (
      <>
        <path d="M110 12h32l-10 18 10 18h-32Z" fill="#f87171" opacity="0.2" />
        <circle cx="118" cy="30" r="7" fill="#ef4444" opacity="0.28" />
      </>
    ),
  }),
  Hyreo: createWordmarkLogo({
    label: "Hyreo",
    background: "#ecfdf5",
    textColor: "#065f46",
    labelOptions: {
      x: 28,
      y: 34,
      textAnchor: "start",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.08em",
    },
    tagline: {
      text: "TALENT TECH",
      color: "#10b981",
      options: {
        x: 28,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.32em",
      },
    },
    backgroundExtras: () => (
      <>
        <rect x="114" y="16" width="28" height="28" rx="10" fill="#10b981" opacity="0.18" />
        <path d="M120 30h16" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
        <path d="M128 22v16" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
      </>
    ),
  }),
  Awign: createWordmarkLogo({
    label: "Awign",
    background: "#fff7ed",
    textColor: "#92400e",
    labelOptions: {
      x: 26,
      y: 34,
      textAnchor: "start",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.12em",
    },
    tagline: {
      text: "OPERATIONS",
      color: "#ea580c",
      options: {
        x: 26,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.36em",
      },
    },
    backgroundExtras: () => (
      <>
        <path d="M118 18h26l-8 12 8 12h-26l8-12Z" fill="#fb923c" opacity="0.24" />
        <circle cx="118" cy="30" r="8" fill="#f97316" opacity="0.26" />
      </>
    ),
  }),
  Spinny: createWordmarkLogo({
    label: "Spinny",
    background: "#fee2e2",
    textColor: "#7f1d1d",
    labelOptions: {
      x: 28,
      y: 34,
      textAnchor: "start",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.1em",
    },
    tagline: {
      text: "AUTOS",
      color: "#b91c1c",
      options: {
        x: 28,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.5em",
      },
    },
    backgroundExtras: () => (
      <>
        <circle cx="120" cy="30" r="16" fill="#ef4444" opacity="0.22" />
        <circle cx="120" cy="30" r="8" fill="#dc2626" opacity="0.4" />
        <path d="M116 30h8" stroke="#fee2e2" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      </>
    ),
  }),
  Stage: createWordmarkLogo({
    label: "Stage",
    background: "#f5f3ff",
    textColor: "#4c1d95",
    labelOptions: {
      x: 32,
      y: 34,
      textAnchor: "start",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.1em",
    },
    tagline: {
      text: "FAN TECH",
      color: "#7c3aed",
      options: {
        x: 32,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.34em",
      },
    },
    backgroundExtras: () => (
      <>
        <rect x="116" y="18" width="26" height="26" rx="6" fill="#c4b5fd" opacity="0.25" />
        <path d="M120 38l8-12 8 12" stroke="#7c3aed" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </>
    ),
  }),
  OpenAI: createWordmarkLogo({
    label: "OpenAI",
    background: "#0f172a",
    textColor: "#e2e8f0",
    labelOptions: {
      x: 28,
      y: 34,
      textAnchor: "start",
      fontSize: 23,
      fontWeight: 700,
      letterSpacing: "0.16em",
    },
    tagline: {
      text: "AI PLATFORM",
      color: "#38bdf8",
      options: {
        x: 28,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.36em",
      },
    },
    backgroundExtras: () => (
      <>
        <circle cx="122" cy="30" r="18" fill="#1d4ed8" opacity="0.2" />
        <path
          d="M122 16c7 0 12 5 12 12s-5 12-12 12-12-5-12-12 5-12 12-12Z"
          stroke="#38bdf8"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M122 18c5.5 0 10 4.5 10 10 0 2.5-1 4.8-2.6 6.6"
          stroke="#a5b4fc"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </>
    ),
  }),
  Deepgram: createWordmarkLogo({
    label: "Deepgram",
    background: "#111827",
    textColor: "#e2e8f0",
    labelOptions: {
      x: 24,
      y: 34,
      textAnchor: "start",
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.14em",
    },
    tagline: {
      text: "SPEECH",
      color: "#38bdf8",
      options: {
        x: 24,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.44em",
      },
    },
    backgroundExtras: () => (
      <>
        <rect x="112" y="16" width="30" height="28" rx="10" fill="#38bdf8" opacity="0.2" />
        <polyline
          points="116,34 120,26 124,32 128,22 132,30 136,24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </>
    ),
  }),
  Cartesia: createWordmarkLogo({
    label: "Cartesia",
    background: "#eef2ff",
    textColor: "#312e81",
    labelOptions: {
      x: 26,
      y: 34,
      textAnchor: "start",
      fontSize: 23,
      fontWeight: 700,
      letterSpacing: "0.12em",
    },
    tagline: {
      text: "VOICE",
      color: "#6366f1",
      options: {
        x: 26,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.52em",
      },
    },
    backgroundExtras: () => (
      <>
        <path d="M118 18l24 12-24 12-24-12Z" fill="#c7d2fe" opacity="0.3" />
        <path d="M118 20l18 10-18 10-18-10Z" stroke="#818cf8" strokeWidth="1.8" strokeLinejoin="round" opacity="0.6" />
      </>
    ),
  }),
  ElevenLabs: createWordmarkLogo({
    label: "ElevenLabs",
    background: "#fef3c7",
    textColor: "#92400e",
    labelOptions: {
      x: 22,
      y: 34,
      textAnchor: "start",
      fontSize: 21,
      fontWeight: 700,
      letterSpacing: "0.14em",
    },
    tagline: {
      text: "AUDIO",
      color: "#f97316",
      options: {
        x: 22,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.5em",
      },
    },
    backgroundExtras: () => (
      <>
        <rect x="110" y="18" width="32" height="24" rx="8" fill="#f97316" opacity="0.22" />
        <path
          d="M118 30h4l2-6 2 12 2-6h4"
          stroke="#f97316"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </>
    ),
  }),
  Twilio: createWordmarkLogo({
    label: "Twilio",
    background: "#fee2e2",
    textColor: "#b91c1c",
    labelOptions: {
      x: 30,
      y: 34,
      textAnchor: "start",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.12em",
    },
    tagline: {
      text: "COMMS",
      color: "#ef4444",
      options: {
        x: 30,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.54em",
      },
    },
    backgroundExtras: () => (
      <>
        <circle cx="120" cy="30" r="16" fill="#ef4444" opacity="0.22" />
        <circle cx="116" cy="26" r="3" fill="#fee2e2" />
        <circle cx="124" cy="26" r="3" fill="#fee2e2" />
        <circle cx="116" cy="34" r="3" fill="#fee2e2" />
        <circle cx="124" cy="34" r="3" fill="#fee2e2" />
      </>
    ),
  }),
  Plivo: createWordmarkLogo({
    label: "Plivo",
    background: "#ecfdf5",
    textColor: "#047857",
    labelOptions: {
      x: 32,
      y: 34,
      textAnchor: "start",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.1em",
    },
    tagline: {
      text: "TELEPHONY",
      color: "#10b981",
      options: {
        x: 32,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.32em",
      },
    },
    backgroundExtras: () => (
      <>
        <rect x="114" y="18" width="28" height="24" rx="8" fill="#10b981" opacity="0.22" />
        <path d="M118 32h12" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
        <path d="M124 26v12" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
      </>
    ),
  }),
  Zapier: createWordmarkLogo({
    label: "Zapier",
    background: "#fff7ed",
    textColor: "#b45309",
    labelOptions: {
      x: 26,
      y: 34,
      textAnchor: "start",
      fontSize: 23,
      fontWeight: 700,
      letterSpacing: "0.14em",
    },
    tagline: {
      text: "AUTOMATE",
      color: "#f97316",
      options: {
        x: 26,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.4em",
      },
    },
    backgroundExtras: () => (
      <>
        <path d="M118 18l8 8 8-8 8 8-8 8 8 8-8 8-8-8-8 8-8-8 8-8-8-8Z" fill="#fb923c" opacity="0.2" />
        <circle cx="126" cy="30" r="6" fill="#f97316" opacity="0.4" />
      </>
    ),
  }),
  "Make.com": createWordmarkLogo({
    label: "Make.com",
    background: "#f5f3ff",
    textColor: "#4c1d95",
    labelOptions: {
      x: 24,
      y: 34,
      textAnchor: "start",
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.12em",
    },
    tagline: {
      text: "FLOWS",
      color: "#7c3aed",
      options: {
        x: 24,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.5em",
      },
    },
    backgroundExtras: () => (
      <>
        <rect x="112" y="18" width="30" height="26" rx="10" fill="#c4b5fd" opacity="0.26" />
        <path
          d="M118 24h10l6 6-6 6h-10l-6-6Z"
          stroke="#7c3aed"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.6"
        />
      </>
    ),
  }),
  Azure: createWordmarkLogo({
    label: "Azure",
    background: "#eff6ff",
    textColor: "#1d4ed8",
    labelOptions: {
      x: 36,
      y: 34,
      textAnchor: "start",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.14em",
    },
    tagline: {
      text: "CLOUD",
      color: "#2563eb",
      options: {
        x: 36,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.48em",
      },
    },
    backgroundExtras: () => (
      <>
        <path d="M112 32l12-16 12 16h-8l8 12h-32l8-12Z" fill="#93c5fd" opacity="0.32" />
        <path d="M128 24l8 12h-16l8-12Z" fill="#60a5fa" opacity="0.4" />
      </>
    ),
  }),
  Deepseek: createWordmarkLogo({
    label: "Deepseek",
    background: "#f8fafc",
    textColor: "#0f172a",
    labelOptions: {
      x: 24,
      y: 34,
      textAnchor: "start",
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.14em",
    },
    tagline: {
      text: "GEN AI",
      color: "#2563eb",
      options: {
        x: 24,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.52em",
      },
    },
    backgroundExtras: () => (
      <>
        <circle cx="122" cy="30" r="18" fill="#bfdbfe" opacity="0.28" />
        <path d="M112 24l10 6-10 6m10-12 10 6-10 6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </>
    ),
  }),
  "Cal.com": createWordmarkLogo({
    label: "Cal.com",
    background: "#0f172a",
    textColor: "#f8fafc",
    labelOptions: {
      x: 26,
      y: 34,
      textAnchor: "start",
      fontSize: 23,
      fontWeight: 700,
      letterSpacing: "0.16em",
    },
    tagline: {
      text: "SCHEDULING",
      color: "#38bdf8",
      options: {
        x: 26,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.32em",
      },
    },
    backgroundExtras: () => (
      <>
        <rect x="110" y="18" width="32" height="24" rx="6" fill="#1e293b" opacity="0.6" />
        <path d="M118 26h16M118 32h10" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <circle cx="134" cy="32" r="3" fill="#38bdf8" opacity="0.9" />
      </>
    ),
  }),
  viaSocket: createWordmarkLogo({
    label: "viaSocket",
    background: "#fdf4ff",
    textColor: "#86198f",
    labelOptions: {
      x: 24,
      y: 34,
      textAnchor: "start",
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.12em",
    },
    tagline: {
      text: "WORKFLOWS",
      color: "#c026d3",
      options: {
        x: 24,
        y: 48,
        textAnchor: "start",
        fontSize: 10,
        letterSpacing: "0.34em",
      },
    },
    backgroundExtras: () => (
      <>
        <rect x="114" y="18" width="28" height="28" rx="12" fill="#c026d3" opacity="0.18" />
        <path
          d="M120 28h16v8h-16Zm0 0v-6h8"
          stroke="#c026d3"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </>
    ),
  }),
} as const;

type LogoName = keyof typeof LOGO_LIBRARY;

function Container({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

function CTA({ children, onClick, variant = "primary", className = "" }: React.PropsWithChildren<{ onClick?: () => void; variant?: "primary" | "ghost"; className?: string }>) {
  const base =
    "group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#416299]/70";
  if (variant === "ghost")
    return (
      <button
        onClick={onClick}
        className={`${base} border border-slate-200/70 bg-white/80 text-slate-700 shadow-[0_10px_24px_rgba(148,163,184,0.18)] hover:border-[#416299]/60 hover:text-slate-900 hover:shadow-[0_12px_28px_rgba(65,98,153,0.24)] ${className}`}
      >
        <span className="relative z-[1]">{children}</span>
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/40 via-transparent to-[#416299]/20 opacity-0 transition group-hover:opacity-100" />
      </button>
    );
  return (
    <button
      onClick={onClick}
      className={`${base} border border-slate-200 bg-white text-slate-900 shadow-[0_16px_36px_rgba(65,98,153,0.28)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(65,98,153,0.34)] ${className}`}
    >
      <span className="relative z-[1]">{children}</span>
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/40 via-transparent to-[#416299]/22 opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

function Eyebrow({ children }: React.PropsWithChildren) {
  return <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#416299]">{children}</div>;
}

function H2({ children }: React.PropsWithChildren) {
  return (
    <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
      {children}
    </h2>
  );
}

function Sub({ children }: React.PropsWithChildren) {
  return <p className="mt-3 max-w-2xl text-pretty text-base text-slate-600">{children}</p>;
}

function Fade({ children, className = "", delay = 0 }: React.PropsWithChildren<{ className?: string; delay?: number }>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 10 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Simple micro‑waveform for the hero demo
function Wave({ speaking }: { speaking: boolean }) {
  return (
    <div className="flex h-16 items-end gap-1">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: purely visual
          key={i}
          style={{ animationDelay: `${(i % 7) * 80}ms` }}
          className={`h-10 w-[5px] rounded-full bg-gradient-to-b from-[#416299] to-[#2b4873] ${speaking ? "animate-[wave_1.1s_ease-in-out_infinite]" : "opacity-40"}`}
        />
      ))}
    </div>
  );
}

const HERO_LOGOS: Array<{
  name: LogoName;
  className?: string;
}> = [
  { name: "Physics Wallah" },
  { name: "Paytm" },
  { name: "GoKwik" },
  { name: "Futwork" },
  { name: "Hyreo" },
  { name: "Awign" },
  { name: "Spinny" },
  { name: "Stage" },
];

type RegionId = "north" | "central" | "west" | "east" | "south" | "northeast" | "islands";

const REGION_LABELS: Record<RegionId, string> = {
  north: "North & NCR",
  central: "Central belt",
  west: "Western corridor",
  east: "Eastern stretch",
  south: "Southern peninsula",
  northeast: "North-East arc",
  islands: "Island clusters",
};

type LanguageMode = {
  label: string;
  description: string;
  accent: { base: string; glow: string };
  distribution: Partial<Record<RegionId, number>>;
};

const LANGUAGE_MODES: LanguageMode[] = [
  {
    label: "Hindi",
    description: "North and central coverage for national support lines.",
    accent: { base: "#416299", glow: "rgba(65,98,153,0.65)" },
    distribution: { north: 0.32, central: 0.28, west: 0.16, east: 0.12, south: 0.07, northeast: 0.04, islands: 0.01 },
  },
  {
    label: "Hinglish",
    description: "Metro-heavy hybrid tone for D2C and fintech brands.",
    accent: { base: "#416299", glow: "rgba(65,98,153,0.7)" },
    distribution: { north: 0.26, central: 0.24, west: 0.2, east: 0.12, south: 0.12, northeast: 0.05, islands: 0.01 },
  },
  {
    label: "English",
    description: "Pan-India fallback with crisp call-centre diction.",
    accent: { base: "#0ea5e9", glow: "rgba(125,211,252,0.7)" },
    distribution: { north: 0.18, central: 0.18, west: 0.22, east: 0.16, south: 0.2, northeast: 0.05, islands: 0.01 },
  },
  {
    label: "Tamil",
    description: "Deep Tamil fluency across the southern peninsula.",
    accent: { base: "#32527e", glow: "rgba(65,98,153,0.7)" },
    distribution: { south: 0.6, central: 0.12, west: 0.08, east: 0.1, north: 0.06, northeast: 0.03, islands: 0.01 },
  },
  {
    label: "Telugu",
    description: "Coastal Andhra and Telangana coverage with ease.",
    accent: { base: "#3a6ea5", glow: "rgba(65,98,153,0.6)" },
    distribution: { south: 0.44, east: 0.26, central: 0.14, north: 0.06, west: 0.06, northeast: 0.03, islands: 0.01 },
  },
  {
    label: "Kannada",
    description: "Silicon Plateau nuance for tech support and ops.",
    accent: { base: "#355b8f", glow: "rgba(65,98,153,0.6)" },
    distribution: { south: 0.52, west: 0.16, central: 0.16, east: 0.08, north: 0.04, northeast: 0.03, islands: 0.01 },
  },
  {
    label: "Marathi",
    description: "Western corridor reach with Mumbai and Pune dialects.",
    accent: { base: "#f97316", glow: "rgba(253,186,116,0.65)" },
    distribution: { west: 0.46, central: 0.2, south: 0.12, north: 0.1, east: 0.08, northeast: 0.03, islands: 0.01 },
  },
  {
    label: "Gujarati",
    description: "Western trade hubs with soft-conversational tone.",
    accent: { base: "#fb7185", glow: "rgba(252,165,165,0.7)" },
    distribution: { west: 0.52, north: 0.14, central: 0.16, south: 0.1, east: 0.05, northeast: 0.02, islands: 0.01 },
  },
  {
    label: "Bengali",
    description: "Eastern stretch with Kolkata and Dhaka flavours.",
    accent: { base: "#ec4899", glow: "rgba(244,114,182,0.65)" },
    distribution: { east: 0.58, south: 0.14, central: 0.12, north: 0.08, northeast: 0.06, west: 0.01, islands: 0.01 },
  },
  {
    label: "Punjabi",
    description: "North-western warmth for commerce and support.",
    accent: { base: "#f59e0b", glow: "rgba(253,224,71,0.7)" },
    distribution: { north: 0.5, west: 0.18, central: 0.16, east: 0.08, south: 0.05, northeast: 0.02, islands: 0.01 },
  },
  {
    label: "Malayalam",
    description: "Kerala-native speech with diaspora sensitivity.",
    accent: { base: "#14b8a6", glow: "rgba(110,231,183,0.65)" },
    distribution: { south: 0.66, central: 0.12, west: 0.08, east: 0.06, north: 0.04, northeast: 0.03, islands: 0.01 },
  },
  {
    label: "Odia",
    description: "Eastern seaboard services with mining belt vocabulary.",
    accent: { base: "#06b6d4", glow: "rgba(125,211,252,0.65)" },
    distribution: { east: 0.52, south: 0.16, central: 0.16, north: 0.08, northeast: 0.06, west: 0.01, islands: 0.01 },
  },
];

const WHY_CARDS = [
  {
    title: "Speed that scales",
    description: "Streaming infra engineered for \u003c300ms replies even when millions of people are on the line.",
    icon: Cpu,
    accent: {
      overlay: "linear-gradient(135deg, rgba(65,98,153,0.12), rgba(15,23,42,0.05))",
      iconBg: "rgba(65,98,153,0.16)",
      iconColor: "#284a7a",
      bulletBg: "rgba(65,98,153,0.95)",
      bulletShadow: "0 6px 14px rgba(65,98,153,0.28)",
    },
    bullets: ["~300ms average response", "Millions of concurrent calls", "Enterprise‑grade uptime"],
    cta: "See the real-time network →",
  },
  {
    title: "Languages that connect",
    description: "Agents sound local with tone, accent, and memory tuned for every Indian region.",
    icon: Globe2,
    accent: {
      overlay: "linear-gradient(135deg, rgba(65,98,153,0.1), rgba(30,64,175,0.05))",
      iconBg: "rgba(65,98,153,0.16)",
      iconColor: "#2f5289",
      bulletBg: "rgba(65,98,153,0.9)",
      bulletShadow: "0 6px 14px rgba(65,98,153,0.24)",
    },
    bullets: ["10+ Indian languages", "Tone \u0026 accent awareness", "Context memory"],
    cta: "Hear regional voices →",
  },
  {
    title: "Built for builders",
    description: "APIs, SDKs, and visual tooling live together so ops and devs can ship in a day.",
    icon: Code2,
    accent: {
      overlay: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(65,98,153,0.04))",
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#1e4fa0",
      bulletBg: "rgba(37,99,235,0.85)",
      bulletShadow: "0 6px 14px rgba(37,99,235,0.22)",
    },
    bullets: ["APIs \u0026 SDKs", "No-code flows", "Switch models per call"],
    cta: "Build with the platform →",
  },
];

const LANGUAGE_FACTS = [
  { label: "Dialects handled", value: "28", meta: "Regional & industry" },
  { label: "Avg. latency", value: "<300 ms", meta: "Streaming responses" },
  { label: "Tone detection", value: "Real-time", meta: "Escalate before churn" },
];

const FEATURE_PILLARS = [
  {
    title: "Operate at scale",
    description: "Run high-volume programs with agents that stay sharp under load.",
    icon: PhoneCall,
    accent: {
      surface: "linear-gradient(135deg, rgba(65,98,153,0.12), rgba(15,23,42,0.06))",
      dot: "rgba(65,98,153,0.9)",
      dotShadow: "0 8px 16px rgba(65,98,153,0.26)",
    },
    items: [
      { title: "Bulk Calling at Scale", detail: "Run campaigns with thousands of AI calls simultaneously." },
      { title: "Natural Conversations", detail: "Agents handle interruptions and reply with \u003c300ms latency." },
      { title: "Human-in-the-Loop", detail: "Transfer the call to a real agent instantly when needed." },
      { title: "Enterprise Plans", detail: "Best-in-class pricing with forward deployed support teams." },
    ],
  },
  {
    title: "Automation that adapts",
    description: "Blend APIs and flows so every moment of the call can react in real time.",
    icon: Workflow,
    accent: {
      surface: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(14,165,233,0.06))",
      dot: "rgba(59,130,246,0.85)",
      dotShadow: "0 8px 16px rgba(59,130,246,0.24)",
    },
    items: [
      { title: "Custom API Triggers", detail: "Call external APIs in real-time during a live conversation." },
      { title: "Workflow Integration", detail: "Connect to n8n, Make.com, Zapier, and more without friction." },
      { title: "Model Switching", detail: "Run each call with the model best suited for your use case." },
    ],
  },
  {
    title: "Intelligence & trust",
    description: "Use the right voices, models, and safeguards for every region you serve.",
    icon: ShieldCheck,
    accent: {
      surface: "linear-gradient(135deg, rgba(65,98,153,0.1), rgba(20,184,166,0.08))",
      dot: "rgba(65,98,153,0.85)",
      dotShadow: "0 8px 16px rgba(65,98,153,0.22)",
    },
    items: [
      { title: "Multilingual", detail: "Converse fluently in 10+ Indian and foreign languages." },
      { title: "Connect Any Model", detail: "Use 20+ ASR, LLM, and TTS models inside one orchestration layer." },
      { title: "100% Data Privacy", detail: "India / USA specific data residency with on-prem deployment options." },
    ],
  },
];

const BUILDER_TABS = [
  {
    id: "studio",
    title: "No-code studio",
    subtitle: "Launch campaigns in hours without writing code.",
    accent: "from-[#416299] via-[#6a84b4] to-[#a5bedf]",
    kicker: "Non-tech teams ship in hours",
    steps: [
      { title: "Connect numbers", detail: "Bring Twilio, Plivo, or a Bolna line in one click." },
      { title: "Drag-and-drop flows", detail: "Intent builder, fallback logic, and live QA in the browser." },
      { title: "Go live", detail: "Trigger voice drops, campaigns, and WhatsApp handoffs instantly." },
    ],
    footer: "Teams cut launch time from 6 weeks to 4 days.",
  },
  {
    id: "api",
    title: "Developer APIs",
    subtitle: "Own every detail with SDKs, webhooks, and observability.",
    accent: "from-[#416299] via-[#3b82f6] to-[#34d399]",
    kicker: "Loved by platform teams",
    codeTabs: [
      {
        id: "python",
        label: "Python",
        snippet: `import requests\n\nurl = "https://api.bolna.ai/call"\n\npayload = {\n    "agent_id": "123e4567-e89b-12d3-a456-426655440000",\n    "recipient_phone_number": "+10123456789",\n    "from_phone_number": "+19876543007",\n    "user_data": {\n        "variable1": "value1",\n        "variable2": "value2",\n        "variable3": "some phrase as value"\n    }\n}\n\nheaders = {\n    "Authorization": "Bearer <token>",\n    "Content-Type": "application/json"\n}\n\nresponse = requests.request("POST", url, json=payload, headers=headers)\n\nprint(response.text)`,
      },
      {
        id: "javascript",
        label: "JavaScript",
        snippet: `const options = {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer <token>',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    "agent_id": "123e4567-e89b-12d3-a456-426655440000",\n    "recipient_phone_number": "+10123456789",\n    "from_phone_number": "+19876543007",\n    "user_data": {\n      "variable1": "value1",\n      "variable2": "value2",\n      "variable3": "some phrase as value"\n    }\n  })\n};\n\nfetch('https://api.bolna.ai/call', options)\n  .then(response => response.json())\n  .then(response => console.log(response))\n  .catch(err => console.error(err));`,
      },
      {
        id: "curl",
        label: "cURL",
        snippet: `curl --request POST \\
  --url https://api.bolna.ai/call \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{\n  "agent_id": "123e4567-e89b-12d3-a456-426655440000",\n  "recipient_phone_number": "+10123456789",\n  "from_phone_number": "+19876543007",\n  "user_data": {\n    "variable1": "value1",\n    "variable2": "value2",\n    "variable3": "some phrase as value"\n  }\n}'`,
      },
    ],
    extras: ["Realtime event stream", "Observability hooks", "Granular analytics"],
    footer: "Engineers wire to production in under a sprint.",
  },
];

const CASE_ROTATION_INTERVAL = 6500;

const CASE_STUDIES = [
  {
    company: "GoKwik",
    headline: "Recovered ₹2.5 Cr+ with voice + WhatsApp handoff",
    summary: "Automated recovery agents re-engage shoppers, confirm intent, and switch to human WhatsApp threads when needed.",
    stats: [
      { label: "Recovery uplift", value: "+34%" },
      { label: "Avg. handle time", value: "<90s" },
      { label: "Languages", value: "5" },
    ],
    gradient: "from-amber-200 via-orange-200 to-rose-200",
    cta: "See how GoKwik keeps revenue on track",
    quote: "Bolna brought empathy and urgency back into our recovery flows.",
    speaker: "Growth lead, GoKwik",
  },
  {
    company: "Futwork",
    headline: "10K+ outbound calls daily with human escalation",
    summary: "Nationwide outreach with on-call supervisors — Bolna flags low-confidence calls and bridges to agents instantly.",
    stats: [
      { label: "Daily automations", value: "10K+" },
      { label: "Escalation success", value: "92%" },
      { label: "Regions", value: "12" },
    ],
    gradient: "from-[#d8e4f8] via-[#a9bedf] to-[#f4f8ff]",
    cta: "Watch Futwork scale voice hiring",
    quote: "Our supervisors step in only when it truly matters — the rest runs itself.",
    speaker: "Co-founder, Futwork",
  },
  {
    company: "Hyreo",
    headline: "96% CSAT on 24×7 helpdesk",
    summary: "Career-seeker helpline that remembers history, gives updates, and books callbacks when emotion spikes.",
    stats: [
      { label: "CSAT", value: "96%" },
      { label: "First-call resolution", value: "81%" },
      { label: "Availability", value: "24×7" },
    ],
    gradient: "from-emerald-200 via-teal-200 to-cyan-200",
    cta: "Learn why Hyreo trusts Bolna",
    quote: "Candidates feel heard even at 2 a.m. Bolna never drops context.",
    speaker: "Head of support, Hyreo",
  },
  {
    company: "Stage",
    headline: "Scaled vernacular fan support across India",
    summary: "Regional content platform that needed Hinglish, Kannada, and Marathi support with instant playback requests handled.",
    stats: [
      { label: "Play requests", value: "3.1× faster" },
      { label: "Voice satisfaction", value: "94%" },
      { label: "Dialects", value: "9" },
    ],
    gradient: "from-[#dbe7fb] via-[#c8d7f0] to-[#fde7f3]",
    cta: "See Stage delight every fan",
    quote: "We went live in weeks and every fan hears a familiar voice.",
    speaker: "Community ops, Stage",
  },
];

const PROVIDER_LOGOS: Record<string, { Logo: LogoComponent }> = {
  OpenAI: { Logo: LOGO_LIBRARY.OpenAI },
  Deepgram: { Logo: LOGO_LIBRARY.Deepgram },
  Cartesia: { Logo: LOGO_LIBRARY.Cartesia },
  ElevenLabs: { Logo: LOGO_LIBRARY.ElevenLabs },
  Twilio: { Logo: LOGO_LIBRARY.Twilio },
  Plivo: { Logo: LOGO_LIBRARY.Plivo },
  Zapier: { Logo: LOGO_LIBRARY.Zapier },
  "Make.com": { Logo: LOGO_LIBRARY["Make.com"] },
  Azure: { Logo: LOGO_LIBRARY.Azure },
  Deepseek: { Logo: LOGO_LIBRARY.Deepseek },
  "Cal.com": { Logo: LOGO_LIBRARY["Cal.com"] },
  viaSocket: { Logo: LOGO_LIBRARY.viaSocket },
};

const INTEGRATION_ROWS = [
  ["Twilio", "Plivo", "OpenAI", "Deepseek"],
  ["ElevenLabs", "Cartesia", "Deepgram", "Azure"],
  ["Zapier", "Make.com", "Cal.com", "viaSocket"],
];

const INTEGRATION_HIGHLIGHTS = [
  {
    title: "Model freedom",
    detail: "Switch between OpenAI, Deepseek, Cartesia, or Azure models per intent — no redeploy needed.",
    icon: Sparkles,
  },
  {
    title: "Telephony native",
    detail: "Twilio and Plivo numbers plug in alongside your SIP trunks with failover built in.",
    icon: PlugZap,
  },
  {
    title: "Workflow ready",
    detail: "Zapier, Make.com, Cal.com, and viaSocket keep every conversation synced to your ops stack.",
    icon: Code2,
  },
];

const INTEGRATION_PROVIDERS = Array.from(new Set(INTEGRATION_ROWS.flat()));

// -----------------------------
// Page
// -----------------------------

export default function BolnaLanding() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [activeBuilder, setActiveBuilder] = useState<typeof BUILDER_TABS[number]["id"]>("studio");
  const [codeTab, setCodeTab] = useState("python");
  const [caseIndex, setCaseIndex] = useState(0);
  const [languageFocus, setLanguageFocus] = useState(0);
  const [providerFocus, setProviderFocus] = useState(0);

  const play = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => void 0);
  };

  const activeBuilderTab = useMemo(
    () => BUILDER_TABS.find((tab) => tab.id === activeBuilder) ?? BUILDER_TABS[0],
    [activeBuilder],
  );


  useEffect(() => {
    const el = audioRef.current; if (!el) return;
    const onPlay = () => setSpeaking(true);
    const off = () => setSpeaking(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", off);
    el.addEventListener("ended", off);
    return () => { el.removeEventListener("play", onPlay); el.removeEventListener("pause", off); el.removeEventListener("ended", off); };
  }, []);

  useEffect(() => {
    if (activeBuilder !== "api") {
      setCodeTab("python");
    }
  }, [activeBuilder]);

  useEffect(() => {
    const id = window.setInterval(
      () => setCaseIndex((prev) => (prev + 1) % CASE_STUDIES.length),
      CASE_ROTATION_INTERVAL,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!INTEGRATION_PROVIDERS.length) return;
    const id = window.setInterval(
      () => setProviderFocus((prev) => (prev + 1) % INTEGRATION_PROVIDERS.length),
      2400,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(
      () => setLanguageFocus((prev) => (prev + 1) % LANGUAGE_MODES.length),
      2400,
    );
    return () => window.clearInterval(id);
  }, []);

  const activeCase = CASE_STUDIES[caseIndex];
  const focusLang = LANGUAGE_MODES[languageFocus];
  const activeProvider = INTEGRATION_PROVIDERS.length
    ? INTEGRATION_PROVIDERS[providerFocus % INTEGRATION_PROVIDERS.length]
    : undefined;
  const topRegions = useMemo(
    () =>
      Object.entries(focusLang.distribution)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .slice(0, 4)
        .map(([region]) => REGION_LABELS[region as RegionId]),
    [focusLang],
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <LOGO_LIBRARY.Bolna className="h-8 w-auto" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-wide text-slate-800">Bolna</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a className="text-sm text-slate-700 hover:text-slate-900" href="#products">Products</a>
            <a className="text-sm text-slate-700 hover:text-slate-900" href="#solutions">Solutions</a>
            <a className="text-sm text-slate-700 hover:text-slate-900" href="#developers">Developers</a>
            <a className="text-sm text-slate-700 hover:text-slate-900" href="#pricing">Pricing</a>
            <CTA variant="ghost" className="ml-2">Sign in</CTA>
            <CTA className="ml-1">Book a demo</CTA>
          </nav>
        </Container>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* gradient canvas */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-20%] h-[900px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,#d5e2f7_0%,transparent_60%)] opacity-70" />
          <div className="absolute left-[10%] top-[40%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(closest-side,#dbeafe_0%,transparent_60%)]" />
          <div className="absolute right-[6%] top-[8%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,#fee2e2_0%,transparent_60%)]" />
        </div>
        <Container className="grid grid-cols-1 items-center gap-10 py-20 md:grid-cols-2 md:py-24">
          <Fade>
            <div>
              <Eyebrow>Voice infrastructure</Eyebrow>
              <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
                Talk. Understand. Act.
                <br />
                <span className="text-slate-800">In any Indian language. Instantly.</span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-base text-slate-600">
                Bolna turns every call into a 24/7 intelligent conversation — AI agents that think fast, speak locally, and get things done.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <CTA onClick={play}>Hear Bolna speak</CTA>
                <CTA variant="ghost">Book a demo</CTA>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 rounded-xl border border-slate-200/70 bg-white/70 p-4 text-center shadow-sm">
                <div>
                  <div className="text-lg font-semibold">300 ms</div>
                  <div className="text-xs text-slate-500">avg reply</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">10+ languages</div>
                  <div className="text-xs text-slate-500">native fluency</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">Millions</div>
                  <div className="text-xs text-slate-500">of calls/day</div>
                </div>
              </div>
            </div>
          </Fade>

          <Fade delay={0.05}>
            <div className="relative rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-800">Live voice demo</div>
                <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">\u003c300ms</div>
              </div>
              <Wave speaking={speaking} />
              <div className="mt-6 flex items-center justify-between text-sm">
                <button onClick={play} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50">▶︎ Play sample</button>
                <div className="text-slate-500">Hindi · Tamil · Telugu · Hinglish</div>
              </div>
              <audio ref={audioRef} src="/audio/bolna-demo-sample.mp3" preload="auto" />
            </div>
          </Fade>
        </Container>
      </section>

      {/* TRUST STRIP */}
      <section>
        <Container className="py-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {HERO_LOGOS.map((logo) => {
              const Logo = LOGO_LIBRARY[logo.name];
              return (
                <div
                  key={logo.name}
                  className="flex h-20 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 px-4 shadow-sm transition hover:bg-white"
                >
                  <Logo className={`h-12 w-auto ${logo.className ?? ""}`.trim()} />
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* PROBLEM */}
      <section>
        <Container className="py-20">
          <Eyebrow>The problem</Eyebrow>
          <H2>India runs on phone calls. The old call‑center model can’t keep up.</H2>
          <Sub>Customers wait. Agents churn. Repetition kills scale. Bolna replaces it with AI agents that handle millions of conversations — fluently and reliably.</Sub>
          <Fade className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm font-semibold text-slate-800">Call queues</div>
              <div className="h-2 w-full rounded bg-slate-100"><div className="h-2 w-3/4 rounded bg-slate-300" /></div>
              <div className="mt-3 h-2 w-full rounded bg-slate-100"><div className="h-2 w-5/6 rounded bg-slate-300" /></div>
              <div className="mt-3 h-2 w-full rounded bg-slate-100"><div className="h-2 w-2/3 rounded bg-slate-300" /></div>
              <p className="mt-4 text-sm text-slate-600">Queue grows, CSAT drops, costs rise.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm font-semibold text-slate-800">Bolna response</div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-800">“Namaste! Main madad ke liye yahan hoon — aapka order number batayenge?”</p>
                <p className="mt-2 text-xs text-slate-500">Reply in ~300ms</p>
              </div>
            </div>
          </Fade>
        </Container>
      </section>

      {/* SHIFT */}
      <section>
        <Container className="py-20">
          <Eyebrow>The shift</Eyebrow>
          <H2>From typing to talking — India’s next digital leap is voice.</H2>
          <Sub>Bolna agents speak 10+ Indian languages with human tone and sub‑300ms latency. They don’t just understand — they get things done.</Sub>
          <Fade className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-8">
              <div className="rounded-[32px] border border-[#416299]/25 bg-gradient-to-r from-[#4162990f] via-white to-amber-50/40 p-8 shadow-[0_24px_60px_rgba(65,98,153,0.12)]">
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[#416299]">Now speaking</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={focusLang?.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.42 }}
                    className="mt-5 flex flex-wrap items-baseline gap-3"
                  >
                    <span className="text-3xl font-semibold text-slate-900 sm:text-4xl">{focusLang?.label}</span>
                    <span className="rounded-full bg-[#416299]/10 px-3 py-1 text-xs font-medium text-[#416299] shadow-sm">Live</span>
                  </motion.div>
                </AnimatePresence>
                <p className="mt-4 max-w-xl text-sm text-slate-600">
                  {focusLang?.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {topRegions.slice(0, 4).map((region) => (
                    <span
                      key={region}
                      className="inline-flex items-center gap-2 rounded-full border border-[#416299]/35 bg-white/90 px-3 py-1 text-xs font-medium text-[#416299] shadow-sm"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#416299]" />
                      {region}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Switch language</div>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_MODES.map((mode, idx) => {
                    const isActive = idx === languageFocus;
                    return (
                      <motion.button
                        key={mode.label}
                        onClick={() => setLanguageFocus(idx)}
                        whileHover={{ y: -1 }}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          isActive
                            ? "border-[#416299] bg-white text-[#416299] shadow-sm shadow-[0_12px_30px_rgba(65,98,153,0.18)]"
                            : "border-slate-200 bg-white/80 text-slate-600 hover:border-[#416299]/40 hover:text-[#416299]"
                        }`}
                      >
                        {mode.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {LANGUAGE_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 text-center shadow-[0_18px_42px_rgba(65,98,153,0.12)]"
                >
                  <div className="text-xl font-semibold text-slate-900">{fact.value}</div>
                  <div className="text-xs font-medium uppercase tracking-[0.28em] text-slate-500">{fact.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{fact.meta}</div>
                </div>
              ))}
            </div>
          </Fade>
        </Container>
      </section>

      {/* PILLARS */}
      <section id="products">
        <Container className="py-20">
          <Eyebrow>Why it works</Eyebrow>
          <H2>Speed that scales. Languages that connect. Tools that build.</H2>
          <Fade className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {WHY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <motion.article
                  key={card.title}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.35 }}
                  className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-[0_26px_60px_rgba(65,98,153,0.14)]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 transition group-hover:opacity-100"
                    style={{ background: card.accent.overlay }}
                  />
                  <div className="relative z-[1] flex h-full flex-col">
                    <div className="flex-1 space-y-5 px-7 pt-7 transition-transform duration-300 ease-out group-hover:-translate-y-2">
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg"
                        style={{ background: card.accent.iconBg, color: card.accent.iconColor, boxShadow: "0 12px 30px rgba(15,23,42,0.08)" }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-b-[28px] border-t border-slate-200/70 bg-white/92 px-7 py-6 transition-colors duration-300 ease-out group-hover:bg-white">
                      <div className="space-y-2">
                        {card.bullets.map((bullet) => (
                          <div
                            key={bullet}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm"
                          >
                            <span
                              className="inline-flex h-2 w-2 rounded-full"
                              style={{ background: card.accent.bulletBg, boxShadow: card.accent.bulletShadow }}
                            />
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                      {card.cta ? (
                        <p className="mt-4 translate-y-2 text-sm font-semibold text-[#416299] opacity-0 transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-75">
                          {card.cta}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </Fade>
        </Container>
      </section>

      {/* FEATURES */}
      <section>
        <Container className="py-20">
          <Eyebrow>Features</Eyebrow>
          <H2>Features That Power Real Voice Agents</H2>
          <Sub>
            With integrated speech, telephony, and APIs, Bolna equips you with everything required to move from idea to live
            deployment quickly and securely.
          </Sub>
          <Fade className="mt-12 grid gap-6 lg:grid-cols-3">
            {FEATURE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <motion.article
                  key={pillar.title}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 p-7 shadow-sm hover:border-[#416299]/35 hover:shadow-[0_26px_56px_rgba(65,98,153,0.16)]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: pillar.accent.surface }} />
                  <div className="relative z-[1] flex h-full flex-col gap-5">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#416299] text-white shadow-lg shadow-[0_16px_34px_rgba(65,98,153,0.28)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{pillar.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{pillar.description}</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {pillar.items.map((item) => (
                        <div key={item.title} className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 shadow-sm">
                          <div className="flex gap-3">
                            <span
                              className="mt-1 inline-flex h-2.5 w-2.5 rounded-full"
                              style={{ background: pillar.accent.dot, boxShadow: pillar.accent.dotShadow }}
                            />
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                              <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </Fade>
        </Container>
      </section>

      {/* DEV / NO‑CODE */}
      <section id="developers">
        <Container className="py-20">
          <H2>Power for devs. Simplicity for everyone.</H2>
          <Sub>Launch in hours with templates — or go deep with the API.</Sub>
          <Fade className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
              {BUILDER_TABS.map((tab) => {
                const isActive = tab.id === activeBuilder;
                const Icon = tab.id === "studio" ? Headphones : Code2;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveBuilder(tab.id)}
                    className={`group flex w-full flex-col rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition hover:shadow-[0_18px_36px_rgba(65,98,153,0.18)] ${
                      isActive ? "border-[#416299] shadow-[0_16px_32px_rgba(65,98,153,0.18)]" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                      <span>{tab.kicker}</span>
                      <span className={`h-2 w-12 rounded-full bg-gradient-to-r transition ${isActive ? "from-[#416299] via-[#5d7fab] to-[#f7c566]" : "from-slate-200 to-slate-300"}`} />
                    </div>
                    <div className="mt-3 flex items-start gap-3">
                      <span className={`rounded-xl bg-slate-100 p-2 text-slate-600 transition group-hover:scale-105 ${isActive ? "bg-[#e6eefc] text-[#416299]" : ""}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-base font-semibold text-slate-900">{tab.title}</div>
                        <p className="mt-1 text-sm text-slate-600">{tab.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-[#dbe7fb] p-6 shadow-inner">
                <div className="text-sm font-semibold text-slate-900">Ship the way your team works</div>
                <p className="mt-2 text-sm text-slate-600">
                  Mix templates with API automations. Every call, webhook, and escalation is tracked in one console.
                </p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBuilderTab.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl"
              >
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${activeBuilderTab.accent} opacity-70 mix-blend-screen`}
                />
                <div className="relative z-[1] flex flex-col gap-6 p-8">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-700">{activeBuilderTab.kicker}</div>
                    <h3 className="text-2xl font-semibold text-slate-900">{activeBuilderTab.title}</h3>
                    <p className="max-w-xl text-sm text-slate-700">{activeBuilderTab.subtitle}</p>
                  </div>
                  {activeBuilderTab.id === "studio" ? (
                    <div className="space-y-6">
                      {activeBuilderTab.steps?.map((step, index) => (
                        <React.Fragment key={step.title}>
                          <div className="flex gap-4 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
                            <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90 text-sm font-semibold text-white">
                              {index + 1}
                            </span>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                              <p className="mt-1 text-sm text-slate-600">{step.detail}</p>
                            </div>
                          </div>
                          {index < (activeBuilderTab.steps?.length ?? 0) - 1 ? (
                            <div className="flex items-center pl-10">
                              <motion.span
                                aria-hidden
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.05 }}
                                className="flex items-center"
                              >
                                <span className="h-[2px] w-16 rounded-full bg-gradient-to-r from-[#b6c8e5] via-[#7f9ccc] to-[#416299]" />
                                <span className="ml-[-6px] h-3 w-3 rotate-45 rounded-[3px] bg-[#416299]/80 shadow-[0_0_12px_rgba(65,98,153,0.35)]" />
                              </motion.span>
                            </div>
                          ) : null}
                        </React.Fragment>
                      ))}
                      <div className="flex items-center gap-3 rounded-2xl border border-[#416299]/30 bg-[#416299]/8 p-5 text-sm text-slate-700">
                        <Sparkles className="h-4 w-4 text-[#416299]" />
                        <span>{activeBuilderTab.footer}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700">
                        {activeBuilderTab.extras?.map((extra) => (
                          <span key={extra} className="rounded-full bg-white/70 px-3 py-1 shadow-sm backdrop-blur">
                            {extra}
                          </span>
                        ))}
                      </div>
                      <div className="overflow-hidden rounded-[28px] border border-slate-900/20 bg-[#0b1220] text-slate-100 shadow-[0_28px_70px_rgba(15,23,42,0.35)]">
                        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-950 to-slate-900/80 px-6 py-4 text-xs uppercase tracking-[0.32em] text-slate-300">
                          <span>api.bolna.ai</span>
                          <span className="flex items-center gap-2 text-[10px] normal-case tracking-normal text-slate-300">
                            <PlugZap className="h-4 w-4 text-sky-300" /> Streaming ready
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
                          {activeBuilderTab.codeTabs?.map((tab) => {
                            const active = tab.id === codeTab;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setCodeTab(tab.id)}
                                className={`rounded-full px-3 py-1 font-medium transition ${
                                  active
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "bg-white/10 text-slate-200 hover:bg-white/15"
                                }`}
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_0%,rgba(59,130,246,0.18),transparent_70%)]" />
                          <pre className="relative z-[1] overflow-x-auto bg-[#020817] px-6 py-6 text-[13px] leading-relaxed text-slate-100">
                            {activeBuilderTab.codeTabs?.find((tab) => tab.id === codeTab)?.snippet}
                          </pre>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100/60 bg-emerald-500/10 p-5 text-sm text-slate-700">
                        <Cpu className="h-4 w-4 text-emerald-500" />
                        <span>{activeBuilderTab.footer}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </Fade>
        </Container>
      </section>

      {/* CASE STUDIES */}
      <section>
        <Container className="py-20">
          <H2>Proven in the field</H2>
          <Sub>Stories from teams running at real‑world scale.</Sub>
          <Fade className="mt-12 space-y-10">
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Outcomes</div>
                <div className="space-y-4">
                  {activeCase.stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-[#416299]/25 bg-white/90 p-5 shadow-sm shadow-[0_16px_36px_rgba(65,98,153,0.12)]">
                      <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
                      <div className="text-sm text-slate-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <motion.article
                key={activeCase.company}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl"
              >
                <motion.span
                  key={`${activeCase.company}-progress`}
                  className="absolute inset-x-0 top-0 h-1 origin-left bg-gradient-to-r from-[#416299] via-[#27456f] to-[#1b3353]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: CASE_ROTATION_INTERVAL / 1000, ease: "linear" }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(110%_90%_at_20%_0%,rgba(65,98,153,0.18),transparent_70%),radial-gradient(120%_120%_at_80%_80%,rgba(255,255,255,0.6),transparent_70%)]"
                />
                <div className="relative z-[1] grid gap-8 p-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#416299]/30 bg-white/85 px-3 py-1 text-xs font-medium text-[#416299] shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-[#416299]" />
                      Live with Bolna
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-600">{activeCase.company}</div>
                    <h3 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{activeCase.headline}</h3>
                    <p className="text-sm text-slate-700 sm:text-base">{activeCase.summary}</p>
                    <blockquote className="relative overflow-hidden rounded-2xl border border-[#416299]/15 bg-white/80 p-4 text-sm text-slate-700 shadow-sm">
                      <span className="absolute left-3 top-2 text-3xl font-serif text-[#416299]/20">“</span>
                      <p className="pl-6 pr-2">{activeCase.quote}</p>
                      <footer className="mt-3 pl-6 text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500">
                        {activeCase.speaker}
                      </footer>
                    </blockquote>
                    <button className="inline-flex items-center gap-2 rounded-full bg-[#416299] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[0_18px_40px_rgba(65,98,153,0.3)] transition hover:-translate-y-0.5">
                      <ArrowRight className="h-4 w-4" />
                      {activeCase.cta}
                    </button>
                  </div>
                  <div className="relative hidden aspect-[4/5] items-center justify-center overflow-hidden rounded-3xl border border-white/40 bg-white/50 shadow-inner lg:flex">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffffb5,transparent_65%)]" />
                    <div className="relative z-[1] flex flex-col items-center gap-4 text-center text-slate-800">
                      <div className="rounded-full bg-white/80 p-4 shadow-lg">
                        <Headphones className="h-8 w-8 text-[#416299]" />
                      </div>
                      <div className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">Voice agent</div>
                      <p className="px-6 text-sm text-slate-600">
                        Rich transcripts, emotion tagging, and WhatsApp handoff — captured automatically in the Bolna console.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.article>
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Customers</div>
                <div className="grid grid-cols-4 gap-4">

                  {CASE_STUDIES.map((study, idx) => {
                    const active = idx === caseIndex;
                    return (
                      <button
                        key={study.company}
                        onClick={() => setCaseIndex(idx)}
                        className={`group relative min-w-[240px] rounded-2xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#416299] ${
                          active
                            ? "border-[#416299] bg-white shadow-lg shadow-indigo-200/60"
                            : "border-slate-200 bg-white/70 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                          <span>{study.company}</span>
                          <span className="text-xs font-medium text-slate-500">Case study</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">{study.summary}</p>
                        <div className="mt-4 h-1.5 w-full rounded-full bg-slate-200">
                          <motion.span
                            className={`block h-full rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 ${active ? "" : "scale-x-0"}`}
                            style={{ transformOrigin: "left" }}
                            animate={{ scaleX: active ? 1 : 0 }}
                            transition={{ duration: active ? 0.6 : 0.2 }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Fade>
        </Container>
      </section>

      {/* INTEGRATIONS */}
      <section id="solutions">
        <Container className="py-20">
          <H2>Works with your stack</H2>
          <Sub>Plug into Twilio, Plivo, OpenAI, Deepseek, ElevenLabs, Cartesia, Deepgram, and more.</Sub>
          <Fade className="mt-12 space-y-10">
            <div className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-xl">
              <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#dbe7fb] via-white to-[#fff7ea]" />
              <motion.div
                aria-hidden
                className="absolute -left-32 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#416299]/25 blur-3xl"
                animate={{ x: [0, 30, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative z-[1] grid gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                <div className="space-y-6 p-10">
                  {INTEGRATION_HIGHLIGHTS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex gap-4 rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(65,98,153,0.18)]"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#416299]/10 text-[#416299]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                          <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="relative flex flex-col gap-6 p-10">
                  <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-inner">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#416299]/12 via-transparent to-[#ffe7c2]/40" />
                    <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {INTEGRATION_PROVIDERS.map((name, idx) => {
                        const isActive = name === activeProvider;
                        const logo = PROVIDER_LOGOS[name];
                        return (
                          <div key={name} className="relative">
                            {isActive ? (
                              <motion.div
                                layoutId="provider-highlight"
                                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                                className="absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,rgba(65,98,153,0.95),rgba(59,130,246,0.9),rgba(20,184,166,0.88))] shadow-lg"
                              />
                            ) : null}
                            <button
                              type="button"
                              onMouseEnter={() => setProviderFocus(idx)}
                              aria-label={name}
                              title={name}
                              className={`relative z-[1] flex w-full items-center justify-center rounded-2xl border px-4 py-3 transition ${
                                isActive
                                  ? "border-transparent drop-shadow-lg"
                                  : "border-slate-200/80 bg-white/70 text-slate-600 hover:border-[#416299]/40 hover:text-[#416299]"
                              }`}
                            >
                              {logo ? (
                                <>
                                  <span className="sr-only">{name}</span>
                                  <logo.Logo className="h-10 w-auto" />
                                </>
                              ) : (
                                <span className="text-sm font-medium">{name}</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {activeProvider ? (
                    <motion.div
                      key={activeProvider}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="inline-flex items-center gap-3 self-start rounded-full border border-[#416299]/40 bg-white/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#416299]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#416299]" />
                      <span>{activeProvider} in focus</span>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm shadow-[0_12px_28px_rgba(65,98,153,0.12)]">
                <div className="text-sm font-semibold text-slate-900">Trigger workflows</div>
                <p className="mt-2 text-sm text-slate-600">Send events to Zapier, Make.com, or viaSocket with full conversation payloads.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm shadow-[0_12px_28px_rgba(65,98,153,0.12)]">
                <div className="text-sm font-semibold text-slate-900">Schedule next steps</div>
                <p className="mt-2 text-sm text-slate-600">Book callbacks and demos through Cal.com without dropping the caller.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm shadow-[0_12px_28px_rgba(65,98,153,0.12)]">
                <div className="text-sm font-semibold text-slate-900">Model control</div>
                <p className="mt-2 text-sm text-slate-600">Swap between OpenAI, Deepseek, Cartesia, and Azure voices per flow.</p>
              </div>
            </div>
          </Fade>
        </Container>
      </section>

      {/* WHY NOW */}
      <section>
        <Container className="py-20">
          <H2>India is digitizing in 10+ languages at once.</H2>
          <Sub>The next billion users won’t type. They’ll talk — and brands that listen will win trust at scale. Bolna powers that shift.</Sub>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden pb-24 pt-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[conic-gradient(from_120deg,rgba(65,98,153,0.22),rgba(59,130,246,0.18),rgba(247,197,102,0.18),transparent_30%)]" />
        </div>
        <Container className="text-center">
          <h3 className="text-balance text-3xl font-semibold sm:text-4xl">
            The next billion users won’t type. They’ll talk.
            <br /><span className="text-slate-800">Bolna’s already listening.</span>
          </h3>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <CTA onClick={play}>Hear Bolna speak</CTA>
            <CTA variant="ghost">Book a demo</CTA>
          </div>
          <p className="mt-4 text-sm text-slate-500">Tagline: Voice AI to enable India’s next billion.</p>
        </Container>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/70 bg-white py-14">
        <Container className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-5">
          <Foot title="Product" items={["Platform", "Agents", "Integrations", "API Docs"]} />
          <Foot title="Solutions" items={["Customer Support", "Hiring", "E‑commerce Recovery"]} />
          <Foot title="Developers" items={["Docs", "SDKs", "Postman", "Status"]} />
          <Foot title="Company" items={["About", "YC Launch", "Careers", "Contact"]} />
          <div>
            <div className="mb-3 text-sm font-semibold">Get started</div>
            <div className="flex gap-2">
              <CTA>Book a demo</CTA>
              <CTA variant="ghost">Hear it live</CTA>
            </div>
          </div>
        </Container>
        <Container className="mt-10 flex items-center justify-between border-t border-slate-200 pt-8 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <LOGO_LIBRARY.Bolna className="h-6 w-auto" aria-hidden="true" />
            <span>© {new Date().getFullYear()} Bolna</span>
          </div>

          <div className="flex gap-6">
            <a className="hover:text-slate-700" href="#">Terms</a>
            <a className="hover:text-slate-700" href="#">Privacy</a>
            <a className="hover:text-slate-700" href="#">Status</a>
          </div>
        </Container>
      </footer>

      {/* keyframes */}
      <style jsx global>{`
        @keyframes wave { 0%{transform:scaleY(.3);opacity:.7} 50%{transform:scaleY(1);opacity:1} 100%{transform:scaleY(.3);opacity:.7} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes marquee-reverse { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
      `}</style>
    </div>
  );
}

// -----------------------------
// Subcomponents
// -----------------------------

function Foot({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <ul className="space-y-2 text-sm text-slate-600">
        {items.map((i) => (
          <li key={i}><a className="hover:text-slate-800" href="#">{i}</a></li>
        ))}
      </ul>
    </div>
  );
}
