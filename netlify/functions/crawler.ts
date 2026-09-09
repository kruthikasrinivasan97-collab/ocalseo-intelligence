import { parse, HTMLElement } from 'node-html-parser'
import type {
  CrawlResult,
  HeadingOutline,
  ImageInfo,
  LinkInfo,
  NapMention,
  PageData,
  SchemaBlock,
} from '../../src/types'
import { assertSafePublicUrl, SsrfError } from './ssrf'

const MAX_PAGES = 6
const FETCH_TIMEOUT_MS = 4500
const GLOBAL_BUDGET_MS = 9000
const MAX_BODY_BYTES = 2_000_000
const LINK_CHECK_LIMIT = 8
const ROBOTS_SITEMAP_TIMEOUT_MS = 2500
const MAX_SITEMAP_URLS = 40

// Paths that strongly suggest a page worth prioritizing within our small
// per-crawl page budget — location/service/contact pages are exactly what
// the Local SEO and GEO analyzers care about most.
const PRIORITY_PATH_PATTERN = /location|service|contact|area|about|city/i

const SERVICE_KEYWORDS = [
  'plumbing',
  'plumber',
  'drain cleaning',
  'boiler repair',
  'heating repair',
  'bathroom remodeling',
  'emergency plumbing',
  'water heater',
  'leak detection',
  'pipe repair',
  'installation',
  'repair',
  'maintenance',
  'consulting',
  'cleaning',
  'inspection',
  'remodeling',
  'hvac',
  'roofing',
  'landscaping',
  'electrician',
  'towing',
  'moving',
  'painting',
]

async function fetchWithTimeout(url: string, ms: number, deadline: number): Promise<Response | null> {
  const remaining = deadline - Date.now()
  const timeout = Math.max(500, Math.min(ms, remaining))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'LocalSEOIntelligenceBot/1.0 (+https://localseo-intelligence.netlify.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    return res
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function readBodyCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return await res.text()
  const decoder = new TextDecoder()
  let received = 0
  let out = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > MAX_BODY_BYTES) break
    out += decoder.decode(value, { stream: true })
  }
  return out
}

function absoluteUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

function detectCity(text: string, path: string, knownCities: string[]): string | null {
  const haystack = `${path} ${text}`.toLowerCase()
  for (const city of knownCities) {
    if (haystack.includes(city.toLowerCase())) return city
  }
  return null
}

function detectService(text: string, path: string): string | null {
  const haystack = `${path} ${text}`.toLowerCase()
  for (const kw of SERVICE_KEYWORDS) {
    if (haystack.includes(kw)) {
      return kw.replace(/\b\w/g, (c) => c.toUpperCase())
    }
  }
  return null
}

function classifyPageType(path: string, title: string): PageData['pageType'] {
  const p = path.toLowerCase()
  const t = title.toLowerCase()
  if (p === '/' || p === '') return 'home'
  if (/location|areas?-we-serve|service-area/.test(p)) return 'location'
  if (/service|services/.test(p)) return 'service'
  if (/contact/.test(p) || /contact/.test(t)) return 'contact'
  if (/blog|news|article/.test(p)) return 'blog'
  return 'other'
}

const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/g
const ADDRESS_HINT_REGEX = /\d{1,5}\s+[A-Za-z0-9.\s]+,\s*[A-Za-z\s]+/g

