import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuditRequestError, fetchGscResult, loadDemoAudit, runLiveAudit, type AuditBundle } from '../lib/api'

type Status = 'idle' | 'loading' | 'error' | 'ready'

const SNAPSHOT_KEY = 'localseo-intelligence:audit-snapshot'

interface AuditContextValue {
  status: Status
  bundle: AuditBundle | null
  error: string | null
  runDemo: () => void
  runLive: (url: string, cities?: string[]) => Promise<void>
  reset: () => void
  // Google Search Console connection (live audits only — see gsc-*.ts)
  connectGsc: (site: string) => void
  gscError: string | null
  dismissGscError: () => void
}

const AuditContext = createContext<AuditContextValue | null>(null)

function readAndClearUrlParam(name: string): string | null {
  const params = new URLSearchParams(window.location.search)
  const value = params.get(name)
  if (value !== null) {
    params.delete(name)
    const newSearch = params.toString()
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', newUrl)
  }
  return value
}

export function AuditProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('idle')
  const [bundle, setBundle] = useState<AuditBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gscError, setGscError] = useState<string | null>(null)

  const runDemo = useCallback(() => {
    setStatus('loading')
    setError(null)
    // Simulate a brief, realistic load so the transition doesn't feel like
    // static data was just swapped in — this is purely cosmetic.
    window.setTimeout(() => {
      try {
        const result = loadDemoAudit()
        setBundle(result)
        setStatus('ready')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load demo data.')
        setStatus('error')
      }
    }, 500)
  }, [])

  const runLive = useCallback(async (url: string, cities: string[] = []) => {
    setStatus('loading')
    setError(null)
    try {
      const result = await runLiveAudit(url, cities)
      setBundle(result)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof AuditRequestError ? e.message : 'Something went wrong while auditing that site. Please try again.')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setBundle(null)
    setError(null)
    setGscError(null)
    try {
      sessionStorage.removeItem(SNAPSHOT_KEY)
    } catch {
      // sessionStorage can throw in locked-down environments — non-fatal
    }
  }, [])

  // Connecting Search Console requires a full-page redirect to Google and
  // back, which reloads the SPA. We snapshot the current in-memory audit
  // bundle into sessionStorage first so it can be restored on return,
  // instead of re-crawling the site.
  const connectGsc = useCallback(
    (site: string) => {
      if (!bundle) return
      try {
        sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(bundle))
      } catch {
        // If storage fails we still attempt the flow; worst case the user
        // returns to the landing page and re-runs the audit.
      }
      window.location.href = `/api/gsc/start?site=${encodeURIComponent(site)}`
    },
    [bundle],
  )

  const dismissGscError = useCallback(() => setGscError(null), [])

  // On first mount, check whether we're returning from the Google OAuth
  // redirect (gscResult / gscError query params) and restore state.
  useEffect(() => {
    const resultId = readAndClearUrlParam('gscResult')
    const oauthError = readAndClearUrlParam('gscError')

    if (!resultId && !oauthError) return

    let restored: AuditBundle | null = null
    try {
      const raw = sessionStorage.getItem(SNAPSHOT_KEY)
      if (raw) restored = JSON.parse(raw) as AuditBundle
      sessionStorage.removeItem(SNAPSHOT_KEY)
    } catch {
      restored = null
    }

    if (oauthError) {
      setGscError(oauthError)
      if (restored) {
        setBundle(restored)
        setStatus('ready')
      }
      return
    }

    if (resultId) {
      if (!restored) {
        setGscError('Connected to Search Console, but lost track of which audit to attach it to. Please re-run your audit and connect again.')
        return
      }
      setBundle(restored)
      setStatus('ready')
      fetchGscResult(resultId)
        .then((gscData) => {
          setBundle((prev) => (prev ? { ...prev, gscData } : prev))
        })
        .catch((e) => {
          setGscError(e instanceof Error ? e.message : 'Could not load your Search Console data.')
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({ status, bundle, error, runDemo, runLive, reset, connectGsc, gscError, dismissGscError }),
    [status, bundle, error, runDemo, runLive, reset, connectGsc, gscError, dismissGscError],
  )

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>
}

export function useAudit() {
  const ctx = useContext(AuditContext)
  if (!ctx) throw new Error('useAudit must be used within an AuditProvider')
  return ctx
}
