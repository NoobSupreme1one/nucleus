// @ts-nocheck
import React, { useState } from "react";

// Single-file showcase with two polished landing pages:
// 1) Remote Team Collaboration ("TeamOrbit")
// 2) Smart Home Energy Optimizer ("WattWise")
// Toggle between them with the segmented control at the top.

const Segmented = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="mx-auto mt-8 w-full max-w-[560px] rounded-2xl bg-white/10 p-1 backdrop-blur border border-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
    <div className="grid grid-cols-2 gap-1">
      {[
        { key: "remote", label: "Remote Collaboration" },
        { key: "energy", label: "Smart Energy Optimizer" },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative h-12 rounded-xl text-sm font-medium transition-all duration-300 ${
            value === tab.key
              ? "bg-white text-gray-900 shadow-md"
              : "text-white/80 hover:text-white"
          }`}
        >
          {value === tab.key && (
            <span className="absolute inset-0 rounded-xl [box-shadow:0_8px_30px_rgba(2,6,23,0.08)]" />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  </div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
    {children}
  </span>
);

const CTAButtons = ({ primary = "Get Started", secondary = "Book a Demo" }) => (
  <div className="mt-8 flex flex-wrap items-center gap-3">
    <a
      href="#"
      className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow hover:shadow-lg transition"
    >
      {primary}
    </a>
    <a
      href="#"
      className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition backdrop-blur"
    >
      {secondary}
    </a>
  </div>
);

const Feature = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="group rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur transition hover:bg-white/10">
    <div className="mb-3 h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
      {icon}
    </div>
    <h4 className="text-white font-semibold">{title}</h4>
    <p className="mt-1 text-white/75 text-sm leading-relaxed">{desc}</p>
  </div>
);

const Testimonial = ({ quote, author, role }: { quote: string; author: string; role: string }) => (
  <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-white/90 backdrop-blur">
    <p className="text-base leading-relaxed">“{quote}”</p>
    <div className="mt-4 text-sm text-white/70">— {author}, {role}</div>
  </div>
);

const PriceCard = ({ name, price, tagline, features, highlight = false }: { name: string; price: string; tagline: string; features: string[]; highlight?: boolean }) => (
  <div className={`relative rounded-2xl border p-6 backdrop-blur ${
    highlight
      ? "border-white/40 bg-white text-gray-900 shadow-xl"
      : "border-white/15 bg-white/5 text-white/90"
  }`}>
    {highlight && (
      <span className="absolute -top-3 right-4 rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white shadow">Popular</span>
    )}
    <div className="text-sm opacity-70">{name}</div>
    <div className="mt-1 text-3xl font-bold">{price}<span className="text-base font-medium opacity-60">/mo</span></div>
    <div className={`mt-1 text-sm ${highlight ? "text-gray-700" : "text-white/70"}`}>{tagline}</div>
    <ul className={`mt-5 space-y-2 text-sm ${highlight ? "text-gray-800" : "text-white/85"}`}>
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-2">
          <svg viewBox="0 0 24 24" className={`mt-0.5 h-5 w-5 ${highlight ? "text-emerald-700" : "text-emerald-400"}`} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{f}</span>
        </li>
      ))}
    </ul>
    <a href="#" className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
      highlight
        ? "bg-gray-900 text-white hover:bg-gray-800"
        : "border border-white/25 bg-white/5 text-white hover:bg-white/10"
    }`}>
      Choose {name}
    </a>
  </div>
);