function extractNapMentions(root: HTMLElement, schemaBlocks: { type: string; raw?: string }[]): NapMention[] {
  const mentions: NapMention[] = []

  for (const block of schemaBlocks) {
    if (!block.raw) continue
    try {
      const json = JSON.parse(block.raw)
      const items = Array.isArray(json) ? json : [json]
      for (const item of items) {
        if (item && (item['@type'] === 'LocalBusiness' || /LocalBusiness/.test(String(item['@type'])) || item.name)) {
          const addr = item.address
          const addressStr =
            typeof addr === 'string'
              ? addr
              : addr
                ? [addr.streetAddress, addr.postalCode, addr.addressLocality, addr.addressCountry].filter(Boolean).join(', ')
                : null
          if (item.name || addressStr || item.telephone) {
            mentions.push({
              name: item.name ?? null,
              address: addressStr,
              phone: item.telephone ?? null,
              source: 'schema',
            })
          }
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }

  const footer = root.querySelector('footer')
  const bodyText = (footer?.textContent || root.textContent || '').slice(0, 5000)
  const phoneMatch = bodyText.match(PHONE_REGEX)
  const addressMatch = bodyText.match(ADDRESS_HINT_REGEX)
  if (phoneMatch || addressMatch) {
    mentions.push({
      name: null,
      address: addressMatch ? addressMatch[0].trim() : null,
      phone: phoneMatch ? phoneMatch[0].trim() : null,
      source: footer ? 'footer' : 'text',
    })
  }

  return mentions
}

export function extractPageData(
  html: string,
  pageUrl: string,
  rootUrl: string,
  knownCities: string[],
  statusCode: number,
  loadTimeMs: number,
): PageData {
  const root = parse(html, { blockTextElements: { script: true, style: true, noscript: true } })
  const path = (() => {
    try {
      return new URL(pageUrl).pathname || '/'
    } catch {
      return '/'
    }
  })()

  const title = root.querySelector('title')?.textContent?.trim() || null
  const metaDescription =
    root.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || null
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href') || null
  const robotsMeta = root.querySelector('meta[name="robots"]')?.getAttribute('content')?.trim() || null
  const isIndexable = !robotsMeta || !/noindex/i.test(robotsMeta)

  const h1s = root.querySelectorAll('h1').map((el) => el.textContent.trim()).filter(Boolean)
  const headings: HeadingOutline[] = root
    .querySelectorAll('h1,h2,h3,h4,h5,h6')
    .map((el) => ({
      level: Number(el.tagName.slice(1)) as HeadingOutline['level'],
      text: el.textContent.trim(),
    }))
    .filter((h) => h.text.length > 0)

  const images: ImageInfo[] = root.querySelectorAll('img').map((el) => {
    const alt = el.getAttribute('alt')
    return {
      src: el.getAttribute('src') || '',
      alt: alt ?? null,
      hasAlt: !!alt && alt.trim().length > 0,
    }
  })

  const rootHost = (() => {
    try {
      return new URL(rootUrl).hostname
    } catch {
      return ''
    }
  })()

  const links: LinkInfo[] = root
    .querySelectorAll('a[href]')
    .map((el): LinkInfo | null => {
      const href = el.getAttribute('href') || ''
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return null
      }
      const abs = absoluteUrl(pageUrl, href)
      if (!abs) return null
      let isInternal = false
      try {
        isInternal = new URL(abs).hostname === rootHost
      } catch {
        isInternal = false
      }
      return {
        href: abs,
        text: el.textContent.trim().slice(0, 120),
        isInternal,
        isBroken: false,
      }
    })
    .filter((l): l is LinkInfo => l !== null)

  const schemaBlocks: SchemaBlock[] = root
    .querySelectorAll('script[type="application/ld+json"]')
    .map((el) => {
      const raw = el.textContent
      try {
        const json = JSON.parse(raw)
        const items = Array.isArray(json) ? json : [json]
        return items.map((item) => ({
          type: String(item?.['@type'] ?? 'Unknown'),
          raw,
          valid: true,
        }))
      } catch {
        return [{ type: 'Invalid', raw, valid: false }]
      }
    })
    .flat()

  const bodyText = root.textContent || ''
  const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length

  const detectedCity = detectCity(bodyText.slice(0, 3000), path, knownCities)
  const detectedService = detectService(`${title ?? ''} ${bodyText.slice(0, 1000)}`, path)
  const pageType = classifyPageType(path, title ?? '')
  const napMentions = extractNapMentions(root, schemaBlocks)

  // Mobile-friendliness (static heuristics)
  const hasViewportMeta = !!root.querySelector('meta[name="viewport"]')
  const imagesWithSrcset = root.querySelectorAll('img[srcset]').length

  // Performance / Core Web Vitals proxies (static heuristics — no real
  // browser timing is available on Netlify's free function tier)
  const scriptTags = root.querySelectorAll('script[src]')
  const renderBlockingScripts = scriptTags.filter((el) => !el.hasAttribute('async') && !el.hasAttribute('defer')).length
  const imagesMissingLazyLoading = images.length > 1 ? root.querySelectorAll('img').filter((el) => el.getAttribute('loading') !== 'lazy').length - 1 : 0

  // A page with very little extracted text but a meaningful number of
  // script tags is a strong signal its real content is injected client-side
  // (a plain HTML fetch, with no JS execution, won't see it).
  const totalScriptTags = root.querySelectorAll('script').length
  const possiblyJsRendered = wordCount < 40 && totalScriptTags >= 2

  return {
    url: pageUrl,
    path,
    statusCode,
    title,
    metaDescription,
    h1s,
    headings,
    canonical,
    robotsMeta,
    isIndexable,
    wordCount,
    images,
    links,
    schemaBlocks,
    pageType,
    detectedCity,
    detectedService,
    napMentions,
    loadTimeMs,
    hasViewportMeta,
    imagesWithSrcset,
    renderBlockingScripts,
    imagesMissingLazyLoading: Math.max(0, imagesMissingLazyLoading),
    possiblyJsRendered,
  }
}

// ---------------------------------------------------------------------------
// robots.txt — best-effort, non-fatal. If it can't be fetched or parsed we
// simply crawl without restriction; we never let this block the audit.
// ---------------------------------------------------------------------------

interface RobotsInfo {
  disallowedPrefixes: string[]
  sitemapUrls: string[]
  checked: boolean
}

function parseRobotsTxt(text: string): { disallowedPrefixes: string[]; sitemapUrls: string[] } {
  const lines = text.split(/\r?\n/)
  const disallowedPrefixes: string[] = []
  const sitemapUrls: string[] = []
  let inWildcardGroup = false
  let currentAgentIsWildcard = false

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0].trim()
    if (!line) continue
    const [rawKey, ...rest] = line.split(':')
    const key = rawKey.trim().toLowerCase()
    const value = rest.join(':').trim()

    if (key === 'user-agent') {
      currentAgentIsWildcard = value === '*'
      inWildcardGroup = currentAgentIsWildcard
      continue
    }
    if (key === 'sitemap' && value) {
      sitemapUrls.push(value)
      continue
    }
    if (key === 'disallow' && inWildcardGroup && value) {
      disallowedPrefixes.push(value)
    }
  }

  return { disallowedPrefixes, sitemapUrls }
}

