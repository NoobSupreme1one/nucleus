import React, { useEffect, useMemo, useState } from "react";
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
  ChefHat,
  Sparkles,
  ShoppingCart,
  Shield,
  PiggyBank,
  Users,
  Leaf,
  Calendar,
  Flame,
  Check,
  Utensils,
  Moon,
  Sun,
} from "lucide-react";

// --- Helper components ---
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
      <p className="mt-3 text-muted-foreground leading-relaxed">{subtitle}</p>
    )}
  </div>
);

const BlurDecor = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full blur-3xl opacity-30 bg-gradient-to-r from-emerald-400/40 via-sky-400/40 to-fuchsia-400/40" />
    <div className="absolute bottom-0 right-0 h-72 w-[28rem] translate-x-1/3 translate-y-1/3 rounded-full blur-3xl opacity-20 bg-gradient-to-r from-violet-400/40 via-rose-400/40 to-orange-300/40" />
  </div>
);

// --- Dark Mode Toggle ---
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

// --- Waitlist Dialog ---
function WaitlistDialog({ children }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join the early access list</DialogTitle>
          <DialogDescription>
            Be the first to try MenuMind — get priority invites and launch perks.
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div className="rounded-lg bg-emerald-500/10 p-4 text-sm">
            <p className="font-medium">You're in! 🎉</p>
            <p className="text-muted-foreground">We'll email <span className="font-mono">{email}</span> when invites go out.</p>
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
              placeholder="you@domain.com"
              className="h-11"
            />
            <Button type="submit" className="h-11">Get early access</Button>
            <p className="text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Feature Card ---
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
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

// --- Pricing Card ---
function PricingCard({ plan }) {
  return (
    <Card className={`relative border-muted/40 ${plan.popular ? "ring-2 ring-primary" : ""}`}>
      {plan.popular && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Badge className="rounded-full px-3">Most Popular</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <p className="text-muted-foreground text-sm">{plan.tagline}</p>
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
        <WaitlistDialog>
          <Button className="w-full">Start {plan.cta}</Button>
        </WaitlistDialog>
      </CardContent>
    </Card>
  );
}

// --- Sample Weekly Plan ---
function SamplePlan() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const meals = useMemo(
    () => [
      { t: "Oatmeal bowl", k: "B: ", c: 420 },
      { t: "Chicken quinoa", k: "L: ", c: 560 },
      { t: "Salmon + veg", k: "D: ", c: 610 },
      { t: "Greek yogurt", k: "B: ", c: 380 },
      { t: "Tofu stir fry", k: "D: ", c: 540 },
      { t: "Turkey wrap", k: "L: ", c: 470 },
    ],
    []
  );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {days.map((d, i) => (
        <div key={d} className="rounded-xl border bg-card p-4 text-sm shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium">{d}</span>
            <Badge variant="outline">{1800 + (i % 3) * 100} kcal</Badge>
          </div>
          <ul className="space-y-1 text-muted-foreground">
            {meals.slice(0, 3).map((m, j) => (
              <li key={j} className="truncate"><span className="text-foreground font-medium">{m.k}</span>{m.t}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// --- Main Landing ---
export default function MenuMindLanding() {
  const features = [
    { icon: Sparkles, title: "Personalized plans", desc: "Tailored menus from goals, tastes, and macros. Adapts as you log meals." },
    { icon: PiggyBank, title: "Budget‑aware shopping", desc: "Smart substitutions and seasonal picks keep your cart affordable." },
    { icon: Leaf, title: "Allergies & preferences", desc: "Gluten‑free, vegan, pescatarian, low‑FODMAP — you’re covered." },
    { icon: Users, title: "Family mode", desc: "One plan, multiple eaters. Portioning and leftovers handled automatically." },
    { icon: Flame, title: "Macro tracking", desc: "Daily macro targets with auto‑balanced recipes and quick swaps." },
    { icon: Shield, title: "Privacy first", desc: "Your data stays encrypted. Export and delete anytime." },
  ];

  const pricing = [
    {
      name: "Free",
      tagline: "Try the basics",
      price: "$0",
      cta: "free",
      popular: false,
      features: ["7‑day planner", "Basic grocery list", "Email reminders"],
    },
    {
      name: "Pro",
      tagline: "Serious meal planning",
      price: "$12",
      cta: "Pro",
      popular: true,
      features: [
        "Unlimited plans",
        "Macro & budget goals",
        "Recipe swaps & leftovers",
        "Smart grocery optimizer",
      ],
    },
    {
      name: "Family",
      tagline: "Feed the whole crew",
      price: "$19",
      cta: "Family",
      popular: false,
      features: [
        "Up to 6 profiles",
        "Portion & allergy controls",
        "Shared lists + assignments",
      ],
    },
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
                <ChefHat className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight">MenuMind</span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <WaitlistDialog>
                <Button className="hidden md:inline-flex">Get early access</Button>
              </WaitlistDialog>
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
                <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI‑powered meal planning</span>
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Eat better with plans that write themselves.
              </h1>
              <p className="text-lg text-muted-foreground">
                MenuMind crafts weekly menus and grocery lists from your goals, budget, and cravings — then adapts as your week unfolds.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <WaitlistDialog>
                  <Button size="lg" className="h-12 px-6">Start free</Button>
                </WaitlistDialog>
                <a href="#how" className="inline-flex h-12 items-center justify-center rounded-md border px-6 text-sm font-medium hover:bg-accent">
                  See how it works
                </a>
              </div>
              <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2"><Shield className="h-4 w-4" /> Privacy‑first</div>
                <div className="inline-flex items-center gap-2"><PiggyBank className="h-4 w-4" /> Save up to $62/mo</div>
                <div className="inline-flex items-center gap-2"><Flame className="h-4 w-4" /> Macro‑smart</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              {/* App preview card */}
              <div className="relative rounded-3xl border bg-card p-3 shadow-xl">
                <div className="rounded-2xl border bg-background p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-sm"><Calendar className="h-4 w-4" /> This week</div>
                    <Badge variant="secondary">1800 kcal/day</Badge>
                  </div>
                  <SamplePlan />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-accent"><Utensils className="h-4 w-4" /> Quick recipe</button>
                    <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-accent"><ShoppingCart className="h-4 w-4" /> Grocery list</button>
                  </div>
                </div>
              </div>
              {/* glow */}
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-r from-emerald-400/20 via-sky-400/20 to-fuchsia-400/20 blur-2xl" />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 md:py-24">
        <Container>
          <SectionTitle
            eyebrow="How it works"
            title="Four steps to dinner without decision fatigue"
            subtitle="MenuMind learns from your feedback every week to keep meals fresh and on‑goal."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              { icon: Sparkles, title: "Tell us your goals", desc: "Calories, macros, budget, time, and tastes." },
              { icon: ChefHat, title: "We plan", desc: "Personalized week with easy swaps and leftovers." },
              { icon: ShoppingCart, title: "We shop smart", desc: "Auto‑generated list grouped by aisle & price." },
              { icon: Utensils, title: "You cook & enjoy", desc: "Simple steps with timers and nutrition details." },
            ].map((s, i) => (
              <div key={i} className="relative rounded-2xl border bg-card p-5 shadow-sm">
                <div className="absolute -top-3 left-4 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background text-xs font-semibold">{i + 1}</div>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 md:py-24">
        <Container>
          <SectionTitle
            eyebrow="Features"
            title="Designed for real‑life eating"
            subtitle="From macro goals to picky eaters, MenuMind keeps the plan practical and delicious."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Feature key={i} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </Container>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 md:py-24">
        <Container>
          <SectionTitle
            eyebrow="Pricing"
            title="Start free, upgrade anytime"
            subtitle="Simple pricing. Cancel whenever."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pricing.map((p) => (
              <PricingCard key={p.name} plan={p} />
            ))}
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionTitle
            eyebrow="Loved by planners & procrastinators"
            title="What early users are saying"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "I finally stopped doom‑scrolling recipes every night. The leftover planning is genius.",
                author: "Mara L.",
                role: "Busy parent of 2",
              },
              {
                quote:
                  "Hit my macros without thinking about it — and my grocery bill went down.",
                author: "Alex P.",
                role: "Amateur powerlifter",
              },
              {
                quote:
                  "As a new vegan, the swap suggestions saved me hours each week.",
                author: "Jules W.",
                role: "Plant‑based beginner",
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
          <SectionTitle
            eyebrow="FAQ"
            title="You’ve got questions. We’ve got dinner."
          />
          <div className="mx-auto mt-8 max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Does MenuMind work with allergies or medical diets?</AccordionTrigger>
                <AccordionContent>
                  Yes. You can exclude ingredients, set dietary styles like gluten‑free or low‑FODMAP, and we’ll only suggest compliant recipes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can it generate a grocery list I can share?</AccordionTrigger>
                <AccordionContent>
                  Absolutely. One tap creates a shareable list grouped by store section, with estimated totals and smart substitutions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How does pricing work?</AccordionTrigger>
                <AccordionContent>
                  Start on Free. Upgrade to Pro for advanced planning and budget tools, or Family for multiple eaters and shared lists.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </Container>
      </section>

      {/* CTA STRIP */}
      <section className="py-12">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-12">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-semibold">Ready to skip the “what’s for dinner?” loop?</h3>
                <p className="mt-2 text-muted-foreground">Join the early access list and get launch perks.</p>
              </div>
              <div className="flex justify-end">
                <WaitlistDialog>
                  <Button size="lg" className="h-12 px-6">Get early access</Button>
                </WaitlistDialog>
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
              <ChefHat className="h-4 w-4" />
              <span>© {new Date().getFullYear()} MenuMind</span>
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
