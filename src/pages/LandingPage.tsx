import {
  MapPin,
  Gauge,
  Sparkles,
  Search,
  ShieldCheck,
  BarChart3,
  FileSearch,
  Bot,
  Link2,
  ArrowRight,
} from 'lucide-react'
import { useAudit } from '../state/AuditContext'
import UrlAuditForm from '../components/UrlAuditForm'

const FEATURES = [
  {
    icon: FileSearch,
    title: 'Technical SEO Audit',
    desc: 'Titles, meta descriptions, H1s, canonical tags, indexability, broken links, and image alt coverage — checked across every crawled page.',
  },
  {
    icon: MapPin,
    title: 'Local SEO & NAP Checks',
    desc: 'Detects Name/Address/Phone mentions across your site and flags inconsistencies that hurt local pack rankings.',
  },
  {
    icon: Search,
    title: 'GEO Opportunity Finder',
    desc: 'Cross-references your service area with the pages you actually have, surfacing missing city + service landing pages.',
  },
  {
    icon: Bot,
    title: 'AI Search Readiness',
    desc: 'Scores schema coverage, heading structure, and answer-style content — the signals AI answer engines rely on to cite you.',
  },
  {
    icon: Link2,
    title: 'Internal Linking & Schema',
    desc: 'Maps internal link coverage, flags orphan pages, and detects structured data (JSON-LD) across your site.',
  },
  {
    icon: BarChart3,
    title: 'Prioritized Recommendations',
    desc: 'Every issue is scored by severity and effort so you always know what to fix first.',
  },
]

export default function LandingPage() {
  const { runDemo } = useAudit()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Gauge className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">LocalSEO Intelligence</span>
          </div>
          <a
            href="#audit"
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Start Free Audit
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                100% free · No API keys · No login
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Find out why your business isn’t ranking — <span className="text-indigo-600">locally or in AI search.</span>
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                LocalSEO Intelligence audits your technical SEO, local NAP consistency, city/service landing-page
                coverage, and readiness for AI answer engines — then tells you exactly what to fix first.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={runDemo}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                  <Sparkles className="h-4 w-4" />
                  Try Demo (Rhine Plumbing, Bonn)
                </button>
                <a
                  href="#audit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Audit My Website
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Demo Mode loads instantly with realistic sample data — no signup, no crawling, no waiting.
              </p>
            </div>

            <div id="audit" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Run a Live Audit</h2>
              <p className="mt-1 text-sm text-slate-500">Enter any public website. We’ll crawl a few pages and score it in seconds.</p>
              <div className="mt-5">
                <UrlAuditForm />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Everything a local business needs to check</h2>
              <p className="mt-3 text-slate-600">One free scan covers technical SEO, local search, and the emerging category of AI/answer-engine visibility.</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-200 p-6 transition hover:border-indigo-200 hover:shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How it works</h2>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', title: 'Enter a URL (or try the demo)', desc: 'No account, no API keys. Just a website.' },
              { step: '2', title: 'We crawl & analyze', desc: 'A sandboxed, SSRF-protected crawler checks technical, local, and AI-readiness signals.' },
              { step: '3', title: 'Get a prioritized action plan', desc: 'Every issue is scored by severity and effort, with a printable report.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-400 sm:px-6">
          <p>
            LocalSEO Intelligence is a portfolio project. It runs entirely on free, deterministic, rule-based analysis —
            no paid SEO or AI APIs. Google Search Console and Google Business Profile integrations are shown as optional
            future additions and are not required for any core feature.
          </p>
        </div>
      </footer>
    </div>
  )
}
