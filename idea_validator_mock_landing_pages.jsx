export default function MockLandingPages() {
  const ideas = [
    {
      slug: "pulsepanel",
      title: "PulsePanel",
      tagline: "Instant audience testing for early-stage ideas.",
      summary:
        "Spin up a micro‑panel of your exact ICP, ship a 3‑question test in minutes, and get signal you can trust.",
      score: 88,
      founder: { name: "Avery Kim", handle: "@averyk", initials: "AK" },
      theme: {
        gradientFrom: "from-indigo-500",
        gradientTo: "to-sky-500",
      },
      problemPoints: [
        "Early feedback is slow and biased toward friends/colleagues.",
        "Paid panels are expensive and hard to target for niche B2B.",
        "Surveys return paragraphs, not decisions you can act on.",
      ],
      features: [
        {
          name: "1‑Click Panel Builder",
          desc: "Paste your ICP (e.g., ‘seed‑stage SaaS founders in fintech’) and we source 30–100 testers that match.",
        },
        {
          name: "Decision‑Grade Questions",
          desc: "Templates that test willingness to pay, problem severity, and preferred value prop—no survey PhD needed.",
        },
        {
          name: "Signal Score™",
          desc: "Automatic weighting and de‑biasing produce a single, defensible recommendation: Build / Pivot / Drop.",
        },
        {
          name: "Recruit‑to‑Waitlist",
          desc: "Route interested respondents directly into your waitlist or demo calendar.",
        },
      ],
      steps: [
        { n: 1, t: "Describe your ICP", d: "Industry, role, company size, geo—freeform or with presets." },
        { n: 2, t: "Pick 3 questions", d: "Use proven templates for pricing, value props, and objections." },
        { n: 3, t: "Review Signal", d: "See quantified demand, top quotes, and next steps in under an hour." },
      ],
      pricing: [
        { name: "Starter", price: "$19", period: "/test", bullets: ["Up to 20 respondents", "Basic Signal Score", "CSV export"] },
        { name: "Growth", price: "$89", period: "/mo", bullets: ["Unlimited tests", "Priority recruiting", "Slack/Webhook alerts"] },
        { name: "Pro", price: "$249", period: "/mo", bullets: ["Custom ICPs", "Audience reseeding", "Analyst review"] },
      ],
      faqs: [
        {
          q: "Where do respondents come from?",
          a: "We maintain opt‑in pools sourced from professional networks and vetted communities; every respondent passes a screen for role and industry fit.",
        },
        {
          q: "Is this compliant for B2B research?",
          a: "Yes—consent and anonymization are built‑in. We provide response provenance on Pro.",
        },
      ],
    },
    {
      slug: "churnshield",
      title: "ChurnShield",
      tagline: "Predict churn before it happens—without a data team.",
      summary:
        "Drop‑in ML that flags at‑risk users and auto‑triggers the right save play in your stack.",
      score: 84,
      founder: { name: "Jordan Lee", handle: "@jordanl", initials: "JL" },
      theme: { gradientFrom: "from-emerald-500", gradientTo: "to-teal-500" },
      problemPoints: [
        "Churn creeps up and hits runway when it’s too late to react.",
        "DIY models take months and go stale without upkeep.",
        "CS teams operate on gut feel, not predictive priority lists.",
      ],
      features: [
        { name: "No‑Code Connectors", desc: "Plug into Stripe, Segment, and your DB; we learn from usage + billing + support." },
        { name: "Playbook Automations", desc: "Trigger emails, discounts, or concierge outreach in HubSpot, Braze, or Slack." },
        { name: "Explainable Risk", desc: "See which behaviors drive risk so Product knows what to fix." },
        { name: "Cohort Experiments", desc: "Run A/B saves and measure retained revenue, not just opens." },
      ],
      steps: [
        { n: 1, t: "Connect data", d: "OAuth to your sources; historical data backfills instantly." },
        { n: 2, t: "Review risk drivers", d: "We surface the top 5 factors per cohort with clear explanations." },
        { n: 3, t: "Automate saves", d: "Launch playbooks that reach the right users at the right moment." },
      ],
      pricing: [
        { name: "Indie", price: "$49", period: "/mo", bullets: ["Up to $5k MRR", "2 data sources", "1 playbook"] },
        { name: "Startup", price: "$199", period: "/mo", bullets: ["Up to $50k MRR", "Unlimited sources", "A/B testing"] },
        { name: "Scale", price: "Custom", period: "", bullets: ["Rev‑share option", "SOC2 add‑on", "Dedicated support"] },
      ],
      faqs: [
        { q: "Does it work with on‑prem data?", a: "Yes—bring your warehouse or use our secure proxy." },
        { q: "Will it spam users?", a: "No—frequency caps and guardrails are on by default." },
      ],
    },
    {
      slug: "autospec",
      title: "AutoSpec",
      tagline: "Turn a one‑line idea into a PRD, timeline, and budget—instantly.",
      summary:
        "Give AutoSpec your idea and constraints; get a crystal‑clear spec, scope, and cost you can execute today.",
      score: 91,
      founder: { name: "Riley Morgan", handle: "@rileym", initials: "RM" },
      theme: { gradientFrom: "from-fuchsia-500", gradientTo: "to-rose-500" },
      problemPoints: [
        "Founders lose weeks translating ideas into buildable tickets.",
        "Agencies over‑scope and under‑deliver without shared clarity.",
        "Roadmaps lack credible cost/time estimates early on.",
      ],
      features: [
        { name: "Executible PRDs", desc: "Structured specs with user stories, acceptance criteria, and non‑functionals." },
        { name: "Auto‑Timelines", desc: "Milestones with critical path and risk buffers tailored to solo or team velocity." },
        { name: "Cost Models", desc: "Transparent estimates by role and region; export to CSV or Notion." },
        { name: "Ticket Sync", desc: "Push to GitHub Projects, Linear, or Jira in one click." },
      ],
      steps: [
        { n: 1, t: "Paste your idea", d: "One prompt or import a doc—constraints welcome." },
        { n: 2, t: "Pick scope level", d: "MVP, MLP, or V1; we right‑size to runway." },
        { n: 3, t: "Export & build", d: "Ship to your tools and start executing today." },
      ],
      pricing: [
        { name: "Creator", price: "$0", period: "/mo", bullets: ["1 PRD / mo", "Linear export", "Email support"] },
        { name: "Team", price: "$39", period: "/mo", bullets: ["10 PRDs / mo", "All exports", "Custom templates"] },
        { name: "Studio", price: "$129", period: "/mo", bullets: ["Unlimited PRDs", "SOW generator", "Brand white‑label"] },
      ],
      faqs: [
        { q: "Will it replace PMs?", a: "No—it makes PMs faster and aligns teams around the same source of truth." },
        { q: "How accurate are estimates?", a: "We combine historical datasets with your velocity to keep ranges realistic." },
      ],
    },
  ];

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Frontpage stream header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-600" />
            <span className="font-semibold">Idea Validator</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-900 text-white">Live</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#" className="hover:text-slate-600">Leaderboard</a>
            <a href="#" className="hover:text-slate-600">How it works</a>
            <a href="#" className="hover:text-slate-600">Pricing</a>
          </nav>
          <a href="#" className="text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-900 text-white">Submit your idea</a>
        </div>
      </header>

      {/* Frontpage stream cards */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">Streaming now</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <a
              key={idea.slug}
              href={`#${idea.slug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-700">
                    {idea.founder.initials || getInitials(idea.founder.name)}
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold">{idea.founder.name}</div>
                    <div className="text-xs text-slate-500">{idea.founder.handle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Score</div>
                  <div className="text-lg font-bold">{idea.score}/100</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-slate-400 text-xs uppercase tracking-wider">Idea</div>
                <div className="mt-1 font-semibold group-hover:underline">{idea.title}</div>
                <p className="text-sm text-slate-600 mt-1">{idea.summary}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Individual landing pages */}
      {ideas.map((idea) => (
        <article id={idea.slug} key={idea.slug} className="border-t border-slate-200">
          {/* Hero */}
          <section className={`relative overflow-hidden bg-gradient-to-br ${idea.theme.gradientFrom} ${idea.theme.gradientTo} text-white`}>
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" aria-hidden>
                <defs>
                  <linearGradient id={`g-${idea.slug}`} x1="0" x2="1">
                    <stop offset="0%" stopOpacity="0.3" stopColor="#fff" />
                    <stop offset="100%" stopOpacity="0" stopColor="#fff" />
                  </linearGradient>
                </defs>
                <g fill={`url(#g-${idea.slug})`}>
                  <circle cx="100" cy="120" r="80" />
                  <circle cx="680" cy="420" r="120" />
                  <circle cx="420" cy="220" r="60" />
                </g>
              </svg>
            </div>
            <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center font-bold">
                    {idea.founder.initials || getInitials(idea.founder.name)}
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold">{idea.founder.name}</div>
                    <div className="text-sm opacity-80">{idea.founder.handle}</div>
                  </div>
                </div>
                <div className="bg-white/15 rounded-xl px-3 py-1.5">
                  <span className="text-sm">Validator Score</span>
                  <span className="ml-2 font-extrabold">{idea.score}/100</span>
                </div>
              </div>

              <div className="mt-10 max-w-3xl">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{idea.title}</h1>
                <p className="mt-4 text-lg md:text-xl/relaxed opacity-95">{idea.tagline}</p>
                <p className="mt-3 text-white/90">{idea.summary}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#" className="px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold">Start free</a>
                  <a href="#pricing" className="px-4 py-2 rounded-xl bg-white/15 ring-1 ring-white/40">See pricing</a>
                </div>
              </div>
            </div>
          </section>

          {/* Problem */}
          <section className="mx-auto max-w-7xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Why now</h2>
            <ul className="mt-6 grid md:grid-cols-3 gap-4">
              {idea.problemPoints.map((p, i) => (
                <li key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-slate-900 font-semibold">Pain #{i + 1}</div>
                  <p className="mt-1 text-slate-600">{p}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Features */}
          <section className="bg-slate-900">
            <div className="mx-auto max-w-7xl px-4 py-14 text-white">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What you get</h2>
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                {idea.features.map((f, i) => (
                  <div key={i} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
                    <div className="text-white font-semibold">{f.name}</div>
                    <p className="mt-1 text-white/80">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="mx-auto max-w-7xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">How it works</h2>
            <ol className="mt-6 grid md:grid-cols-3 gap-4">
              {idea.steps.map((s) => (
                <li key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="text-slate-400 text-xs uppercase">Step {s.n}</div>
                  <div className="font-semibold mt-1">{s.t}</div>
                  <p className="mt-1 text-slate-600">{s.d}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Pricing */}
          <section id="pricing" className="bg-slate-50 border-y border-slate-200">
            <div className="mx-auto max-w-7xl px-4 py-14">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Simple pricing</h2>
              <div className="mt-6 grid md:grid-cols-3 gap-4">
                {idea.pricing.map((tier, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col">
                    <div className="text-slate-900 font-semibold">{tier.name}</div>
                    <div className="mt-2 text-3xl font-extrabold">{tier.price}<span className="text-base font-medium text-slate-500">{tier.period}</span></div>
                    <ul className="mt-4 text-slate-600 space-y-2">
                      {tier.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <a href="#" className="mt-6 inline-flex justify-center px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold">Choose {tier.name}</a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mx-auto max-w-7xl px-4 py-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">FAQ</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              {idea.faqs.map((f, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="font-semibold">{f.q}</div>
                  <p className="mt-1 text-slate-600">{f.a}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <a href="#" className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold">Start free</a>
            </div>
          </section>

          <footer className="border-t border-slate-200">
            <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500 flex items-center justify-between">
              <div>© {new Date().getFullYear()} {idea.title}</div>
              <div className="flex gap-4">
                <a href="#" className="hover:text-slate-700">Terms</a>
                <a href="#" className="hover:text-slate-700">Privacy</a>
                <a href="#" className="hover:text-slate-700">Contact</a>
              </div>
            </div>
          </footer>
        </article>
      ))}
    </div>
  );
}
