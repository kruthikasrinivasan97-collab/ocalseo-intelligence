import { MapPinned, CheckCircle2, CircleDashed } from 'lucide-react'
import type { AuditBundle } from '../../lib/api'
import SectionCard from '../SectionCard'

export default function GeoTab({ bundle }: { bundle: AuditBundle }) {
  const { report } = bundle
  const { opportunities, citiesFound, servicesFound } = report.geo
  const open = opportunities.filter((o) => !o.hasPage)
  const covered = opportunities.filter((o) => o.hasPage)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SectionCard title="Coverage Snapshot" icon={<MapPinned className="h-4.5 w-4.5" />} className="lg:col-span-1">
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-500">Cities detected on-site</p>
            <p className="mt-1 font-semibold text-slate-900">{citiesFound.length > 0 ? citiesFound.join(', ') : 'None detected'}</p>
          </div>
          <div>
            <p className="text-slate-500">Services detected on-site</p>
            <p className="mt-1 font-semibold text-slate-900">{servicesFound.length > 0 ? servicesFound.join(', ') : 'None detected'}</p>
          </div>
          <div>
            <p className="text-slate-500">GEO score</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{report.scores.geo.score}</p>
            <p className="text-xs text-slate-400">{report.scores.geo.summary}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Missing City + Service Pages"
        subtitle={`${open.length} opportunity/opportunities found`}
        className="lg:col-span-2"
      >
        {open.length === 0 ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mr-1 inline h-4 w-4" /> All detected city/service combinations have a dedicated page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3">City</th>
                  <th className="pb-2 pr-3">Service</th>
                  <th className="pb-2 pr-3">Suggested URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {open.map((o) => (
                  <tr key={`${o.city}-${o.service}`}>
                    <td className="py-2 pr-3 font-medium text-slate-800">{o.city}</td>
                    <td className="py-2 pr-3 text-slate-600">{o.service}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-indigo-600">{o.suggestedUrlSlug}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {covered.length > 0 && (
        <SectionCard title="Already Covered" icon={<CircleDashed className="h-4.5 w-4.5" />} className="lg:col-span-3">
          <div className="flex flex-wrap gap-2">
            {covered.map((o) => (
              <span key={`${o.city}-${o.service}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {o.service} · {o.city}
              </span>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