async function fetchRobotsTxt(rootUrl: string, deadline: number): Promise<RobotsInfo> {
  try {
    const robotsUrl = new URL('/robots.txt', rootUrl).toString()
    const res = await fetchWithTimeout(robotsUrl, ROBOTS_SITEMAP_TIMEOUT_MS, deadline)
    if (!res || !res.ok) return { disallowedPrefixes: [], sitemapUrls: [], checked: false }
    const text = await res.text()
    const { disallowedPrefixes, sitemapUrls } = parseRobotsTxt(text)
    return { disallowedPrefixes, sitemapUrls, checked: true }
  } catch {
    return { disallowedPrefixes: [], sitemapUrls: [], checked: false }
  }
}

function isPathDisallowed(path: string, disallowedPrefixes: string[]): boolean {
  return disallowedPrefixes.some((prefix) => prefix !== '' && path.startsWith(prefix))
}

// ---------------------------------------------------------------------------
// sitemap.xml — used to seed the crawl queue with real site structure
// instead of relying only on homepage links. Best-effort and bounded.
// ---------------------------------------------------------------------------

async function fetchSitemapUrls(sitemapUrl: string, deadline: number, depth = 0): Promise<string[]> {
  if (depth > 1) return [] // avoid unbounded sitemap-index recursion
  const res = await fetchWithTimeout(sitemapUrl, ROBOTS_SITEMAP_TIMEOUT_MS, deadline)
  if (!res || !res.ok) return []
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('xml') && !sitemapUrl.endsWith('.xml')) return []

  const text = await res.text()
  const locMatches = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1])
  if (locMatches.length === 0) return []

  // A sitemap index points to other sitemap files instead of pages.
  const nestedSitemaps = locMatches.filter((u) => /sitemap.*\.xml/i.test(u))
  if (nestedSitemaps.length > 0 && nestedSitemaps.length === locMatches.length) {
    const nested = await Promise.all(nestedSitemaps.slice(0, 3).map((u) => fetchSitemapUrls(u, deadline, depth + 1)))
    return nested.flat().slice(0, MAX_SITEMAP_URLS)
  }

  return locMatches.slice(0, MAX_SITEMAP_URLS)
}

