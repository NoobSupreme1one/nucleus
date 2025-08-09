import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  MessageCircleHeart,
  ShieldCheck,
  Clock,
  Lock,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  HeartHandshake,
} from "lucide-react";

export default function MentalHealthTeenLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-indigo-50 text-gray-900">
      {/* Glow background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-violet-200 opacity-40 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-indigo-200 opacity-40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-pink-200 opacity-40 blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-black/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-bold">B</div>
            <div className="leading-tight">
              <p className="text-lg font-semibold">Bloomly</p>
              <p className="text-xs text-muted-foreground">Teen Support Chatbot</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-gray-900">Features</a>
            <a href="#safety" className="text-sm text-muted-foreground hover:text-gray-900">Safety</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-gray-900">FAQ</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-gray-900">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden md:inline-flex">Log in</Button>
            <Button className="rounded-xl">Try the demo</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="rounded-full">For ages 13–17</Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              A kind, private space to <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">talk it out</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Bloomly is a supportive chatbot designed for teens. Vent, reflect, and learn coping tools—anytime. Not a replacement for professional care.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-xl">
                <MessageCircleHeart className="mr-2 h-5 w-5" /> Start chatting free
              </Button>
              <Button size="lg" variant="secondary" className="rounded-xl">
                <Sparkles className="mr-2 h-5 w-5" /> See how it works
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>Human-reviewed prompts • No ads • Data protected</span>
            </div>
          </motion.div>

          {/* Illustrative mock UI */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <Card className="mx-auto w-full max-w-md rounded-3xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Bloomly Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500" />
                    <div className="rounded-2xl bg-violet-50 p-3 text-sm">
                      Hey! I’m here to listen. What’s on your mind today?
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="rounded-2xl bg-indigo-600 p-3 text-sm text-white">
                      Feeling stressed about finals and friends.
                    </div>
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500" />
                    <div className="rounded-2xl bg-violet-50 p-3 text-sm">
                      That sounds heavy. Want to try a 60‑second grounding exercise?
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <Button variant="secondary" className="rounded-xl justify-start">Try grounding</Button>
                    <Button variant="secondary" className="rounded-xl justify-start">Journal instead</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Trust / Press */}
      <section className="mx-auto max-w-7xl px-6 pb-6">
        <div className="flex flex-wrap items-center justify-center gap-6 opacity-70">
          <span className="text-xs uppercase tracking-widest">Student‑friendly</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs uppercase tracking-widest">COPPA‑aware design</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs uppercase tracking-widest">HIPAA‑aligned storage</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs uppercase tracking-widest">Human‑in‑the‑loop safety</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Built for support, not surveillance</h2>
          <p className="mt-3 text-muted-foreground">
            Helpful conversations, science‑backed tools, and strong privacy by default.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<MessageCircleHeart className="h-5 w-5" />}
            title="Judgment‑free chat"
            desc="Talk about school, friends, family, or anything on your mind. Bloomly responds with empathy and practical next steps."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Coping tools"
            desc="Try quick exercises like breathing, grounding, and mini‑journals that actually fit into a busy day."
          />
          <FeatureCard
            icon={<Clock className="h-5 w-5" />}
            title="24/7 availability"
            desc="Support is always on. Late night worries? Early morning jitters? Bloomly is there."
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5" />}
            title="Private by design"
            desc="We minimize data, never sell it, and give you control. Delete chats anytime from settings."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Safety first"
            desc="Crisis detection routes to resources. Content filters and human review keep conversations safe."
          />
          <FeatureCard
            icon={<HeartHandshake className="h-5 w-5" />}
            title="Guided by experts"
            desc="Developed with input from teen counselors and educators, following evidence‑informed approaches."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid items-start gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-2xl font-semibold">How Bloomly helps</h3>
            <ol className="mt-6 space-y-4">
              {[
                {
                  title: "Check in",
                  desc: "Share how you’re feeling—stress, sadness, anxious, or ‘not sure’."
                },
                {
                  title: "Get a plan",
                  desc: "Bloomly suggests a tiny next step: a 60‑second tool or a journal prompt."
                },
                {
                  title: "Keep momentum",
                  desc: "Build streaks, celebrate progress, and learn skills you can use IRL."
                }
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium">{i + 1}. {s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-2xl bg-white/70 p-4 text-sm text-muted-foreground shadow">
              <strong className="text-gray-900">Note:</strong> Bloomly is a support tool, not medical care. If you’re in crisis or thinking about self‑harm, call or text <span className="font-semibold">988</span> (U.S.) for the Suicide & Crisis Lifeline, or contact local emergency services.
            </div>
          </div>

          <Card className="rounded-3xl shadow-lg">
            <CardHeader>
              <CardTitle>Join the beta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input placeholder="First name" className="rounded-xl" />
                <Input type="email" placeholder="Email" className="rounded-xl" />
                <Button className="w-full rounded-xl">Get early access</Button>
                <p className="text-xs text-muted-foreground">
                  By continuing you agree to our Terms and acknowledge our Privacy Policy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Safety & Privacy */}
      <section id="safety" className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Privacy commitments</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>We collect the minimum data needed to run the app.</p>
              <p>We never sell personal data or show ads. Ever.</p>
              <p>You can export or delete chats anytime.</p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Parental & school options</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Opt‑in guardian summaries that protect teen privacy.</p>
              <p>FERPA‑friendly, classroom‑safe modes for educators.</p>
              <p>Clear consent and age‑appropriate experiences.</p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>When you need humans</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Resource directory for local and national supports.</p>
              <p>Crisis routing with 988 in the U.S.</p>
              <p>Paths to licensed care when appropriate.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="text-2xl font-semibold">What teens are saying</h3>
          <p className="mt-2 text-muted-foreground">Anonymous quotes from our closed beta</p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              quote: "It feels like texting a super kind friend who actually knows coping skills.",
              name: "— 16 y/o"
            },
            {
              quote: "I can vent without worrying I’m bothering someone.",
              name: "— 15 y/o"
            },
            {
              quote: "The 60‑second exercises help when I’m spiraling.",
              name: "— 17 y/o"
            }
          ].map((t, i) => (
            <Card key={i} className="rounded-3xl">
              <CardContent className="p-6 text-sm text-muted-foreground">
                “{t.quote}”
                <div className="mt-3 text-xs">{t.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="text-2xl font-semibold">FAQ</h3>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <FaqItem q="Is Bloomly therapy?" a="No. Bloomly offers supportive conversations and self‑help tools. It’s not medical advice or a substitute for therapy." />
          <FaqItem q="Is my data safe?" a="Yes. We use encryption, minimize data collection, and let you delete your chats at any time." />
          <FaqItem q="How much does it cost?" a="There’s a free plan. Bloomly+ adds extra tools and journaling features." />
          <FaqItem q="Can parents use it with teens?" a="Yes. There are optional guardian features with clear teen privacy protections." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h4 className="text-2xl font-semibold">Ready to try Bloomly?</h4>
              <p className="mt-1 text-white/80">Start with a gentle check‑in. No pressure, no judgment.</p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" className="rounded-xl bg-white text-indigo-700 hover:bg-white/90">
                Start free
              </Button>
              <Button size="lg" variant="secondary" className="rounded-xl bg-white/15 text-white hover:bg-white/20">
                Learn more
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Crisis footer bar */}
      <section id="contact" className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-2xl border bg-white p-4 text-sm shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-indigo-600" />
              <p>
                <span className="font-medium text-gray-900">Need immediate help?</span> In the U.S., call or text <span className="font-semibold">988</span> for the Suicide & Crisis Lifeline, or dial 911 for emergencies.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Outside the U.S.? Find resources via your local health services.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-4">
          <div>
            <div className="mb-2 grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-bold">B</div>
            <p className="text-sm text-muted-foreground">A kinder way to check in with yourself.</p>
          </div>
          <div>
            <p className="font-medium">Product</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Resources</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li><a href="#safety">Safety & Privacy</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#">Accessibility</a></li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Company</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li><a href="#">About</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Terms • Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Bloomly. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="p-6">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
          {icon}
        </div>
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        <p className="font-medium">{q}</p>
        <p className="mt-2 text-sm text-muted-foreground">{a}</p>
      </CardContent>
    </Card>
  );
}
