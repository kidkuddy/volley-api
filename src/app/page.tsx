import {
  Users,
  Wifi,
  Save,
  Variable,
  ShieldCheck,
  History,
  Check,
  ArrowRight,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Workspaces & Collaboration",
    description:
      "Organize your APIs into workspaces. Invite teammates and work together in real time.",
  },
  {
    icon: Wifi,
    title: "HTTP & WebSocket",
    description:
      "Full support for REST APIs and WebSocket connections. Test any protocol with ease.",
  },
  {
    icon: Save,
    title: "Saved Payloads",
    description:
      "Save and reuse request bodies, headers, and configurations across your projects.",
  },
  {
    icon: Variable,
    title: "Environment Variables",
    description:
      "Switch between dev, staging, and production with environment-scoped variables.",
  },
  {
    icon: ShieldCheck,
    title: "Multiple Auth Profiles",
    description:
      "Store and switch between auth configurations. Bearer tokens, API keys, OAuth, and more.",
  },
  {
    icon: History,
    title: "Request History",
    description:
      "Every request is logged. Search, filter, and replay past requests instantly.",
  },
];

const comparisons = [
  "Free forever",
  "No team size limits",
  "No cloud lock-in",
  "Self-hostable",
  "Open source",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-[#FF6B35]" />
            <span className="text-xl font-bold tracking-tight">Volley</span>
          </div>
          <a
            href="/register"
            className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b]"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-16 text-center">
        {/* Gradient glow */}
        <div className="pointer-events-none absolute top-1/4 h-[500px] w-[500px] rounded-full bg-[#FF6B35]/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/5 px-4 py-1.5 text-sm text-[#FF6B35]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />
            Beta &middot; Open Source &middot; Free Forever
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            API testing,{" "}
            <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF9F6B] bg-clip-text text-transparent">
              simplified.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            The free, open-source API testing tool with no account limits, no
            cloud lock-in, and no compromises. Test HTTP and WebSocket APIs
            with workspaces, environments, and collaboration built in.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#e55a2b]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="rounded-lg border border-white/10 px-6 py-3 text-base font-medium text-white/80 transition-colors hover:border-white/20 hover:text-white"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative bg-[#111118] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to test APIs
            </h2>
            <p className="mt-4 text-white/50">
              No bloat. No paywalls. Just the tools developers actually use.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/5 bg-[#1a1a2e]/50 p-6 transition-colors hover:border-[#FF6B35]/20 hover:bg-[#1a1a2e]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B35]/10">
                  <feature.icon className="h-5 w-5 text-[#FF6B35]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/5 bg-[#111118] p-8 sm:p-12">
            <h2 className="mb-2 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Why Volley over Postman?
            </h2>
            <p className="mb-10 text-center text-white/50">
              Built for developers who want control over their tools.
            </p>

            <ul className="space-y-4">
              {comparisons.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B35]/10">
                    <Check className="h-3.5 w-3.5 text-[#FF6B35]" />
                  </div>
                  <span className="text-lg text-white/80">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 text-center">
              <a
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#e55a2b]"
              >
                Start Testing Now
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#FF6B35]" />
            <span className="font-semibold">Volley</span>
          </div>
          <p className="text-sm text-white/40">
            Built with Next.js, hosted on Vercel
          </p>
        </div>
      </footer>
    </div>
  );
}
