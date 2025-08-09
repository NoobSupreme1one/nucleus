// @ts-nocheck
import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Lock,
  Fingerprint,
  QrCode,
  FileSearch,
  Globe,
  Database,
  BarChart3,
  GitCommit,
  Layers,
  ServerCog,
  History,
} from "lucide-react";

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
    {children}
  </span>
);

const SectionTitle = ({
  eyebrow,
  title,
  subtitle,
  center,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) => (
  <div className={center ? "text-center" : "text-left"}>
    {eyebrow && (
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600/15 to-cyan-600/15 px-3 py-1 text-xs font-semibold text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> {eyebrow}
      </div>
    )}
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        {subtitle}
      </p>
    )}
  </div>
);

const FeatureCard = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) => (
  <motion.div
    initial={{ y: 16, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.5 }}
    className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-6 shadow-sm backdrop-blur hover:shadow-lg"
  >
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 text-white shadow-md">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{desc}</p>
    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-600/10 blur-2xl transition-all group-hover:scale-150" />
  </motion.div>
);

const TrustGrid = () => (
  <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 items-center gap-6 opacity-80">
    {["Open Source", "ZK‑Ready", "E2E Encryption", "Auditable", "Mobile‑First", "Paper Trail"].map((name) => (
      <div
        key={name}
        className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 py-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
      >
        {name}
      </div>
    ))}
  </div>
);

const HowItWorks = () => (
  <div className="grid gap-4 md:grid-cols-4">
    {[
      {
        icon: Fingerprint,
        title: "Register",
        desc: "Secure ID verification with privacy‑preserving checks.",
      },
      {
        icon: QrCode,
        title: "Ballot Token",
        desc: "Receive a one‑time ballot token—blind‑signed to protect identity.",
      },
      {
        icon: CheckCircle2,
        title: "Cast Vote",
        desc: "Submit on web or mobile; receipt lets you verify inclusion.",
      },
      {
        icon: FileSearch,
        title: "Verify",
        desc: "Public ledger proves tally integrity—no personal data exposed.",
      },
    ].map((s, i) => (
      <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <s.icon className="h-5 w-5" />
        </div>
        <div className="mt-3 font-semibold text-gray-900 dark:text-white">{s.title}</div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{s.desc}</div>
      </div>
    ))}
  </div>
);

