import { CheckCircle2, TrendingUp, FileWarning, MapPin } from 'lucide-react'
import type { AuditBundle } from '../../lib/api'
import SectionCard from '../SectionCard'
import { ScoreGauge, MiniScoreBar } from '../ScoreGauge'
import { ScoreBreakdownChart } from '../Charts'
import { SeverityBadge } from '../Badge'

export default function OverviewTab({ bundle }: { bundle: AuditBundle }) {
  const { report } = bundle
  const critical = report.allIssues.filter((i) => i.severity === 'critical').length
  const high = report.allIssues.filter((i) => i.severity === 'high').length

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SectionCard title="SEO Health Score" subtitle={`Based on ${report.pagesAnalyzed} page(s) analyzed`} className="lg:col-span-1">
        <div className="flex flex-col items-center justify-center py-2">
          <ScoreGauge score={report.scores.overall} size={160} strokeWidth={14} />
          <p className="mt-4 text-center text-sm text-slate-500">
            Weighted across technical SEO, local signals, GEO coverage, and AI search readiness.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Score Breakdown" subtitle="How each category contributes to the overall score" className="lg:col-span-2">
        <ScoreBreakdownChart scores={report.scores} />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniScoreBar score={report.scores.technical.score} label="Technical" />
          <MiniScoreBar score={report.scores.local.score} label="Local SEO" />
          <MiniScoreBar score={report.scores.geo.score} label="GEO" />
          <MiniScoreBar score={report.scores.aiReadiness.score} label="AI Readiness" />
        </div>
      </SectionCard>

      <SectionCard title="Issue Summary" icon={<FileWarning className="h-4.5 w-4.5" />} className="lg:col-span-1">
        <div className="space-y-3">
          <StatRow label="Critical issues" value={critical} tone="critical" />
          <StatRow label="High priority" value={high} tone="high" />
          <StatRow label="Total issues found" value={report.allIssues.length} tone="medium" />
          <StatRow label="Recommendations" value={report.recommendations.length} tone="low" />
        </div>
      </SectionCard>

      <SectionCard title="Local Signals" icon={<MapPin className="h-4.5 w-4.5" />} className="lg:col-span-1">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">NAP consistent</span>
            <span className={report.local.nap.consistent ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
              {report.local.nap.consistent ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Location pages</span>
            <span className="font-semibold text-slate-900">{report.local.locationPages.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Service pages</span>
            <span className="font-semibold text-slate-900">{report.local.servicePages.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">GEO opportunities open</span>
            <span className="font-semibold text-slate-900">{report.geo.opportunities.filter((o) => !o.hasPage).length}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Top Priority Fixes" icon={<TrendingUp className="h-4.5 w-4.5" />} className="lg:col-span-1">
        {report.allIssues.length === 0 ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mr-1 inline h-4 w-4" /> No issues found — great work!
          </p>
        ) : (
          <ul className="space-y-2.5">
            {report.allIssues.slice(0, 5).map((issue) => (
              <li key={issue.id} className="flex items-start gap-2">
                <SeverityBadge severity={issue.severity} />
                <span className="text-sm text-slate-700">{issue.title}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}

function StatRow({ label, value, tone }: { label: string; value: number; tone: 'critical' | 'high' | 'medium' | 'low' }) {
  const toneClass = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-amber-600',
    low: 'text-slate-900',
  }[tone]
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`text-lg font-bold ${toneClass}`}>{value}</span>
    </div>
  )
}
