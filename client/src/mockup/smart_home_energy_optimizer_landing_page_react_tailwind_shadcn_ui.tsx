// @ts-nocheck
import React from "react"
import { motion } from "framer-motion"
import {
  Bolt,
  Zap,
  Gauge,
  Shield,
  Sun,
  CalendarClock,
  PlugZap,
  Wallet,
  Home,
  Building2,
  LineChart as LineChartIcon,
  Sparkles,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

const usageData = [
  { name: "Mon", current: 34, optimized: 27 },
  { name: "Tue", current: 31, optimized: 25 },
  { name: "Wed", current: 36, optimized: 28 },
  { name: "Thu", current: 33, optimized: 26 },
  { name: "Fri", current: 38, optimized: 29 },
  { name: "Sat", current: 29, optimized: 22 },
  { name: "Sun", current: 30, optimized: 23 },
]

const Feature = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any
  title: string
  description: string
}) => (
  <Card className="group relative overflow-hidden border-0 bg-gradient-to-b from-background to-muted/50 shadow-sm transition hover:shadow-md">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
      <CardDescription className="pt-2 text-base leading-relaxed text-muted-foreground">
        {description}
      </CardDescription>
    </CardHeader>
    <motion.div
      className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 6, repeat: Infinity }}
    />
  </Card>
)

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border bg-background/60 p-4 text-center">
    <div className="text-2xl font-semibold tracking-tight">{value}</div>
    <div className="mt-1 text-xs text-muted-foreground">{label}</div>
  </div>
)

const PriceItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 text-sm">
    <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
    <span className="text-muted-foreground">{children}</span>
  </div>
)