// ---------------------------------------------------------------------------
// Crawl-order prioritization — within our small per-audit page budget,
// spend it on the pages the Local SEO / GEO analyzers actually care about.
// ---------------------------------------------------------------------------

function priorityScore(url: string, knownCities: string[]): number {
  let path = '/'
  try {
    path = new URL(url).pathname.toLowerCase()
  } catch {
    return 0
  }
  let score = 0
  if (PRIORITY_PATH_PATTERN.test(path)) score += 10
  if (knownCities.some((c) => path.includes(c.toLowerCase().replace(/\s+/g, '-')) || path.includes(c.toLowerCase()))) score += 8
  if (path === '/' || path === '') score += 20 // homepage always goes first
  // Shorter, top-level paths are slightly preferred over deep nested ones.
  score -= (path.match(/\//g)?.length ?? 0) * 0.5
  return score
}

export interface CrawlOptions {
  knownCities?: string[]
}

export async function crawlSite(rootUrlRaw: string, options: CrawlOptions = {}): Promise<CrawlResult> {
  const deadline = Date.now() + GLOBAL_BUDGET_MS
  const crawlErrors: string[] = []
  const pages: PageData[] = []
  const visited = new Set<string>()
  const knownCities = options.knownCities ?? []

  const { url: rootUrl } = await assertSafePublicUrl(rootUrlRaw)
  const rootUrlStr = rootUrl.toString()

  // robots.txt (best-effort, non-fatal) — respected for crawl decisions,
  // and its Sitemap: directives feed the sitemap discovery step below.
  const robots = await fetchRobotsTxt(rootUrlStr, deadline)
  let disallowedPathsSkipped = 0

  // sitemap.xml — prefer the site's own declared structure over blind
  // link-following, so our small page budget lands on real content pages.
  const sitemapCandidates = robots.sitemapUrls.length > 0 ? robots.sitemapUrls : [new URL('/sitemap.xml', rootUrlStr).toString()]
  let sitemapUrls: string[] = []
  for (const candidate of sitemapCandidates) {
    if (Date.now() > deadline) break
    try {
      sitemapUrls = await fetchSitemapUrls(candidate, deadline)
      if (sitemapUrls.length > 0) break
    } catch {
      // ignore and try the next candidate / fall back to link-crawling
    }
  }
  const usedSitemap = sitemapUrls.length > 0

  // Priority queue of {url, score} — homepage and known location/service
  // paths are crawled first so the ~6-page budget is spent well.
  type QueueItem = { url: string; score: number }
  const queue: QueueItem[] = [{ url: rootUrlStr, score: priorityScore(rootUrlStr, knownCities) }]
  for (const u of sitemapUrls) {
    const abs = absoluteUrl(rootUrlStr, u)
    if (abs) queue.push({ url: abs, score: priorityScore(abs, knownCities) })
  }

  let truncated = false

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    if (Date.now() > deadline) {
      truncated = true
      break
    }
    queue.sort((a, b) => b.score - a.score)
    const item = queue.shift()!
    const normalized = item.url.replace(/#.*$/, '')
    if (visited.has(normalized)) continue
    visited.add(normalized)

    // Re-validate every URL we actually fetch (defense in depth against
    // redirects or crawled links pointing somewhere unsafe).
    let safe
    try {
      safe = await assertSafePublicUrl(normalized)
    } catch (err) {
      if (err instanceof SsrfError) crawlErrors.push(`Skipped ${normalized}: ${err.message}`)
      continue
    }

    if (isPathDisallowed(safe.url.pathname, robots.disallowedPrefixes)) {
      disallowedPathsSkipped += 1
      continue
    }

    const start = Date.now()
    const res = await fetchWithTimeout(safe.url.toString(), FETCH_TIMEOUT_MS, deadline)
    const loadTimeMs = Date.now() - start

    if (!res) {
      crawlErrors.push(`Could not fetch ${normalized} (timeout or network error).`)
      continue
    }
    if (!res.ok) {
      crawlErrors.push(`${normalized} returned HTTP ${res.status}.`)
      if (pages.length === 0) {
        // If the very first page 404s/500s there's nothing useful to analyze.
        pages.push(
          extractPageData('<html><head><title></title></head><body></body></html>', normalized, rootUrlStr, knownCities, res.status, loadTimeMs),
        )
      }
      continue
    }
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      crawlErrors.push(`Skipped ${normalized} (not HTML: ${contentType || 'unknown content-type'}).`)
      continue
    }

    const html = await readBodyCapped(res)
    const pageData = extractPageData(html, normalized, rootUrlStr, knownCities, res.status, loadTimeMs)
    pages.push(pageData)

    for (const l of pageData.links) {
      if (l.isInternal && !visited.has(l.href) && queue.length + pages.length < MAX_PAGES * 4) {
        queue.push({ url: l.href, score: priorityScore(l.href, knownCities) })
      }
    }
  }

  if (queue.length > 0 && pages.length >= MAX_PAGES) truncated = true

  const siteWarnings: string[] = []
  const jsRenderedCount = pages.filter((p) => p.possiblyJsRendered).length
  if (pages.length > 0 && jsRenderedCount / pages.length >= 0.5) {
    siteWarnings.push(
      'Most crawled pages returned very little text relative to their script tags. This site may render its content with JavaScript (a React/Vue/Angular-style app) — a plain HTML fetch (what this crawler does) may not see the real content, which can make scores look worse than the site actually is.',
    )
  }
  if (disallowedPathsSkipped > 0) {
    siteWarnings.push(`${disallowedPathsSkipped} page(s) were skipped because robots.txt disallows crawling them.`)
  }
  if (usedSitemap) {
    siteWarnings.push(`Used sitemap.xml to discover pages (found ${sitemapUrls.length} URL(s)).`)
  }

  // Broken-link detection: sample a bounded number of unique links (internal
  // + external) across all crawled pages and check their status with cheap
  // HEAD requests, respecting the remaining time budget.
  const allLinks = pages.flatMap((p) => p.links)
  const uniqueHrefs = [...new Set(allLinks.map((l) => l.href))].slice(0, LINK_CHECK_LIMIT)
  const statusByHref = new Map<string, number | null>()

  await Promise.all(
    uniqueHrefs.map(async (href) => {
      if (Date.now() > deadline) {
        statusByHref.set(href, null)
        return
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      try {
        const res = await fetch(href, { method: 'HEAD', signal: controller.signal, redirect: 'follow' })
        statusByHref.set(href, res.status)
      } catch {
        // Some servers reject HEAD; try a lightweight GET as a fallback.
        try {
          const controller2 = new AbortController()
          const timer2 = setTimeout(() => controller2.abort(), 3000)
          const res2 = await fetch(href, { method: 'GET', signal: controller2.signal, redirect: 'follow' })
          clearTimeout(timer2)
          statusByHref.set(href, res2.status)
        } catch {
          statusByHref.set(href, null)
        }
      } finally {
        clearTimeout(timer)
      }
    }),
  )

  for (const page of pages) {
    for (const l of page.links) {
      if (statusByHref.has(l.href)) {
        const status = statusByHref.get(l.href)
        l.statusCode = status ?? undefined
        l.isBroken = status != null && status >= 400
      }
    }
  }

  return {
    rootUrl: rootUrlStr,
    crawledAt: new Date().toISOString(),
    pages,
    crawlErrors,
    truncated,
    siteWarnings,
    usedSitemap,
    robotsTxtChecked: robots.checked,
    disallowedPathsSkipped,
  }
}
