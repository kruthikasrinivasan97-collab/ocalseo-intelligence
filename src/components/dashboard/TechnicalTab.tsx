import { FileText, ImageIcon, Link2, Braces, Rows3, Smartphone, Gauge } from 'lucide-react'
import type { AuditBundle } from '../../lib/api'
import SectionCard from '../SectionCard'
import IssueList from '../IssueList'

export default function TechnicalTab({ bundle }: { bundle: AuditBundle }) {
  const { report } = bundle
  const t = report.technical

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Titles & Meta Descriptions" icon={<FileText className="h-4.5 w-4.5" />} subtitle="Page-level on-page SEO checks">
        <IssueList issues={[...t.titleIssues, ...t.metaDescriptionIssues]} />
      </SectionCard>

      <SectionCard title="Headings (H1)" icon={<Rows3 className="h-4.5 w-4.5" />} subtitle="Every page should have exactly one clear H1">
        <IssueList issues={t.h1Issues} />
      </SectionCard>

      <SectionCard title="Canonical & Indexability" icon={<Link2 className="h-4.5 w-4.5" />} subtitle="Duplicate-content and crawl-control checks">
        <IssueList issues={[...t.canonicalIssues, ...t.indexabilityIssues]} />
      </SectionCard>

      <SectionCard title="Image Alt Text" icon={<ImageIcon className="h-4.5 w-4.5" />} subtitle={`${t.imagesTotal - t.imagesMissingAlt} of ${t.imagesTotal} images have alt text`}>
        <IssueList issues={t.imageAltIssues} />
      </SectionCard>

      <SectionCard title="Mobile Friendliness" icon={<Smartphone className="h-4.5 w-4.5" />} subtitle="Static heuristics — viewport meta tag & responsive images">
        <IssueList issues={t.mobileIssues} />
      </SectionCard>

      <SectionCard title="Performance Signals" icon={<Gauge className="h-4.5 w-4.5" />} subtitle="Core Web Vitals proxies from static HTML — not a live Lighthouse run">
        <IssueList issues={t.performanceIssues} />
      </SectionCard>

      <SectionCard title="Broken Links" icon={<Link2 className="h-4.5 w-4.5" />} subtitle={`${t.brokenLinks.length} broken link(s) detected`}>
        {t.brokenLinks.length === 0 ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✓ No broken links found.</p>
        ) : (
          <ul className="space-y-2">
            {t.brokenLinks.slice(0, 10).map((l, idx) => (
              <li key={`${l.href}-${idx}`} className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm">
                <span className="truncate font-mono text-xs text-red-700">{l.href}</span>
                <span className="flex-none rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {l.statusCode ?? 'error'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Structured Data & Internal Linking" icon={<Braces className="h-4.5 w-4.5" />} subtitle="Schema coverage and site architecture">
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-500">Pages with schema markup</span>
              <span className="font-semibold text-slate-900">
                {t.pagesWithSchema} / {report.pagesAnalyzed} ({t.schemaCoveragePct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${t.schemaCoveragePct}%` }} />
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total internal links found</span>
            <span className="font-semibold text-slate-900">{t.internalLinkCount}</span>
          </div>
          <div>
            <p className="mb-1.5 text-sm text-slate-500">Orphan pages (no internal links pointing to them)</p>
            {t.orphanPages.length === 0 ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">✓ No orphan pages found.</p>
            ) : (
              <ul className="space-y-1">
                {t.orphanPages.slice(0, 6).map((p) => (
                  <li key={p} className="truncate rounded bg-amber-50 px-2 py-1 font-mono text-xs text-amber-700">
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
