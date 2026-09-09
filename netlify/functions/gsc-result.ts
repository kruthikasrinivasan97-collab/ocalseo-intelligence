import { getStore } from '@netlify/blobs'
import type { GscConnectionResult } from '../../src/types'

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

/**
 * GET /api/gsc/result?id=<uuid>
 *
 * One-time read of the Search Console data fetched during the OAuth
 * callback. Deleted immediately after being read — this is a short-lived
 * handoff, not a stored account or session.
 */
export default async (req: Request) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing "id" query parameter.' }), { status: 400, headers: JSON_HEADERS })
  }

  try {
    const store = getStore('gsc-results')
    const result = await store.get(id, { type: 'json' })
    if (!result) {
      return new Response(JSON.stringify({ error: 'That result has expired or was already retrieved.' }), { status: 404, headers: JSON_HEADERS })
    }
    // Best-effort cleanup — this handoff is meant to be read exactly once.
    store.delete(id).catch(() => {})
    return new Response(JSON.stringify({ result: result as GscConnectionResult }), { status: 200, headers: JSON_HEADERS })
  } catch {
    return new Response(JSON.stringify({ error: 'Could not read Search Console data.' }), { status: 500, headers: JSON_HEADERS })
  }
}
