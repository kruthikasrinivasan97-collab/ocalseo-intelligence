import { MapPin, Phone, Building2, CheckCircle2, XCircle } from 'lucide-react'
import type { AuditBundle } from '../../lib/api'
import SectionCard from '../SectionCard'
import IssueList from '../IssueList'

export default function LocalTab({ bundle }: { bundle: AuditBundle }) {
  const { report } = bundle
  const { nap, locationPages, servicePages, napIssues } = report.local

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="NAP Consistency" icon={<Phone className="h-4.5 w-4.5" />} subtitle="Name, Address & Phone across the site">
        <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ background: nap.consistent ? '#ecfdf5' : '#fef2f2' }}>
          {nap.consistent ? (
            <CheckCircle2 className="h-4 w-4 flex-none text-emerald-600" />
          ) : (
            <XCircle className="h-4 w-4 flex-none text-red-600" />
          )}
          <span className={nap.consistent ? 'text-emerald-700' : 'text-red-700'}>
            {nap.consistent ? 'NAP is consistent across all detected mentions.' : 'NAP inconsistencies detected — see below.'}
          </span>
        </div>
        <div className="space-y-3 text-sm">
          <NapField label="Business name variations" values={nap.names} />
          <NapField label="Address variations" values={nap.addresses} />
          <NapField label="Phone number variations" values={nap.phones} />
          <p className="text-xs text-slate-400">{nap.mentionCount} total NAP mention(s) found across crawled pages.</p>
        </div>
      </SectionCard>

      <SectionCard title="NAP & Local Issues" icon={<MapPin className="h-4.5 w-4.5" />}>
        <IssueList issues={napIssues} emptyLabel="No local SEO issues found." />
      </SectionCard>

      <SectionCard title="Location Pages" icon={<Building2 className="h-4.5 w-4.5" />} subtitle={`${locationPages.length} dedicated location page(s) found`}>
        {locationPages.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">No dedicated location pages detected.</p>
        ) : (
          <ul className="space-y-2">
            {locationPages.map((p) => (
              <li key={p.url} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">{p.detectedCity ?? p.title}</span>
                <span className="truncate font-mono text-xs text-slate-400">{p.path}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Service Pages" icon={<Building2 className="h-4.5 w-4.5" />} subtitle={`${servicePages.length} dedicated service page(s) found`}>
        {servicePages.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">No dedicated service pages detected.</p>
        ) : (
          <ul className="space-y-2">
            {servicePages.map((p) => (
              <li key={p.url} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">{p.detectedService ?? p.title}</span>
                <span className="truncate font-mono text-xs text-slate-400">{p.path}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}

function NapField({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      {values.length === 0 ? (
        <p className="mt-0.5 text-slate-400">None detected</p>
      ) : (
        <ul className="mt-0.5 space-y-0.5">
          {values.map((v) => (
            <li key={v} className={`font-mono text-xs ${values.length > 1 ? 'text-red-600' : 'text-slate-700'}`}>
              {v}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
