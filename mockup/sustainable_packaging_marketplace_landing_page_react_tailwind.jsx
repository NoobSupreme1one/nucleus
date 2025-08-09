import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Package,
  Sparkles,
  Recycle,
  Leaf,
  Shield,
  ShieldCheck,
  Truck,
  Globe,
  DollarSign,
  ShoppingCart,
  Box,
  Check,
  Building2,
  FileCheck,
  Moon,
  Sun,
} from "lucide-react";

// ---------- Layout helpers ----------
const Container = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
);

const SectionTitle = ({ eyebrow, title, subtitle }) => (
  <div className="mx-auto max-w-3xl text-center">
    {eyebrow && (
      <div className="mb-2">
        <Badge variant="secondary" className="text-xs">{eyebrow}</Badge>
      </div>
    )}
    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
    {subtitle && (
      <p className="mt-3 leading-relaxed text-muted-foreground">{subtitle}</p>
    )}
  </div>
);

const BlurDecor = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-400/30 via-sky-400/30 to-lime-400/30 blur-3xl" />
    <div className="absolute bottom-0 right-0 h-72 w-[28rem] translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-r from-violet-400/20 via-rose-400/20 to-orange-300/20 blur-3xl" />
  </div>
);

// ---------- Dark Mode ----------
function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    if (dark) el.classList.add("dark");
    else el.classList.remove("dark");
  }, [dark]);
  return (
    <button
      aria-label="Toggle dark mode"
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {dark ? "Light" : "Dark"}
    </button>
  );
}

