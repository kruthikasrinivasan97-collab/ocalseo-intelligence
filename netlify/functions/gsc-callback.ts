import { getStore } from '@netlify/blobs'
import type { GscConnectionResult } from '../../src/types'
import {
  GOOGLE_TOKEN_URL,
  decodeState,
  fetchGscData,
  getOAuthConfig,
  getPublicOrigin,
  listVerifiedSites,
  matchVerifiedProperty,
} from './gsc-shared'

interface StatePayload {
  site: string
  ts: number
}

function redirectWithError(origin: string, message: string) {
  const back = new URL('/', origin)
  back.searchParams.set('gscError', message)
  return Response.redirect(back.toString(), 302)
}

/**
 * GET /api/gsc/callback — Google redirects here after the user
 * grants (or denies) Search Console access. Exchanges the auth code for an
 * access token, finds a verified property matching the audited site,
 * pulls 30 days of real keyword + traffic data, stores it briefly (single
 * read, then deleted) via Netlify Blobs, and redirects back to the app.
 */
export default async (req: Request) => {
  const url = new URL(req.url)
  const origin = getPublicOrigin(req)
  const error = url.searchParams.get('error')
  if (error) {
    return redirectWithError(origin, error === 'access_denied' ? 'Search Console access was not granted.' : `Google returned an error: ${error}`)
  }

  const code = url.searchParams.get('code')
  const stateParam = url.searchParams.get('state')
  if (!code || !stateParam) {
    return redirectWithError(origin, 'Missing authorization code from Google.')
  }

  const state = decodeState<StatePayload>(stateParam)
  if (!state?.site) {
    return redirectWithError(origin, 'Could not recover which site you were auditing — please try connecting again.')
  }

  const config = getOAuthConfig()
  if (!config) {
    return redirectWithError(origin, 'Search Console isn’t configured on this deployment (missing server credentials).')
  }

  const redirectUri = `${origin}/api/gsc/callback`

  let accessToken: string
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    if (!tokenRes.ok) {
      return redirectWithError(origin, 'Google rejected the token exchange. Double-check your OAuth client’s redirect URI matches exactly.')
    }
    const tokenJson = (await tokenRes.json()) as { access_token?: string }
    if (!tokenJson.access_token) return redirectWithError(origin, 'Google did not return an access token.')
    accessToken = tokenJson.access_token
  } catch {
    return redirectWithError(origin, 'Could not reach Google to exchange the authorization code.')
  }

  const verifiedSites = await listVerifiedSites(accessToken)
  const propertyId = matchVerifiedProperty(verifiedSites, state.site)
  if (!propertyId) {
    return redirectWithError(
      origin,
      `This Google account doesn’t have verified Search Console access to ${state.site}. Connect with the account that owns/manages that property, or verify it in Search Console first.`,
    )
  }

  const { keywordRankings, trafficHistory } = await fetchGscData(accessToken, propertyId)

  const result: GscConnectionResult = {
    siteUrl: propertyId,
    dateRange: { startDate: '', endDate: '' },
    keywordRankings,
    trafficHistory,
    fetchedAt: new Date().toISOString(),
  }

  const id = crypto.randomUUID()
  try {
    const store = getStore('gsc-results')
    await store.setJSON(id, result, { metadata: { createdAt: Date.now() } })
  } catch {
    return redirectWithError(origin, 'Fetched your Search Console data but could not hand it back to the app. Please try again.')
  }

  const back = new URL('/', origin)
  back.searchParams.set('gscResult', id)
  return Response.redirect(back.toString(), 302)
}