export default function LandingPage() {
  const [kwh, setKwh] = React.useState<number>(800) // est. monthly usage
  const [rate, setRate] = React.useState<number>(0.28) // $/kWh
  const formatter = React.useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  )

  const baseline = kwh * rate
  const savingsPct = 0.23 // conservative default; varies by home & utility plan
  const savings = baseline * savingsPct
  const optimized = Math.max(0, baseline - savings)

  return (
    <div className="relative min-h-screen scroll-smooth bg-gradient-to-b from-background via-background to-background">
      {/* Glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[20%] h-60 w-60 rounded-full bg-muted/40 blur-2xl" />
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
              <Bolt className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">WattWise</span>
            <Badge variant="secondary" className="ml-2 rounded-full">Smart Home Energy</Badge>
          </a>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <a href="#pricing">Sign in</a>
            </Button>
            <Button asChild>
              <a href="#pricing">Start free</a>
            </Button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <main>
        <section className="relative">
          <div className="container mx-auto grid min-h-[70vh] grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2">
            <div>
              <Badge className="mb-4 rounded-full" variant="secondary">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> AI‑powered optimization
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
                Cut your power bill by <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">up to 30%</span> with smart scheduling
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
                WattWise learns your routines, shifts heavy loads to off‑peak hours, and squeezes more from solar—automatically. No spreadsheets. No guesswork.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <a href="#pricing">Start 14‑day free trial</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#demo">See live demo</a>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Works with:</span>
                <Badge variant="outline" className="rounded-full">Nest</Badge>
                <Badge variant="outline" className="rounded-full">Ecobee</Badge>
                <Badge variant="outline" className="rounded-full">Hue</Badge>
                <Badge variant="outline" className="rounded-full">Tesla Wall Connector</Badge>
                <Badge variant="outline" className="rounded-full">HomeKit</Badge>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
                <Stat label="Avg. monthly savings" value={formatter.format(savings)} />
                <Stat label="Carbon reduced" value={`${Math.round((savings / (rate || 0.01)) * 0.92)} lb`} />
                <Stat label="Payback period" value={`~${Math.max(1, Math.round(120 / (savings || 1)))} mo`} />
              </div>
            </div>

            <Card id="demo" className="relative overflow-hidden border-0 bg-gradient-to-b from-muted/50 to-background shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <LineChartIcon className="h-5 w-5 text-primary" />
                    Real‑time usage
                  </CardTitle>
                  <Badge variant="outline" className="rounded-full">Preview</Badge>
                </div>
                <CardDescription>See how optimization flattens your daily load curve.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="current" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="optimized" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border p-3 text-center">
                    <div className="text-xs text-muted-foreground">Baseline (est.)</div>
                    <div className="text-lg font-semibold">{formatter.format(baseline)}</div>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <div className="text-xs text-muted-foreground">Savings (est.)</div>
                    <div className="text-lg font-semibold text-primary">{formatter.format(savings)}</div>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <div className="text-xs text-muted-foreground">Optimized bill</div>
                    <div className="text-lg font-semibold">{formatter.format(optimized)}</div>
                  </div>
                </div>
                <Separator className="my-4" />
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="grid grid-cols-1 gap-3 md:grid-cols-3"
                  aria-label="Savings calculator"
                >
                  <div>
                    <Label htmlFor="kwh">Monthly usage (kWh)</Label>
                    <Input
                      id="kwh"
                      type="number"
                      inputMode="decimal"
                      value={kwh}
                      min={0}
                      onChange={(e) => setKwh(parseFloat(e.target.value || "0"))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate">Rate ($/kWh)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={rate}
                      min={0}
                      onChange={(e) => setRate(parseFloat(e.target.value || "0"))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" type="submit">Recalculate</Button>
                  </div>
                </form>
                <p className="mt-2 text-xs text-muted-foreground">
                  *Estimates. Actual savings vary by home size, devices, climate, and utility tariff.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything you need to save—automatically</h2>
            <p className="mt-3 text-muted-foreground">
              Powerful optimization with a light touch. You stay in control while WattWise does the heavy lifting.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={Gauge}
              title="Real‑time insights"
              description="Live usage, peak alerts, and appliance‑level breakdowns so you always know what's driving the bill."
            />
            <Feature
              icon={CalendarClock}
              title="AI scheduling"
              description="Automatically shifts EV charging, laundry, and HVAC to off‑peak windows without sacrificing comfort."
            />
            <Feature
              icon={Sun}
              title="Solar‑aware"
              description="Prefers self‑consumption when your panels are producing and ramps down when the sun sets."
            />
            <Feature
              icon={PlugZap}
              title="Works with your gear"
              description="Connect smart plugs, thermostats, EVSEs, and batteries in minutes—no hub required."
            />
            <Feature
              icon={Wallet}
              title="Rate‑plan optimizer"
              description="Understands TOU tiers and demand charges to minimize costs across utilities."
            />
            <Feature
              icon={Shield}
              title="Privacy built‑in"
              description="Local processing options, granular permissions, and end‑to‑end encryption for peace of mind."
            />
          </div>
        </section>

        {/* AUDIENCES TABS */}
        <section className="container mx-auto px-4 py-16">
          <Tabs defaultValue="homeowners" className="w-full">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">Built for your home—at any scale</h3>
                <p className="mt-2 text-muted-foreground">Choose a profile to see what WattWise optimizes for you.</p>
              </div>
              <TabsList>
                <TabsTrigger value="homeowners" className="gap-2"><Home className="h-4 w-4" /> Homeowners</TabsTrigger>
                <TabsTrigger value="renters" className="gap-2"><Zap className="h-4 w-4" /> Renters</TabsTrigger>
                <TabsTrigger value="pm" className="gap-2"><Building2 className="h-4 w-4" /> Property Mgmt</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="homeowners" className="mt-6">
              <Card>
                <CardContent className="grid gap-6 p-6 md:grid-cols-3">
                  <div>
                    <h4 className="font-semibold">What you get</h4>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>• Whole‑home load shifting</li>
                      <li>• Solar + battery coordination</li>
                      <li>• EV charge time optimizer</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Why it matters</h4>
                    <p className="mt-3 text-sm text-muted-foreground">Reduce peak demand fees and make the most of your generation.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Typical savings</h4>
                    <p className="mt-3 text-sm text-muted-foreground">15–35% off typical bills, depending on tariff.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="renters" className="mt-6">
              <Card>
                <CardContent className="grid gap-6 p-6 md:grid-cols-3">
                  <div>
                    <h4 className="font-semibold">What you get</h4>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>• Room‑level control with smart plugs</li>
                      <li>• Comfort‑aware thermostat tuning</li>
                      <li>• Bill‑tracking and reminders</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Why it matters</h4>
                    <p className="mt-3 text-sm text-muted-foreground">Save without renovations or landlord approvals.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Typical savings</h4>
                    <p className="mt-3 text-sm text-muted-foreground">8–20% with basic smart devices.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pm" className="mt-6">
              <Card>
                <CardContent className="grid gap-6 p-6 md:grid-cols-3">
                  <div>
                    <h4 className="font-semibold">What you get</h4>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>• Portfolio‑wide dashboards</li>
                      <li>• Automated demand response</li>
                      <li>• Tenant engagement tools</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Why it matters</h4>
                    <p className="mt-3 text-sm text-muted-foreground">Lower OPEX and hit ESG targets across buildings.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Typical savings</h4>
                    <p className="mt-3 text-sm text-muted-foreground">10–25% per unit; more with DR incentives.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Three steps to lower bills</h2>
            <p className="mt-3 text-muted-foreground">From setup to savings in under 10 minutes.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Feature
              icon={PlugZap}
              title="Connect devices"
              description="Link thermostats, plugs, EV chargers, and solar in a few taps."
            />
            <Feature
              icon={Zap}
              title="Train preferences"
              description="Tell WattWise your comfort ranges and schedule once—done."
            />
            <Feature
              icon={Gauge}
              title="Watch it optimize"
              description="See loads shift off‑peak and your projected bill drop in real time."
            />
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Simple pricing, real savings</h2>
            <p className="mt-3 text-muted-foreground">Start free. Cancel anytime.</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="relative">
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full">Starter</Badge>
                <CardTitle className="text-3xl">$0</CardTitle>
                <CardDescription>For monitoring and basic alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PriceItem>Real‑time dashboard</PriceItem>
                <PriceItem>2 connected devices</PriceItem>
                <PriceItem>Email alerts</PriceItem>
                <Button className="mt-4 w-full" variant="outline">Get started</Button>
              </CardContent>
            </Card>

            <Card className="relative border-primary">
              <motion.div
                className="absolute right-4 top-4"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="rounded-full">Most popular</Badge>
              </motion.div>
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full">Pro</Badge>
                <div className="flex items-baseline gap-2">
                  <CardTitle className="text-3xl">$12</CardTitle>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <CardDescription>Best for most homes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PriceItem>Unlimited devices</PriceItem>
                <PriceItem>AI scheduling & TOU optimizer</PriceItem>
                <PriceItem>Solar + battery coordination</PriceItem>
                <PriceItem>Drift‑free comfort guardrails</PriceItem>
                <Button className="mt-4 w-full">Start free trial</Button>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full">Home Plus</Badge>
                <div className="flex items-baseline gap-2">
                  <CardTitle className="text-3xl">$24</CardTitle>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <CardDescription>For power users & portfolios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PriceItem>DR & utility incentives</PriceItem>
                <PriceItem>Portfolio dashboards</PriceItem>
                <PriceItem>Advanced automations</PriceItem>
                <Button className="mt-4 w-full" variant="outline">Contact sales</Button>
              </CardContent>
            </Card>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">All plans include bank‑grade encryption and device‑level permissions.</p>
        </section>

        {/* TESTIMONIALS */}
        <section className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Loved by efficient homes</h2>
            <p className="mt-3 text-muted-foreground">Real results from early adopters.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {["We shaved 27% off within the first month.", "Finally a set‑and‑forget way to charge the EV.", "Feels like cheating the bill—legally."].map((quote, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <p className="text-balance text-sm text-muted-foreground">“{quote}”</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted" />
                    <div>
                      <div className="text-sm font-medium">Alex R.</div>
                      <div className="text-xs text-muted-foreground">Oakland, CA</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container mx-auto px-4 pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">FAQs</h2>
            <p className="mt-3 text-muted-foreground">Everything else you might be wondering.</p>
          </div>
          <div className="mx-auto mt-8 max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How does WattWise actually reduce my bill?</AccordionTrigger>
                <AccordionContent>
                  We analyze your device usage and utility tariff to shift energy‑hungry tasks to cheaper hours while staying within your comfort preferences.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Will it work if I rent or don’t have solar?</AccordionTrigger>
                <AccordionContent>
                  Yes. You’ll still see meaningful savings using smart plugs, a connected thermostat, or scheduling appliances. Solar and batteries amplify results.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is my data private and secure?</AccordionTrigger>
                <AccordionContent>
                  Absolutely. We support local processing, anonymization, and encrypted connections. You control which devices are connected and can revoke anytime.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t bg-background/80">
        <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                <Bolt className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold tracking-tight">WattWise</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Smarter energy for every home.</p>
          </div>
          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#how" className="hover:text-foreground">How it works</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Blog</a></li>
              <li><a href="#" className="hover:text-foreground">Careers</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Get updates</div>
            <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input type="email" placeholder="you@example.com" aria-label="Email" />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
        <div className="border-t py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} WattWise. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