// ---------- Dialog ----------
function DemoDialog({ children, label = "Join the waitlist" }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a demo</DialogTitle>
          <DialogDescription>
            Be first in line for EcoPack Exchange — early access and beta pricing.
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div className="rounded-lg bg-emerald-500/10 p-4 text-sm">
            <p className="font-medium">Thanks — we'll be in touch! 🎉</p>
            <p className="text-muted-foreground">We’ll email <span className="font-mono">{email}</span> with next steps.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="flex flex-col gap-3"
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-11"
            />
            <Button type="submit" className="h-11">{label}</Button>
            <p className="text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- Feature Card ----------
function Feature({ icon: Icon, title, desc }) {
  return (
    <Card className="group border-muted/40 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}

// ---------- Product Card (Preview) ----------
function ProductCard({ name, material, certs, moq, lead }) {
  return (
    <Card className="border-muted/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="truncate">{name}</span>
          <Badge variant="outline" className="ml-2">{material}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> {certs.join(" • ")}
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="inline-flex items-center gap-1"><Box className="h-4 w-4" /> MOQ {moq}</div>
          <div className="inline-flex items-center gap-1"><Truck className="h-4 w-4" /> {lead} lead</div>
        </div>
        <div className="flex items-center justify-between">
          <DemoDialog label="Request quote">
            <Button size="sm" className="">Request quote</Button>
          </DemoDialog>
          <Button variant="outline" size="sm" className="">Details</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Mini KPI ----------
function KPI({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

// ---------- Main ----------
export default function EcoPackLanding() {
  const features = [
    { icon: ShieldCheck, title: "Verified sustainability", desc: "Suppliers validated with certifications like FSC®, BPI, and ISO 14001. Evidence stored in a compliance vault." },
    { icon: Recycle, title: "Materials that matter", desc: "Recycled paper, glass, aluminum, PLA/bioplastics, mycelium, seaweed — with real end‑of‑life guidance." },
    { icon: DollarSign, title: "Transparent MOQs & pricing", desc: "Up‑front MOQs, tiered pricing, and instant RFQs to speed up buying cycles." },
    { icon: Truck, title: "Logistics & lead times", desc: "Live lead‑time windows and freight options tuned to your region and order size." },
    { icon: FileCheck, title: "Compliance vault", desc: "Store NDAs, specs, MSDS, and certifications. Share securely with your team and auditors." },
    { icon: Sparkles, title: "Custom printing", desc: "Upload dielines, pick inks/finishes, and preview with AI render mocks." },
  ];

  const products = useMemo(
    () => [
      { name: "Recycled Kraft Mailers", material: "Recycled paper", certs: ["FSC®", "Recyclable"], moq: "500", lead: "2–3 wks" },
      { name: "Compostable Poly Bags", material: "PLA/bioplastic", certs: ["BPI", "OK compost"], moq: "2000", lead: "3–5 wks" },
      { name: "Glass Jars w/ Metal Lids", material: "Glass + Alu", certs: ["Reusable", "Widely recyclable"], moq: "1000", lead: "1–2 wks" },
      { name: "Molded Pulp Inserts", material: "Molded fiber", certs: ["Recycled", "Curbside"], moq: "1000", lead: "2–4 wks" },
    ],
    []
  );

  const categories = [
    { label: "Mailers", icon: Package },
    { label: "Boxes", icon: Box },
    { label: "Jars & Bottles", icon: Package },
    { label: "Pouches", icon: Package },
    { label: "Labels", icon: Package },
    { label: "Tapes & Fillers", icon: Package },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <BlurDecor />

      {/* NAV */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container>
          <nav className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight">EcoPack Exchange</span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
              <a href="#catalog" className="text-sm text-muted-foreground hover:text-foreground">Catalog</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DemoDialog>
                <Button className="hidden md:inline-flex">Request demo</Button>
              </DemoDialog>
            </div>
          </nav>
        </Container>
      </header>

      {/* HERO */}
      <section className="relative">
        <Container>
          <div className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <span className="inline-flex items-center gap-2"><Recycle className="h-4 w-4" /> Sustainable packaging marketplace</span>
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Source eco‑friendly packaging from verified suppliers.
              </h1>
              <p className="text-lg text-muted-foreground">
                Compare certified materials, get instant RFQs, and track carbon impact — all in one place.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <DemoDialog>
                  <Button size="lg" className="h-12 px-6">Get started</Button>
                </DemoDialog>
                <a href="#catalog" className="inline-flex h-12 items-center justify-center rounded-md border px-6 text-sm font-medium hover:bg-accent">
                  Explore categories
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2"><Shield className="h-4 w-4" /> Compliance vault</div>
                <div className="inline-flex items-center gap-2"><Globe className="h-4 w-4" /> Global suppliers</div>
                <div className="inline-flex items-center gap-2"><DollarSign className="h-4 w-4" /> Transparent MOQs</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              {/* Marketplace preview */}
              <div className="relative rounded-3xl border bg-card p-3 shadow-xl">
                <div className="rounded-2xl border bg-background p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-sm"><ShoppingCart className="h-4 w-4" /> Featured products</div>
                    <div className="flex gap-2">
                      {['FSC®', 'BPI', 'Recyclable'].map((t) => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {products.map((p) => (
                      <ProductCard key={p.name} {...p} />
                    ))}
                  </div>
                </div>
              </div>
              {/* glow */}
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-r from-emerald-400/20 via-sky-400/20 to-lime-400/20 blur-2xl" />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 md:py-24">
        <Container>
          <SectionTitle
            eyebrow="How it works"
            title="From RFQ to received — faster"
            subtitle="Purpose‑built flows for buyers and suppliers to reduce back‑and‑forth."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">For buyers</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Sparkles, title: "Post an RFQ", desc: "Specs, certifications, MOQs, target price, and timeline." },
                  { icon: Building2, title: "Match & compare", desc: "See compatible suppliers with pricing and lead times." },
                  { icon: Package, title: "Samples & chat", desc: "Request samples, discuss dielines, and finalize details." },
                  { icon: FileCheck, title: "Order & track", desc: "Place orders securely and track logistics in one view." },
                ].map((s, i) => (
                  <div key={i} className="relative rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-semibold">{s.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">For suppliers</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Box, title: "List your catalog", desc: "Upload SKUs, finishes, MOQs, and regional pricing." },
                  { icon: ShieldCheck, title: "Qualify & certify", desc: "Add certifications and documents to win trust." },
                  { icon: ShoppingCart, title: "Receive RFQs", desc: "Get matched RFQs with clear specs and deadlines." },
                  { icon: DollarSign, title: "Fulfill & get paid", desc: "Streamlined payouts and invoice tracking." },
                ].map((s, i) => (
                  <div key={i} className="relative rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-semibold">{s.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 md:py-24">
        <Container>
          <SectionTitle
            eyebrow="Features"
            title="Built for sustainable procurement"
            subtitle="All the tooling you need to buy better and build resilient supplier relationships."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Feature key={i} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </Container>
      </section>

      {/* CATEGORIES */}
      <section id="catalog" className="py-16 md:py-24">
        <Container>
          <SectionTitle
            eyebrow="Catalog"
            title="Browse by category"
            subtitle="From mailers to molded pulp, find lower‑impact options for every product line."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {categories.map((c) => (
              <div key={c.label} className="group rounded-2xl border bg-card p-5 text-center shadow-sm transition-colors hover:bg-accent">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15">
                  <c.icon className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Snapshot KPIs */}
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <KPI icon={Building2} label="Pre‑vetted suppliers" value="120+" />
            <KPI icon={Recycle} label="Estimated CO₂ saved" value="1.8k t" />
            <KPI icon={Truck} label="Orders fulfilled" value="9,400+" />
          </div>
        </Container>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 md:py-24">
        <Container>
          <SectionTitle
            eyebrow="Pricing"
            title="Simple plans for buyers and suppliers"
            subtitle="No listing fees during beta. Transaction fee applies to processed orders."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[{
              name: "Browse",
              tagline: "For evaluating options",
              price: "$0",
              features: ["Search & compare", "Save suppliers", "Download spec sheets"],
              cta: "Create free account",
            }, {
              name: "Buyer Pro",
              tagline: "Advanced sourcing tools",
              price: "$49",
              features: ["Unlimited RFQs", "Compliance vault", "Team spaces & approvals"],
              cta: "Start Pro",
            }, {
              name: "Supplier",
              tagline: "Sell on EcoPack Exchange",
              price: "$99",
              features: ["Catalog & pricing", "Lead gen & RFQs", "Bulk quotes & analytics"],
              cta: "Apply as supplier",
            }].map((plan, idx) => (
              <Card key={idx} className="relative border-muted/40">
                {idx === 1 && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <Badge className="rounded-full px-3">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <DemoDialog>
                    <Button className="w-full">{plan.cta}</Button>
                  </DemoDialog>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Beta transaction fee: 3% per processed order.</p>
        </Container>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionTitle
            eyebrow="Trusted by modern brands"
            title="What early users are saying"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "We switched 70% of our mailers to recycled paper without increasing costs.",
                author: "Nora K.",
                role: "Ops lead, apparel",
              },
              {
                quote: "The compliance vault saved us a week during retailer onboarding.",
                author: "Diego R.",
                role: "Supply chain manager",
              },
              {
                quote: "RFQs are clear and fast — fewer emails, more POs.",
                author: "Sam T.",
                role: "Packaging supplier",
              },
            ].map((t, i) => (
              <Card key={i} className="border-muted/40">
                <CardContent className="p-6">
                  <p className="text-base leading-relaxed">“{t.quote}”</p>
                  <div className="mt-4 text-sm text-muted-foreground">{t.author} — {t.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="pb-20 md:pb-28">
        <Container>
          <SectionTitle eyebrow="FAQ" title="Questions, answered" />
          <div className="mx-auto mt-8 max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do you verify sustainability claims?</AccordionTrigger>
                <AccordionContent>
                  We review third‑party certifications (e.g., FSC®, BPI), require documentation, and surface end‑of‑life guidance. Suppliers renew documents on a schedule.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I buy internationally?</AccordionTrigger>
                <AccordionContent>
                  Yes. Filter by region and lead time, then choose freight options. Duties/taxes are estimated at checkout when available.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What about MOQs and custom printing?</AccordionTrigger>
                <AccordionContent>
                  Each listing shows MOQs and finishing options. Submit dielines with RFQs for custom art, inks, and finishes.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </Container>
      </section>

      {/* CTA STRIP */}
      <section className="pb-12">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-12">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-semibold">Ready to modernize your packaging supply chain?</h3>
                <p className="mt-2 text-muted-foreground">Join the EcoPack Exchange beta and get early pricing.</p>
              </div>
              <div className="flex justify-end">
                <DemoDialog>
                  <Button size="lg" className="h-12 px-6">Request demo</Button>
                </DemoDialog>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-10 text-sm">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Leaf className="h-4 w-4" />
              <span>© {new Date().getFullYear()} EcoPack Exchange</span>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground">
              <a className="hover:text-foreground" href="#">Privacy</a>
              <a className="hover:text-foreground" href="#">Terms</a>
              <a className="hover:text-foreground" href="#">Contact</a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
