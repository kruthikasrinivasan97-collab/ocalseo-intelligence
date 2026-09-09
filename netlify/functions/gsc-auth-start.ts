import { GOOGLE_AUTH_URL, GSC_SCOPE, encodeState, getOAuthConfig, getPublicOrigin } from './gsc-shared'

/**
 * GET /api/gsc/start?site=<url-being-audited>
 *
 * Kicks off Google's OAuth consent flow for read-only Search Console
 * access. The site owner is redirected to Google, asked to sign in and
 * grant access, then sent back to /api/gsc/callback. Nothing here touches
 * a paid API, and no credentials are stored server-side beyond the
 * lifetime of this single request/response.
 */
export default async (req: Request) => {
  const url = new URL(req.url)
  const site = url.searchParams.get('site')
  if (!site) {
    return new Response('Missing "site" query parameter.', { status: 400 })
  }

  const config = getOAuthConfig()
  if (!config) {
    const origin = getPublicOrigin(req)
    const back = new URL('/', origin)
    back.searchParams.set(
      'gscError',
      'Search Console isn’t configured on this deployment yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your Netlify site’s environment variables (see README).',
    )
    return Response.redirect(back.toString(), 302)
  }

  const origin = getPublicOrigin(req)
  const redirectUri = `${origin}/api/gsc/callback`
  const state = encodeState({ site, ts: Date.now() })

  const authUrl = new URL(GOOGLE_AUTH_URL)
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', GSC_SCOPE)
  authUrl.searchParams.set('access_type', 'online')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', state)

  return Response.redirect(authUrl.toString(), 302)
}
