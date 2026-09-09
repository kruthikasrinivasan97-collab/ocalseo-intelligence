import { demoBusinessProfile, demoCrawlResult, demoServiceAreaCities } from '../data/demoData'
import { runAudit } from './analyzer'
import type { AuditReport, CrawlResult, DemoBusinessProfile, GscConnectionResult } from '../types'

export interface AuditBundle {
  report: AuditReport
  crawl: CrawlResult
  demoProfile: DemoBusinessProfile | null
  // Real Search Console data, populated only if/when the user connects
  // their own account for this live audit (see AuditContext + gsc-*.ts).
  gscData: GscConnectionResult | null
}

export function loadDemoAudit(): AuditBundle {
  const report = runAudit(demoCrawlResult, 'demo', demoServiceAreaCities)
  return { report, crawl: demoCrawlResult, demoProfile: demoBusinessProfile, gscData: null }
}

export class AuditRequestError extends Error {}

/**
 * Calls the Netlify Function that performs the SSRF-guarded live crawl,
 * then runs the exact same deterministic analyzer used by Demo Mode.
 */
export async function runLiveAudit(url: string, cities: string[] = []): Promise<AuditBundle> {
  const res = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, cities }),
  })

  let payload: { crawl?: CrawlResult; error?: string; crawlErrors?: string[] }
  try {
    payload = await res.json()
  } catch {
    throw new AuditRequestError('The audit service returned an unexpected response. Please try again.')
  }

  if (!res.ok || !payload.crawl) {
    throw new AuditRequestError(payload.error || 'Could not complete the audit for that URL.')
  }

  const report = runAudit(payload.crawl, 'live', cities)
  return { report, crawl: payload.crawl, demoProfile: null, gscData: null }
}

/** Fetches the one-time Search Console result handed off after the OAuth
 * callback redirect (see netlify/functions/gsc-result.ts). */
export async function fetchGscResult(id: string): Promise<GscConnectionResult> {
  const res = await fetch(`/api/gsc/result?id=${encodeURIComponent(id)}`)
  const payload = (await res.json()) as { result?: GscConnectionResult; error?: string }
  if (!res.ok || !payload.result) {
    throw new AuditRequestError(payload.error || 'Could not load your Search Console data.')
  }
  return payload.result
}
