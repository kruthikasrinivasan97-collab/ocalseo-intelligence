import type { Context } from '@netlify/functions'
import { crawlSite } from './crawler'
import { SsrfError } from './ssrf'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: JSON_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405)
  }

  let body: { url?: string; cities?: string[] }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400)
  }

  const targetUrl = (body.url || '').trim()
  if (!targetUrl) {
    return json({ error: 'A "url" field is required.' }, 400)
  }
  if (targetUrl.length > 2048) {
    return json({ error: 'URL is too long.' }, 400)
  }

  const knownCities = Array.isArray(body.cities) ? body.cities.filter((c) => typeof c === 'string').slice(0, 25) : []

  try {
    const crawl = await crawlSite(targetUrl, { knownCities })
    if (crawl.pages.length === 0) {
      return json(
        {
          error: 'Could not retrieve any pages from that URL. Double check it is publicly reachable and returns HTML.',
          crawlErrors: crawl.crawlErrors,
        },
        502,
      )
    }
    return json({ crawl })
  } catch (err) {
    if (err instanceof SsrfError) {
      return json({ error: err.message }, 400)
    }
    // eslint-disable-next-line no-console
    console.error('audit function error', err)
    return json({ error: 'Unexpected error while auditing that site. Please try again.' }, 500)
  }
}
