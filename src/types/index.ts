// Core domain types shared by the demo dataset, the analyzer engine,
// and the Netlify crawl function output. Keeping this isomorphic means
// demo mode and live mode run through the exact same scoring logic.

export type AuditMode = 'demo' | 'live'

export interface LinkInfo {
  href: string
  text: string
  isInternal: boolean
  isBroken: boolean
  statusCode?: number
}

export interface ImageInfo {
  src: string
  alt: string | null
  hasAlt: boolean
}

export interface SchemaBlock {
  type: string
  raw?: string
  valid: boolean
}

export interface HeadingOutline {
  level: 1 | 2 | 3 | 4 | 5 | 6
  text: string
}

/**
 * Raw, unscored data extracted from a single crawled (or simulated) page.
 * This is the shape returned by the Netlify Function AND by the demo
 * dataset generator, so the analyzer never needs to know which mode
 * produced it.
 */
export interface PageData {
  url: string
  path: string
  statusCode: number
  title: string | null
  metaDescription: string | null
  h1s: string[]
  headings: HeadingOutline[]
  canonical: string | null
  robotsMeta: string | null
  isIndexable: boolean
  wordCount: number
  images: ImageInfo[]
  links: LinkInfo[]
  schemaBlocks: SchemaBlock[]
  pageType: 'home' | 'location' | 'service' | 'contact' | 'blog' | 'other'
  detectedCity: string | null
  detectedService: string | null
  napMentions: NapMention[]
  loadTimeMs?: number
  // Mobile-friendliness signals (parsed from static HTML — no rendering)
  hasViewportMeta: boolean
  imagesWithSrcset: number
  // Performance / Core Web Vitals proxies (static heuristics, not a real
  // Lighthouse run — Netlify's free function tier can't launch a browser)
  renderBlockingScripts: number
  imagesMissingLazyLoading: number
  // True when the page's extracted text is suspiciously thin relative to
  // its script tags — a strong signal the real content is rendered
  // client-side (React/Vue/Angular) and wasn't visible to a plain HTML fetch
  possiblyJsRendered: boolean
}

export interface NapMention {
  name: string | null
  address: string | null
  phone: string | null
  source: 'text' | 'schema' | 'footer'
}

export interface CrawlResult {
  rootUrl: string
  crawledAt: string
  pages: PageData[]
  crawlErrors: string[]
  truncated: boolean
  // Site-wide notes surfaced prominently in the UI (not per-page errors):
  // JS-rendering warnings, robots.txt / sitemap.xml usage, etc.
  siteWarnings: string[]
  usedSitemap: boolean
  robotsTxtChecked: boolean
  disallowedPathsSkipped: number
}

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Issue {
  id: string
  severity: IssueSeverity
  category: 'technical' | 'local' | 'geo' | 'ai-readiness'
  title: string
  description: string
  affectedUrls: string[]
  priorityScore: number // 0-100, higher = fix first
}

export interface Recommendation {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  category: 'technical' | 'local' | 'geo' | 'ai-readiness'
}

export interface GeoOpportunity {
  city: string
  service: string
  reason: string
  hasPage: boolean
  suggestedUrlSlug: string
}

export interface CategoryScore {
  score: number // 0-100
  label: string
  summary: string
}

export interface NapConsistencyResult {
  consistent: boolean
  names: string[]
  addresses: string[]
  phones: string[]
  mentionCount: number
}

export interface AuditReport {
  id: string
  mode: AuditMode
  rootUrl: string
  generatedAt: string
  pagesAnalyzed: number
  scores: {
    overall: number
    technical: CategoryScore
    local: CategoryScore
    geo: CategoryScore
    aiReadiness: CategoryScore
  }
  technical: {
    titleIssues: Issue[]
    metaDescriptionIssues: Issue[]
    h1Issues: Issue[]
    brokenLinks: LinkInfo[]
    canonicalIssues: Issue[]
    indexabilityIssues: Issue[]
    imageAltIssues: Issue[]
    imagesTotal: number
    imagesMissingAlt: number
    internalLinkCount: number
    orphanPages: string[]
    schemaCoveragePct: number
    pagesWithSchema: number
    mobileIssues: Issue[]
    performanceIssues: Issue[]
  }
  local: {
    nap: NapConsistencyResult
    locationPages: PageData[]
    servicePages: PageData[]
    napIssues: Issue[]
  }
  geo: {
    opportunities: GeoOpportunity[]
    citiesFound: string[]
    servicesFound: string[]
  }
  aiReadiness: {
    hasOrganizationSchema: boolean
    hasLocalBusinessSchema: boolean
    hasFaqSchema: boolean
    structuredDataTypes: string[]
    headingStructureScore: number
    answerableContentScore: number
    notes: string[]
  }
  allIssues: Issue[]
  recommendations: Recommendation[]
}

// ---------------------------------------------------------------------------
// Marketing analytics (Search Console / Google Business Profile style data).
//
// In Demo Mode, this block is entirely fictional sample data, clearly
// labeled DEMO DATA, with no network calls involved.
//
// For a live audit, KeywordRanking[] and TrafficPoint[] can optionally be
// populated with REAL data by connecting Google Search Console — a free,
// user-initiated OAuth flow (see netlify/functions/gsc-*.ts). The app never
// requires this connection and never calls any paid SEO/AI API; GSC only
// returns real clicks/impressions/position/CTR, so `previousPosition` and
// `searchVolume` (which GSC doesn't expose) are optional and omitted for
// live data. Google Business Profile (reviews, hours, rating) is NOT
// integrated — Google gates that API behind manual production approval,
// so it remains demo-only.
// ---------------------------------------------------------------------------

export interface KeywordRanking {
  keyword: string
  position: number
  previousPosition?: number
  clicks: number
  impressions: number
  ctr: number
  searchVolume?: number
  intent: 'informational' | 'commercial' | 'transactional' | 'local'
}

export interface ReviewSample {
  author: string
  rating: 1 | 2 | 3 | 4 | 5
  date: string
  text: string
  platform: 'Google' | 'Facebook' | 'Yelp'
}

export interface GbpProfileSample {
  businessName: string
  category: string
  address: string
  phone: string
  website: string
  hours: Record<string, string>
  averageRating: number
  totalReviews: number
  recentReviews: ReviewSample[]
  photosCount: number
  postsLast30Days: number
  qAndACount: number
}

export interface TrafficPoint {
  date: string
  clicks: number
  impressions: number
}

export interface DemoBusinessProfile {
  name: string
  city: string
  country: string
  domain: string
  industry: string
  gbp: GbpProfileSample
  keywordRankings: KeywordRanking[]
  trafficHistory: TrafficPoint[]
  competitorNames: string[]
}

// ---------------------------------------------------------------------------
// Real Google Search Console data for a live audit (see netlify/functions/
// gsc-auth-start.ts, gsc-callback.ts, gsc-result.ts). Populated only after
// the site owner explicitly connects their own Search Console account.
// ---------------------------------------------------------------------------

export interface GscConnectionResult {
  siteUrl: string // the verified GSC property that matched (e.g. "sc-domain:example.com")
  dateRange: { startDate: string; endDate: string }
  keywordRankings: KeywordRanking[]
  trafficHistory: TrafficPoint[]
  fetchedAt: string
}
