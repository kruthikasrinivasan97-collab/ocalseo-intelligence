import { useState } from 'react'
import { ListChecks } from 'lucide-react'
import type { AuditBundle } from '../../lib/api'
import SectionCard from '../SectionCard'
import { ImpactBadge } from '../Badge'

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technical',
  local: 'Local SEO',
  geo: 'GEO',
  'ai-readiness': 'AI Readiness',
}

export default function RecommendationsTab({ bundle }: { bundle: AuditBundle }) {
  const { report } = bundle
  const [filter, setFilter] = useState<string>('all')

  const categories = ['all', ...new Set(report.recommendations.map((r) => r.category))]
  const filtered = filter === 'all' ? report.recommendations : report.recommendations.filter((r) => r.category === filter)

  return (
    <SectionCard
      title="Prioritized Recommendations"
      subtitle="Sorted by impact, then by effort — highest-value quick wins first"
      icon={<ListChecks className="h-4.5 w-4.5" />}
      actions={
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === c ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c === 'all' ? 'All' : CATEGORY_LABELS[c] ?? c}
            </button>
          ))}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">No recommendations in this category — nice work!</p>
      ) : (
        <ol className="space-y-3">
          {filtered.map((rec, idx) => (
            <li key={rec.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{rec.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{rec.description}</p>
                  </div>
                </div>
                <div className="flex flex-none flex-col items-end gap-1.5">
                  <ImpactBadge impact={rec.impact} />
                  <span className="text-xs text-slate-400">{rec.effort} effort</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  )
}
