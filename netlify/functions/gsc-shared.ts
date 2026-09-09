// Shared helpers for the Google Search Console OAuth integration.
//
// This is entirely opt-in: a site owner clicks "Connect Search Console",
// signs in with their own Google account, and grants read-only access to
// their own verified property. Nothing here is a paid API — the Search
// Console API is free — but it does require the deploying user to create
// their own free Google Cloud OAuth client (see README). If the required
// env vars aren't set, every function below fails gracefully with a clear
// message instead of crashing.

import type { KeywordRanking, TrafficPoint } from '../../src/types'

export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const GSC_API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3'

export function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

/** Builds the public-facing origin this request came in on, so the OAuth
 * redirect_uri matches what's registered in Google Cloud Console. Prefers
 * an explicit override (useful if headers ever prove unreliable behind a
 * proxy) but works out of the box from standard forwarded headers. */
export function getPublicOrigin(req: Request): string {
  const override = process.env.PUBLIC_SITE_URL
  if (override) return override.replace(/\/$/, '')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:8888'
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export function encodeState(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url')
}

export function decodeState<T>(state: string): T | null {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf-8')) as T
  } catch {
    return null
  }
}

export function hostnameOf(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Candidate Search Console property identifiers for a given site URL,
 * covering the common verification shapes (domain property, and
 * URL-prefix properties with/without www and http/https). */
export function candidatePropertyIds(siteUrl: string): string[] {
  const host = hostnameOf(siteUrl)
  if (!host) return []
  return [
    `sc-domain:${host}`,
    `https://${host}/`,
    `https://www.${host}/`,
    `http://${host}/`,
    `http://www.${host}/`,
  ]
}

interface GscSite {
  siteUrl: string
  permissionLevel: string
}

export async function listVerifiedSites(accessToken: string): Promise<GscSite[]> {
  const res = await fetch(`${GSC_API_BASE}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const json = (await res.json()) as { siteEntry?: GscSite[] }
  return (json.siteEntry ?? []).filter((s) => s.permissionLevel !== 'siteUnverifiedUser')
}

export function matchVerifiedProperty(verifiedSites: GscSite[], auditedUrl: string): string | null {
  const candidates = candidatePropertyIds(auditedUrl)
  const verifiedUrls = new Set(verifiedSites.map((s) => s.siteUrl))
  for (const candidate of candidates) {
    if (verifiedUrls.has(candidate)) return candidate
  }
  return null
}

interface SearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

async function querySearchAnalytics(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<SearchAnalyticsRow[]> {
  const res = await fetch(`${GSC_API_BASE}/sites/${encodeURIComponent(propertyId)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return []
  const json = (await res.json()) as { rows?: SearchAnalyticsRow[] }
  return json.rows ?? []
}

// Very rough, free, deterministic keyword-intent guess — GSC doesn't
// provide intent classification, so this is a lightweight heuristic
// (identical spirit to the demo data, not a paid NLP call).
function guessIntent(keyword: string): KeywordRanking['intent'] {
  const k = keyword.toLowerCase()
  if (/near me|in [a-z]+$| in [a-z]+ /.test(k)) return 'local'
  if (/buy|price|cost|quote|hire|book|near me/.test(k)) return 'transactional'
  if (/best|top|vs|review|compare/.test(k)) return 'commercial'
  return 'informational'
}

function isoDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function fetchGscData(
  accessToken: string,
  propertyId: string,
): Promise<{ keywordRankings: KeywordRanking[]; trafficHistory: TrafficPoint[] }> {
  const startDate = isoDateDaysAgo(30)
  const endDate = isoDateDaysAgo(2) // GSC data typically lags 1-2 days

  const [queryRows, dateRows] = await Promise.all([
    querySearchAnalytics(accessToken, propertyId, {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 25,
    }),
    querySearchAnalytics(accessToken, propertyId, {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 30,
    }),
  ])

  const keywordRankings: KeywordRanking[] = queryRows
    .map((row) => ({
      keyword: row.keys[0],
      position: Math.round(row.position * 10) / 10,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      intent: guessIntent(row.keys[0]),
    }))
    .sort((a, b) => a.position - b.position)

  const trafficHistory: TrafficPoint[] = dateRows
    .map((row) => ({ date: row.keys[0], clicks: row.clicks, impressions: row.impressions }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { keywordRankings, trafficHistory }
}
