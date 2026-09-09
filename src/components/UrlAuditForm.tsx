import { useState, type FormEvent } from 'react'
import { Globe, Loader2, TriangleAlert } from 'lucide-react'
import { useAudit } from '../state/AuditContext'

export default function UrlAuditForm({ compact = false }: { compact?: boolean }) {
  const { runLive, status, error } = useAudit()
  const [url, setUrl] = useState('')
  const [cities, setCities] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const isLoading = status === 'loading'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    const trimmed = url.trim()
    if (!trimmed) {
      setLocalError('Enter a website URL to audit.')
      return
    }
    let normalized = trimmed
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`
    try {
      // eslint-disable-next-line no-new
      new URL(normalized)
    } catch {
      setLocalError('That doesn’t look like a valid URL.')
      return
    }
    const cityList = cities
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    void runLive(normalized, cityList)
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <label htmlFor="audit-url" className="mb-1.5 block text-sm font-medium text-slate-700">
          Website URL
        </label>
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="audit-url"
            type="text"
            inputMode="url"
            placeholder="e.g. yourbusiness.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-50"
          />
        </div>
      </div>

      {!compact && (
        <div>
          <label htmlFor="audit-cities" className="mb-1.5 block text-sm font-medium text-slate-700">
            Service-area cities <span className="font-normal text-slate-400">(optional, comma-separated)</span>
          </label>
          <input
            id="audit-cities"
            type="text"
            placeholder="e.g. Bonn, Cologne, Koblenz"
            value={cities}
            onChange={(e) => setCities(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-50"
          />
          <p className="mt-1 text-xs text-slate-400">Improves the GEO opportunity finder by comparing these cities against pages we actually find.</p>
        </div>
      )}

      {(localError || error) && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
          <span>{localError || error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Auditing…
          </>
        ) : (
          'Run Live Audit'
        )}
      </button>
      <p className="text-center text-xs text-slate-400">
        We crawl a handful of public pages only. Private, local, and internal network addresses are blocked automatically.
      </p>
    </form>
  )
}