/* -------------------- Remote Collaboration (TeamOrbit) -------------------- */
const RemoteCollab = () => (
  <div className="relative overflow-hidden">
    {/* Decorative background */}
    <BackgroundGradient variant="purple" />

    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-white">
      <div className="flex items-center gap-2">
        <LogoIcon />
        <span className="text-xl font-bold tracking-tight">TeamOrbit</span>
      </div>
      <nav className="hidden gap-6 text-sm/6 md:flex">
        <a className="text-white/80 hover:text-white" href="#features">Features</a>
        <a className="text-white/80 hover:text-white" href="#pricing">Pricing</a>
        <a className="text-white/80 hover:text-white" href="#faq">FAQ</a>
      </nav>
      <div className="flex items-center gap-2">
        <a className="hidden rounded-xl border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10 md:inline-flex" href="#">Sign in</a>
        <a className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow hover:shadow-lg" href="#">Get started</a>
      </div>
    </header>

    {/* Hero */}
    <section className="relative z-10 mx-auto mt-6 max-w-5xl px-6 text-center text-white">
      <Badge>New • AI-powered notes & async standups</Badge>
      <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
        Work together, from anywhere.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-white/80 text-lg">
        TeamOrbit brings chat, docs, whiteboards, and meetings into a single flow—so your team can focus on outcomes, not context switching.
      </p>
      <CTAButtons primary="Start free" secondary="Watch demo" />

      {/* Mock UI preview */}
      <div className="mt-12 rounded-2xl border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur">
        <div className="rounded-xl bg-gradient-to-br from-white/70 to-white/40 p-6 text-left text-gray-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600" />
            <div>
              <div className="font-semibold">Weekly Sync – Product Squad</div>
              <div className="text-xs text-gray-600">Live doc • Whiteboard • Recording</div>
            </div>
            <span className="ml-auto rounded-full bg-gray-900/90 px-2 py-1 text-xs font-medium text-white">Recording</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">Agenda</div>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                <li>• Launch status</li>
                <li>• Bugs & blockers</li>
                <li>• Next sprint goals</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:col-span-2">
              <div className="text-sm font-semibold">AI Notes</div>
              <div className="mt-2 h-28 w-full rounded-lg bg-gray-100" />
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 12h12" strokeLinecap="round"/></svg>
                Action items auto-extracted
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="relative z-10 mx-auto mt-20 max-w-6xl px-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Feature icon={<IconChat />} title="Unified comms" desc="Chat, video, and comments live together so context never gets lost." />
        <Feature icon={<IconDoc />} title="Live docs" desc="Plan, write, and ship in multiplayer docs with tasks and mentions." />
        <Feature icon={<IconCanvas />} title="Canvas & whiteboard" desc="Sketch ideas, map systems, and align quickly with infinite boards." />
        <Feature icon={<IconSpark />} title="AI copilots" desc="Auto-notes, standups, summaries, and suggested action items." />
      </div>
    </section>

    {/* Testimonials & Logos */}
    <section className="relative z-10 mx-auto mt-20 max-w-6xl px-6">
      <div className="grid items-start gap-6 md:grid-cols-3">
        <Testimonial quote="We replaced three tools and cut meetings by 30%. TeamOrbit keeps everyone in the loop without extra pings." author="Marisol A." role="VP Product, AeroCloud" />
        <Testimonial quote="Docs + chat + whiteboards in one place is magic. The AI notes are scarily good." author="Dev Patel" role="Founder, Trinova" />
        <Testimonial quote="Our async standups finally stick. The team actually reads the summaries." author="Hannah Lee" role="Eng Manager, Northstar" />
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 opacity-80 md:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg border border-white/10 bg-white/5" />
        ))}
      </div>
    </section>

    {/* Pricing */}
    <section id="pricing" className="relative z-10 mx-auto mt-20 max-w-6xl px-6">
      <div className="grid gap-6 md:grid-cols-3">
        <PriceCard name="Free" price="$0" tagline="For small teams starting out" features={["Up to 5 users", "Unlimited docs", "Basic AI notes"]} />
        <PriceCard name="Pro" price="$12" tagline="Best for growing teams" features={["Unlimited users", "Whiteboards & tasks", "Advanced AI summaries"]} highlight />
        <PriceCard name="Business" price="$24" tagline="Security & scale" features={["SSO & roles", "Data residency", "Priority support"]} />
      </div>
    </section>

    <Footer />
  </div>
);

/* -------------------- Smart Energy Optimizer (WattWise) -------------------- */
const EnergyOptimizer = () => (
  <div className="relative overflow-hidden">
    {/* Decorative background */}
    <BackgroundGradient variant="emerald" />

    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-white">
      <div className="flex items-center gap-2">
        <BoltIcon />
        <span className="text-xl font-bold tracking-tight">WattWise</span>
      </div>
      <nav className="hidden gap-6 text-sm/6 md:flex">
        <a className="text-white/80 hover:text-white" href="#how">How it works</a>
        <a className="text-white/80 hover:text-white" href="#features">Features</a>
        <a className="text-white/80 hover:text-white" href="#pricing">Pricing</a>
      </nav>
      <div className="flex items-center gap-2">
        <a className="hidden rounded-xl border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10 md:inline-flex" href="#">Login</a>
        <a className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow hover:shadow-lg" href="#">Try it free</a>
      </div>
    </header>

    {/* Hero */}
    <section className="relative z-10 mx-auto mt-6 max-w-5xl px-6 text-center text-white">
      <Badge>Save 15–30% on energy • Works with solar & EV</Badge>
      <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
        Cut your bill, not your comfort.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-white/80 text-lg">
        WattWise learns your routines and runs appliances when power is cheapest and cleanest. Real‑time insights, smart automations, and effortless savings.
      </p>
      <CTAButtons primary="Connect my home" secondary="See how it works" />

      {/* Simple usage chart mock */}
      <div className="mt-12 rounded-2xl border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur">
        <div className="rounded-xl bg-white/70 p-6 text-left text-gray-900">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Today's Usage</div>
            <div className="text-sm text-gray-600">Projected savings: 22%</div>
          </div>
          <div className="mt-4 h-28 w-full rounded-lg bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-100" />
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-gray-700">
            <div className="rounded-lg bg-emerald-50 p-3">Off-peak: 7.2 kWh</div>
            <div className="rounded-lg bg-emerald-50 p-3">Mid-peak: 3.9 kWh</div>
            <div className="rounded-lg bg-emerald-50 p-3">On-peak: 1.4 kWh</div>
          </div>
        </div>
      </div>
    </section>

    {/* How it works */}
    <section id="how" className="relative z-10 mx-auto mt-20 max-w-6xl px-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Feature icon={<IconPlug />} title="Connect" desc="Link thermostats, plugs, EV chargers, and panels—no hub required." />
        <Feature icon={<IconBrain />} title="Learn" desc="AI maps your routines & rates to build an optimal schedule automatically." />
        <Feature icon={<IconLeaf />} title="Optimize" desc="Shift heavy loads to greener, cheaper hours without lifting a finger." />
      </div>
    </section>

    {/* Features */}
    <section id="features" className="relative z-10 mx-auto mt-20 max-w-6xl px-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Feature icon={<IconRealtime />} title="Real‑time insights" desc="Live usage, costs, and carbon intensity by device." />
        <Feature icon={<IconSchedule />} title="Smart schedules" desc="Auto‑runs appliances during off‑peak windows." />
        <Feature icon={<IconSolar />} title="Solar & storage" desc="Prioritize self‑consumption or sell back to the grid." />
        <Feature icon={<IconShield />} title="Privacy first" desc="Your data stays encrypted and in your control." />
      </div>
    </section>

    {/* Pricing */}
    <section id="pricing" className="relative z-10 mx-auto mt-20 max-w-6xl px-6">
      <div className="grid gap-6 md:grid-cols-3">
        <PriceCard name="Starter" price="$0" tagline="Monitor & basic tips" features={["Live dashboard", "1 automation", "1 user"]} />
        <PriceCard name="Plus" price="$8" tagline="Smart schedules & savings" features={["Unlimited automations", "Rate-aware control", "3 users"]} highlight />
        <PriceCard name="Household" price="$16" tagline="Whole‑home intelligence" features={["Solar & EV support", "Room-by-room comfort", "Family accounts"]} />
      </div>
    </section>

    <Footer />
  </div>
);

