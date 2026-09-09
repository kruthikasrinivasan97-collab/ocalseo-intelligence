import { BarChart3, TriangleAlert, ExternalLink } from 'lucide-react'
import type { AuditBundle } from '../../lib/api'
import { useAudit } from '../../state/AuditContext'
import SectionCard from '../SectionCard'
import KeywordTable from '../KeywordTable'
import { TrafficChart, KeywordPositionChart } from '../Charts'

export default function LiveGscTab({ bundle }: { bundle: AuditBundle }) {
  const { connectGsc, gscError, dismissGscError, status } = useAudit()
  const { gscData } = bundle

  if (!gscData) {
    return (
      <div className="mx-auto max-w-xl">
        {gscError && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
            <div className="flex-1">
              <p>{gscError}</p>
              <button onClick={dismissGscError} className="mt-1 text-xs font-semibold text-red-800 underline">
                Dismiss
              </button>
            </div>
          </div>
        )}
        <SectionCard title="Connect Google Search Console" icon={<BarChart3 className="h-4.5 w-4.5" />} subtitle="See real keyword rankings, clicks, impressions, and traffic for this site">
          <p className="text-sm text-slate-600">
            This app doesn’t depend on Search Console for the core audit — everything in the other tabs comes from
            crawling the site directly. But if you own or manage <strong>{bundle.report.rootUrl}</strong> in Google
            Search Console, you can connect it to pull real ranking and traffic data (free, read-only, revocable
            anytime from your Google Account).
          </p>
          <button
            onClick={() => connectGsc(bundle.report.rootUrl)}
            disabled={status === 'loading'}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            Connect Search Console
            <ExternalLink className="h-4 w-4" />
          </button>
          <p className="mt-3 text-xs text-slate-400">
            You’ll be redirected to Google to sign in and grant read-only access, then brought straight back here. No
            data is stored after this session ends.
          </p>
        </SectionCard>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-lg bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700 lg:col-span-3">
        Showing real data from Google Search Console for <strong>{gscData.siteUrl}</strong>, last 30 days (fetched{' '}
        {new Date(gscData.fetchedAt).toLocaleString()}). Reviews and Business Profile details aren’t included — the
        Google Business Profile API requires separate manual approval from Google and isn’t connected in this app.
      </div>

      <SectionCard title="Search Traffic (Last 30 Days)" subtitle="Real clicks & impressions from Search Console" className="lg:col-span-2">
        <TrafficChart data={gscData.trafficHistory} />
      </SectionCard>

      <SectionCard title="Top Keywords" subtitle="By average position" className="lg:col-span-1">
        <KeywordPositionChart data={gscData.keywordRankings} />
      </SectionCard>

      <SectionCard title="All Tracked Keywords" subtitle="Real Search Console data — position, clicks, impressions & CTR" className="lg:col-span-3">
        {gscData.keywordRankings.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No query data was returned for the last 30 days — this can happen for low-traffic sites or newly verified properties.
          </p>
        ) : (
          <KeywordTable rows={gscData.keywordRankings} />
        )}
      </SectionCard>
    </div>
  )
}