const Testimonial = () => (
  <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-white to-white/70 dark:from-white/5 dark:to-white/0 p-8 shadow-xl">
    <div className="text-sm text-gray-600 dark:text-gray-300">Pilot feedback</div>
    <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">“CivicLedger made our municipal election more transparent without compromising voter privacy.”</div>
    <div className="mt-2 text-sm text-gray-500">— Sofia Martinez, City Clerk, Riverview</div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white dark:from-[#07131a] dark:via-[#07131a] dark:to-[#07131a] text-gray-900 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/30">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <a href="#" className="flex items-center gap-2 font-bold">
              <span className="relative">
                <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 blur" />
                <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                  CL
                </span>
              </span>
              <span className="text-lg">CivicLedger</span>
            </a>

            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
              <a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a>
              <a href="#how" className="hover:text-gray-900 dark:hover:text-white">How it works</a>
              <a href="#security" className="hover:text-gray-900 dark:hover:text-white">Security</a>
              <a href="#faq" className="hover:text-gray-900 dark:hover:text-white">FAQ</a>
            </nav>

            <div className="flex items-center gap-3">
              <a
                href="#"
                className="hidden sm:inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-white/20 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white"
              >
                Docs
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95"
              >
                Request a pilot <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-10%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-600/10 blur-3xl" />
          <div className="absolute bottom-[-10%] right-0 h-72 w-72 rounded-full bg-cyan-600/10 blur-3xl" />
        </div>
        <Container>
          <div className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
            <div>
              <Badge>Open‑source • ZK‑ready</Badge>
              <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
                Trust every vote, verify every tally
              </h1>
              <p className="mt-4 text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                CivicLedger is a blockchain‑based voting platform that delivers end‑to‑end verifiability, voter privacy, and real‑time auditability—online and in‑person.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95"
                >
                  See a demo <ArrowRight className="ml-1 h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-300 dark:border-white/20 bg-white/70 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  Security whitepaper
                </a>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="h-4 w-4" /> Designed to meet SOC 2 & ISO 27001
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                  <div className="text-gray-500">Average setup time</div>
                  <div className="text-2xl font-bold"><span className="text-emerald-600">14</span> days</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                  <div className="text-gray-500">Throughput</div>
                  <div className="text-2xl font-bold">10k+ votes/min</div>
                </div>
              </div>
            </div>

            {/* Mock product UI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-emerald-600/10 to-cyan-600/10 blur-2xl" />

              <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4 shadow-2xl">
                {/* Top bar */}
                <div className="flex items-center justify-between rounded-2xl bg-white/70 dark:bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Municipal Election • Precinct 12
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Globe className="h-4 w-4" /> Online & In‑person
                  </div>
                </div>

                {/* Content grid */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {/* Ballot */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Secure Ballot
                    </div>
                    <div className="mt-3 space-y-3 text-sm">
                      {["Alex Grant", "Priya Shah", "Jordan Brooks"].map((name, idx) => (
                        <label key={name} className="flex items-center gap-2">
                          <input type="radio" name="mayor" defaultChecked={idx===1} className="h-4 w-4 border-gray-300" />
                          <span className="text-gray-700 dark:text-gray-200">{name}</span>
                        </label>
                      ))}
                      <button className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                        Submit vote
                      </button>
                      <div className="text-[11px] text-gray-500">Receipt: 0x9e12…a4c • Keep for verification</div>
                    </div>
                  </div>

                  {/* Ledger Explorer */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-black/90 p-3 text-white">
                    <div className="flex items-center justify-between text-xs">
                      <div className="inline-flex items-center gap-2 font-semibold">
                        <Database className="h-4 w-4" /> Ledger Explorer
                      </div>
                      <div className="inline-flex items-center gap-2 text-white/60">
                        <History className="h-4 w-4" /> Live
                      </div>
                    </div>
                    <div className="mt-2 space-y-2 text-[11px]">
                      {[1,2,3].map((b) => (
                        <div key={b} className="rounded bg-white/10 p-2">
                          <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-2">
                              <GitCommit className="h-3.5 w-3.5" /> Block #{1587 + b}
                            </div>
                            <div className="text-white/60">2 tx</div>
                          </div>
                          <div className="mt-1 truncate text-white/70">tx: 0x9e12f3a4c…{b} • 2025‑08‑09 10:3{b}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      <Lock className="h-4 w-4" /> Privacy & Integrity
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                      {[
                        { icon: Shield, text: "End‑to‑end encrypted" },
                        { icon: Layers, text: "Merkle proofs" },
                        { icon: Fingerprint, text: "Anon receipts" },
                        { icon: ServerCog, text: "Air‑gapped tally" },
                      ].map((i) => (
                        <div key={i.text} className="rounded-md bg-white/60 dark:bg-white/5 p-2 inline-flex items-center gap-2">
                          <i.icon className="h-4 w-4 text-emerald-600" /> {i.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Turnout */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      <BarChart3 className="h-4 w-4" /> Turnout
                    </div>
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">Real‑time participation by district</div>
                    <div className="mt-2 h-28 w-full rounded-md bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-70" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24">
        <Container>
          <SectionTitle
            center
            eyebrow="Features"
            title="Built for integrity, privacy, and scale"
            subtitle="Replace opaque processes with verifiable, privacy‑preserving voting that works online and at polling places."
          />

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Shield}
              title="End‑to‑end verifiable"
              desc="Public proofs ensure all counted votes were cast and recorded correctly."
            />
            <FeatureCard
              icon={Fingerprint}
              title="Private by design"
              desc="Ballots are unlinkable from voters using blind signatures and mixnets."
            />
            <FeatureCard
              icon={QrCode}
              title="Hybrid voting"
              desc="Online, kiosk, or paper with QR—one ledger, unified tally."
            />
            <FeatureCard
              icon={FileSearch}
              title="Audit‑ready"
              desc="Exportable logs and cryptographic proofs for independent audits."
            />
          </div>

          <TrustGrid />
        </Container>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 md:py-24">
        <Container>
          <div className="grid items-start gap-10 md:grid-cols-2">
            <SectionTitle
              eyebrow="How it works"
              title="From registration to verified results"
              subtitle="Modular components plug into your existing election workflows."
            />
            <HowItWorks />
          </div>
        </Container>
      </section>

      {/* Security & Compliance */}
      <section id="security" className="pb-16 md:pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-8 shadow-xl">
            <div className="grid gap-6 md:grid-cols-3">
              {[{
                icon: Shield,
                title: "Defense‑grade security",
                desc: "HSM key custody, role‑based controls, and encrypted transport at every hop.",
              },{
                icon: ServerCog,
                title: "Deploy anywhere",
                desc: "Cloud, on‑prem, or air‑gapped counting nodes for sensitive environments.",
              },{
                icon: Layers,
                title: "Standards aligned",
                desc: "Designed to meet NIST, FIPS 140‑2, and OWASP ASVS best practices.",
              }].map((c) => (
                <div key={c.title} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-lg font-semibold">{c.title}</div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{c.desc}</div>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-600/10 blur-2xl" />
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-emerald-600 to-cyan-600 p-8 text-white shadow-xl">
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm/relaxed opacity-90">Get started</div>
                <h3 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Run a secure pilot in weeks—not months</h3>
                <p className="mt-2 text-white/90">Our team will customize CivicLedger to your regulations and workflows.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a href="#" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-md">
                    Request a pilot <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                  <a href="#" className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white">
                    Talk to security
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-6 -z-10 rounded-3xl bg-white/20 blur-2xl" />
                <div className="rounded-2xl border border-white/30 bg-white/10 p-6 backdrop-blur">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-white/15 p-3">
                      <div className="text-white/80">Eligible voters</div>
                      <div className="text-2xl font-bold">1.2M</div>
                    </div>
                    <div className="rounded-lg bg-white/15 p-3">
                      <div className="text-white/80">Turnout forecast</div>
                      <div className="text-2xl font-bold">62%</div>
                    </div>
                    <div className="rounded-lg bg-white/15 p-3">
                      <div className="text-white/80">Nodes</div>
                      <div className="text-2xl font-bold">21</div>
                    </div>
                    <div className="rounded-lg bg-white/15 p-3">
                      <div className="text-white/80">Avg. finality</div>
                      <div className="text-2xl font-bold">2.1s</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24">
        <Container>
          <SectionTitle center eyebrow="FAQ" title="Answers to common questions" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              {
                q: "Is voter privacy preserved?",
                a: "Yes. We separate identity from ballots using blind signatures and publish only anonymous proofs on the ledger.",
              },
              {
                q: "Can this work without reliable internet?",
                a: "Yes. Offline ballot capture with later sync and paper backups keep precincts running.",
              },
              {
                q: "How do audits work?",
                a: "Observers can independently verify the tally using published Merkle roots and cryptographic receipts.",
              },
              {
                q: "Is this legal in my jurisdiction?",
                a: "We adapt to local regulations and can run pilots alongside traditional systems for parallel audits.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 shadow-sm"
              >
                <div className="font-semibold text-gray-900 dark:text-white">{item.q}</div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.a}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 dark:border-white/10 py-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 font-bold">
                <span className="relative">
                  <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 blur" />
                  <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                    CL
                  </span>
                </span>
                <span>CivicLedger</span>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 max-w-sm">
                Verifiable, privacy‑preserving voting for modern democracies.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="font-semibold">Product</div>
                <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                  <li><a href="#features">Features</a></li>
                  <li><a href="#how">How it works</a></li>
                  <li><a href="#security">Security</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
              <div>
                <div className="font-semibold">Company</div>
                <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                  <li><a href="#">About</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Compliance</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="flex items-end md:justify-end">
              <div className="text-sm text-gray-500">© {new Date().getFullYear()} CivicLedger. All rights reserved.</div>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