/* ------------------------------ Shared UI ------------------------------ */
const BackgroundGradient = ({ variant = "purple" }: { variant?: "purple" | "emerald" }) => (
  <div className="pointer-events-none absolute inset-0 -z-10">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-900" />
    {variant === "purple" ? (
      <>
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute top-24 -left-10 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
      </>
    ) : (
      <>
        <div className="absolute -top-28 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute top-24 -left-10 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-lime-400/20 blur-3xl" />
      </>
    )}

    {/* Subtle grid */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

const Footer = () => (
  <footer className="relative z-10 mx-auto mt-24 max-w-7xl px-6 pb-20 text-white/70">
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <div className="text-sm">© {new Date().getFullYear()} Crafted with ♥ — Demo landing</div>
      <div className="flex items-center gap-4 text-sm">
        <a href="#" className="hover:text-white">Privacy</a>
        <a href="#" className="hover:text-white">Terms</a>
        <a href="#" className="hover:text-white">Contact</a>
      </div>
    </div>
  </footer>
);

/* ------------------------------ Icons ------------------------------ */
const LogoIcon = () => (
  <svg viewBox="0 0 32 32" className="h-8 w-8 text-white"><defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#22d3ee"/></linearGradient></defs><path fill="url(#g1)" d="M16 2c7.7 0 14 6.3 14 14s-6.3 14-14 14S2 23.7 2 16 8.3 2 16 2Zm0 5a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/></svg>
);
const BoltIcon = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" strokeLinejoin="round"/></svg>
);
const IconChat = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" strokeLinejoin="round"/></svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v6h6"/></svg>
);
const IconCanvas = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
);
const IconSpark = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4" strokeLinecap="round"/></svg>
);
const IconPlug = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 7v4m6-4v4M7 11h10a4 4 0 0 1 0 8H7a4 4 0 0 1 0-8Z" strokeLinecap="round"/></svg>
);
const IconBrain = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6a3 3 0 1 0 0 6 3 3 0 1 0 0 6m8-12a3 3 0 1 1 0 6 3 3 0 1 1 0 6" strokeLinecap="round"/></svg>
);
const IconLeaf = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14c4-8 12-10 16-10 0 4-2 12-10 16-2 1-6 1-6-6Z" strokeLinejoin="round"/></svg>
);
const IconRealtime = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 4-5"/></svg>
);
const IconSchedule = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 3v4M17 3v4"/><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M16 13h-3v4"/></svg>
);
const IconSolar = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3z"/></svg>
);

/* ------------------------------ Page Shell ------------------------------ */
export default function LandingShowcase() {
  const [tab, setTab] = useState<"remote" | "energy">("remote");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top segmented switcher */}
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <h2 className="text-center text-sm font-semibold text-white/70 tracking-wider">Landing Page Showcase</h2>
        <Segmented value={tab} onChange={(v) => setTab(v as any)} />
      </div>

      {/* Active page */}
      <div className="mt-6">{tab === "remote" ? <RemoteCollab /> : <EnergyOptimizer />}</div>
    </div>
  );
}
