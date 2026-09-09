import { useEffect, useRef, useState } from 'react'
import {
  Gauge,
  LayoutDashboard,
  Wrench,
  MapPin,
  Search,
  Bot,
  ListChecks,
  FileOutput,
  BarChart3,
  RotateCcw,
} from 'lucide-react'
import { useAudit } from '../state/AuditContext'
import { ModeBadge } from '../components/Badge'
import OverviewTab from '../components/dashboard/OverviewTab'
import TechnicalTab from '../components/dashboard/TechnicalTab'
import LocalTab from '../components/dashboard/LocalTab'
import GeoTab from '../components/dashboard/GeoTab'
import AiReadinessTab from '../components/dashboard/AiReadinessTab'
import RecommendationsTab from '../components/dashboard/RecommendationsTab'
import ReportTab from '../components/dashboard/ReportTab'
import DemoAnalyticsTab from '../components/dashboard/DemoAnalyticsTab'
import LiveGscTab from '../components/dashboard/LiveGscTab'

type TabId = 'overview' | 'technical' | 'local' | 'geo' | 'ai' | 'recommendations' | 'analytics' | 'report'

export default function DashboardPage() {
  const { bundle, reset, gscError } = useAudit()
  const [tab, setTab] = useState<TabId>('overview')
  const jumpedToGscTab = useRef(false)

  // If we just returned from the Google OAuth redirect (a result or an
  // error), jump straight to the Rankings tab so the outcome is visible
  // instead of buried behind Overview.
  useEffect(() => {
    if (jumpedToGscTab.current) return
    if (bundle?.gscData || gscError) {
      setTab('analytics')
      jumpedToGscTab.current = true
    }
  }, [bundle?.gscData, gscError])

  if (!bundle) return null
  const { report, demoProfile } = bundle

  const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'technical', label: 'Technical SEO', icon: Wrench },
    { id: 'local', label: 'Local SEO', icon: MapPin },
    { id: 'geo', label: 'GEO Opportunities', icon: Search },
    { id: 'ai', label: 'AI Readiness', icon: Bot },
    { id: 'recommendations', label: 'Recommendations', icon: ListChecks },
    { id: 'analytics', label: demoProfile ? 'Rankings & Reviews' : 'Search Console', icon: BarChart3 },
    { id: 'report', label: 'Printable Report', icon: FileOutput },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Gauge className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">LocalSEO Intelligence</p>
              <p className="max-w-[240px] truncate text-xs text-slate-400 sm:max-w-xs">{report.rootUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModeBadge mode={report.mode} />
            <div className="hidden items-baseline gap-1 sm:flex">
              <span className="text-2xl font-bold text-slate-900">{report.scores.overall}</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Audit
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
          <div className="flex gap-1 border-t border-slate-100 pt-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-medium transition ${
                  tab === t.id
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'border-b-2 border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {bundle.crawl.siteWarnings.length > 0 && (
          <div className="no-print mb-4 space-y-2">
            {bundle.crawl.siteWarnings.map((w, i) => (
              <div key={i} className="rounded-lg bg-indigo-50 px-4 py-2.5 text-xs text-indigo-700">
                {w}
              </div>
            ))}
          </div>
        )}

        {bundle.crawl.crawlErrors.length > 0 && (
          <div className="no-print mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            {bundle.crawl.truncated
              ? 'Crawl was truncated to stay within the time budget — results reflect the pages we reached. '
              : ''}
            {bundle.crawl.crawlErrors.length} note(s) during crawling — expand for details.
            <details className="mt-1">
              <summary className="cursor-pointer text-amber-800">Show details</summary>
              <ul className="mt-1 space-y-0.5">
                {bundle.crawl.crawlErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {tab === 'overview' && <OverviewTab bundle={bundle} />}
        {tab === 'technical' && <TechnicalTab bundle={bundle} />}
        {tab === 'local' && <LocalTab bundle={bundle} />}
        {tab === 'geo' && <GeoTab bundle={bundle} />}
        {tab === 'ai' && <AiReadinessTab bundle={bundle} />}
        {tab === 'recommendations' && <RecommendationsTab bundle={bundle} />}
        {tab === 'analytics' && (demoProfile ? <DemoAnalyticsTab profile={demoProfile} /> : <LiveGscTab bundle={bundle} />)}
        {tab === 'report' && <ReportTab bundle={bundle} />}
      </main>
    </div>
  )
}
