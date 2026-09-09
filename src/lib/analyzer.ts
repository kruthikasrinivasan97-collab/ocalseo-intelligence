import type {
  AuditMode,
  AuditReport,
  CrawlResult,
  GeoOpportunity,
  Issue,
  IssueSeverity,
  NapConsistencyResult,
  PageData,
  Recommendation,
} from '../types'

let issueCounter = 0
function nextId(prefix: string) {
  issueCounter += 1
  return `${prefix}-${issueCounter}`
}

const SEVERITY_WEIGHT: Record<IssueSeverity, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  info: 10,
}

function makeIssue(
  category: Issue['category'],
  severity: IssueSeverity,
  title: string,
  description: string,
  affectedUrls: string[],
): Issue {
  return {
    id: nextId(category),
    severity,
    category,
    title,
    description,
    affectedUrls,
    priorityScore: Math.min(
      100,
      SEVERITY_WEIGHT[severity] + Math.min(20, affectedUrls.length * 2),
    ),
  }
}

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

// ---------------------------------------------------------------------------
// Technical SEO
// ---------------------------------------------------------------------------

function analyzeTechnical(pages: PageData[]) {
  const titleIssues: Issue[] = []
  const metaDescriptionIssues: Issue[] = []
  const h1Issues: Issue[] = []
  const canonicalIssues: Issue[] = []
  const indexabilityIssues: Issue[] = []
  const imageAltIssues: Issue[] = []

  const missingTitle: string[] = []
  const shortTitle: string[] = []
  const longTitle: string[] = []
  const missingMeta: string[] = []
  const badLenMeta: string[] = []
  const missingH1: string[] = []
  const multiH1: string[] = []
  const missingCanonical: string[] = []
  const nonIndexable: string[] = []

  let imagesTotal = 0
  let imagesMissingAlt = 0
  let pagesWithSchema = 0
  let internalLinkCount = 0

  const allInternalTargets = new Set<string>()
  const linkedTo = new Set<string>()

  for (const page of pages) {
    if (!page.title || page.title.trim().length === 0) missingTitle.push(page.url)
    else if (page.title.length < 30) shortTitle.push(page.url)
    else if (page.title.length > 60) longTitle.push(page.url)

    if (!page.metaDescription || page.metaDescription.trim().length === 0) {
      missingMeta.push(page.url)
    } else if (page.metaDescription.length < 70 || page.metaDescription.length > 160) {
      badLenMeta.push(page.url)
    }

    if (page.h1s.length === 0) missingH1.push(page.url)
    else if (page.h1s.length > 1) multiH1.push(page.url)

    if (!page.canonical) missingCanonical.push(page.url)

    if (!page.isIndexable) nonIndexable.push(page.url)

    if (page.schemaBlocks.length > 0) pagesWithSchema += 1

    for (const img of page.images) {
      imagesTotal += 1
      if (!img.hasAlt) imagesMissingAlt += 1
    }

    for (const link of page.links) {
      if (link.isInternal) {
        internalLinkCount += 1
        allInternalTargets.add(normalizePath(link.href))
      }
    }
  }

  for (const page of pages) linkedTo.add(normalizePath(page.path))
  const orphanPages = pages
    .filter((p) => p.pageType !== 'home')
    .map((p) => p.path)
    .filter((path) => !allInternalTargets.has(normalizePath(path)))

  const brokenLinks = pages.flatMap((p) => p.links.filter((l) => l.isBroken))

  if (missingTitle.length)
    titleIssues.push(
      makeIssue('technical', 'critical', 'Missing page titles', 'These pages have no <title> tag, which is one of the strongest on-page ranking and click-through signals.', missingTitle),
    )
  if (longTitle.length)
    titleIssues.push(
      makeIssue('technical', 'low', 'Title tags too long', 'Titles over 60 characters are likely to be truncated in search results.', longTitle),
    )
  if (shortTitle.length)
    titleIssues.push(
      makeIssue('technical', 'medium', 'Title tags too short', 'Titles under 30 characters may under-use valuable keyword real estate.', shortTitle),
    )

  if (missingMeta.length)
    metaDescriptionIssues.push(
      makeIssue('technical', 'high', 'Missing meta descriptions', 'Pages without a meta description let search engines auto-generate a snippet, hurting click-through rate.', missingMeta),
    )
  if (badLenMeta.length)
    metaDescriptionIssues.push(
      makeIssue('technical', 'low', 'Meta description length off-target', 'Aim for 70–160 characters so descriptions are not truncated or padded.', badLenMeta),
    )

  if (missingH1.length)
    h1Issues.push(
      makeIssue('technical', 'high', 'Missing H1 heading', 'Every indexable page should have exactly one clear H1 describing the page topic.', missingH1),
    )
  if (multiH1.length)
    h1Issues.push(
      makeIssue('technical', 'medium', 'Multiple H1 headings', 'Multiple H1s dilute topical focus and can confuse heading-based content extraction (including AI answer engines).', multiH1),
    )

  if (missingCanonical.length)
    canonicalIssues.push(
      makeIssue('technical', 'medium', 'Missing canonical tag', 'A canonical tag helps prevent duplicate-content issues across URL variants.', missingCanonical),
    )

  if (nonIndexable.length)
    indexabilityIssues.push(
      makeIssue('technical', 'critical', 'Pages blocked from indexing', 'These pages return a noindex directive and will not appear in search results.', nonIndexable),
    )

  if (imagesMissingAlt > 0) {
    const affected = pages.filter((p) => p.images.some((i) => !i.hasAlt)).map((p) => p.url)
    imageAltIssues.push(
      makeIssue('technical', 'medium', 'Images missing alt text', `${imagesMissingAlt} of ${imagesTotal} images have no alt attribute, hurting accessibility and image search visibility.`, affected),
    )
  }

  if (brokenLinks.length > 0) {
    const affected = [...new Set(pages.filter((p) => p.links.some((l) => l.isBroken)).map((p) => p.url))]
    titleIssues.push(
      makeIssue('technical', 'high', 'Broken links detected', `${brokenLinks.length} link(s) point to pages that return an error or cannot be reached.`, affected),
    )
  }

  // Mobile-friendliness (static heuristics — no real device rendering)
  const mobileIssues: Issue[] = []
  const missingViewport = pages.filter((p) => !p.hasViewportMeta).map((p) => p.url)
  if (missingViewport.length)
    mobileIssues.push(
      makeIssue('technical', 'critical', 'Missing responsive viewport meta tag', 'Without a <meta name="viewport"> tag, mobile browsers render the page at desktop width and scale it down — a major mobile-usability and mobile-ranking problem.', missingViewport),
    )
  const lowSrcsetPages = pages.filter((p) => p.images.length >= 3 && p.imagesWithSrcset === 0).map((p) => p.url)
  if (lowSrcsetPages.length)
    mobileIssues.push(
      makeIssue('technical', 'low', 'Images not using responsive srcset', 'None of the images on these pages use a srcset attribute, so mobile visitors may download unnecessarily large images.', lowSrcsetPages),
    )

  // Performance / Core Web Vitals proxies (static analysis, not a real
  // Lighthouse/CrUX run)
  const performanceIssues: Issue[] = []
  const renderBlockingPages = pages.filter((p) => p.renderBlockingScripts >= 3).map((p) => p.url)
  if (renderBlockingPages.length)
    performanceIssues.push(
      makeIssue('technical', 'medium', 'Multiple render-blocking scripts', 'These pages load 3+ synchronous <script> tags without async/defer, which can delay First Contentful Paint and Largest Contentful Paint.', renderBlockingPages),
    )
  const lazyLoadPages = pages.filter((p) => p.imagesMissingLazyLoading >= 4).map((p) => p.url)
  if (lazyLoadPages.length)
    performanceIssues.push(
      makeIssue('technical', 'low', 'Below-the-fold images not lazy-loaded', 'Adding loading="lazy" to offscreen images reduces initial page weight and can improve Largest Contentful Paint.', lazyLoadPages),
    )
  const jsRenderedPages = pages.filter((p) => p.possiblyJsRendered).map((p) => p.url)
  if (jsRenderedPages.length)
    performanceIssues.push(
      makeIssue('technical', 'high', 'Content may be JavaScript-rendered', 'These pages returned very little text relative to their script tags. If content is injected client-side, search engines and this crawler may not see your real content — consider server-side rendering or pre-rendering for SEO-critical pages.', jsRenderedPages),
    )

  const schemaCoveragePct = pages.length > 0 ? clampScore((pagesWithSchema / pages.length) * 100) : 0

  const allTechnicalIssues = [
    ...titleIssues,
    ...metaDescriptionIssues,
    ...h1Issues,
    ...canonicalIssues,
    ...indexabilityIssues,
    ...imageAltIssues,
    ...mobileIssues,
    ...performanceIssues,
  ]

  const penalty = allTechnicalIssues.reduce((sum, i) => sum + SEVERITY_WEIGHT[i.severity] * 0.15, 0)
  const score = clampScore(100 - penalty)

  return {
    result: {
      titleIssues,
      metaDescriptionIssues,
      h1Issues,
      brokenLinks,
      canonicalIssues,
      indexabilityIssues,
      imageAltIssues,
      imagesTotal,
      imagesMissingAlt,
      internalLinkCount,
      orphanPages,
      schemaCoveragePct,
      pagesWithSchema,
      mobileIssues,
      performanceIssues,
    },
    score,
    allIssues: allTechnicalIssues,
  }
}

function normalizePath(p: string) {
  try {
    if (p.startsWith('http')) {
      const u = new URL(p)
      return u.pathname.replace(/\/$/, '') || '/'
    }
  } catch {
    // fall through
  }
  return p.replace(/\/$/, '') || '/'
}

// ---------------------------------------------------------------------------
// Local SEO / NAP
// ---------------------------------------------------------------------------

function analyzeLocal(pages: PageData[]) {
  const napIssues: Issue[] = []
  const mentions = pages.flatMap((p) => p.napMentions)

  const names = [...new Set(mentions.map((m) => m.name).filter(Boolean) as string[])]
  const addresses = [...new Set(mentions.map((m) => m.address).filter(Boolean) as string[])]
  const phones = [...new Set(mentions.map((m) => normalizePhone(m.phone)).filter(Boolean) as string[])]

  const consistent = names.length <= 1 && addresses.length <= 1 && phones.length <= 1 && mentions.length > 0

  const nap: NapConsistencyResult = {
    consistent,
    names,
    addresses,
    phones,
    mentionCount: mentions.length,
  }

  if (mentions.length === 0) {
    napIssues.push(
      makeIssue('local', 'critical', 'No NAP (Name/Address/Phone) found', 'No business name, address, or phone number could be detected on the site. This is essential for local pack rankings.', pages.map((p) => p.url).slice(0, 1)),
    )
  } else {
    if (names.length > 1)
      napIssues.push(makeIssue('local', 'high', 'Inconsistent business name', `Found ${names.length} variations of the business name across the site.`, pages.filter((p) => p.napMentions.some((m) => m.name)).map((p) => p.url)))
    if (addresses.length > 1)
      napIssues.push(makeIssue('local', 'high', 'Inconsistent address', `Found ${addresses.length} variations of the business address.`, pages.filter((p) => p.napMentions.some((m) => m.address)).map((p) => p.url)))
    if (phones.length > 1)
      napIssues.push(makeIssue('local', 'high', 'Inconsistent phone number', `Found ${phones.length} variations of the business phone number.`, pages.filter((p) => p.napMentions.some((m) => m.phone)).map((p) => p.url)))
  }

  const locationPages = pages.filter((p) => p.pageType === 'location')
  const servicePages = pages.filter((p) => p.pageType === 'service')

  if (locationPages.length === 0) {
    napIssues.push(
      makeIssue('local', 'medium', 'No dedicated location pages', 'Multi-location businesses benefit from a unique landing page per city/area targeting local intent.', ['/']),
    )
  }

  const hasLocalBusinessSchema = pages.some((p) => p.schemaBlocks.some((s) => /LocalBusiness|Organization/i.test(s.type)))
  if (!hasLocalBusinessSchema) {
    napIssues.push(
      makeIssue('local', 'high', 'Missing LocalBusiness structured data', 'Adding LocalBusiness (or a subtype) schema helps search engines and AI assistants confidently surface your NAP details.', ['/']),
    )
  }

  const penalty = napIssues.reduce((sum, i) => sum + SEVERITY_WEIGHT[i.severity] * 0.18, 0)
  const score = clampScore(100 - penalty)

  return { nap, locationPages, servicePages, napIssues, score, allIssues: napIssues }
}

function normalizePhone(phone: string | null) {
  if (!phone) return null
  return phone.replace(/[^\d]/g, '')
}

// ---------------------------------------------------------------------------
// GEO opportunity finder
// ---------------------------------------------------------------------------

const COMMON_SERVICE_KEYWORDS = [
  'installation',
  'repair',
  'maintenance',
  'consulting',
  'cleaning',
  'inspection',
  'emergency',
  'remodeling',
]

function analyzeGeo(pages: PageData[], serviceAreaCities: string[]) {
  const citiesFound = [...new Set(pages.map((p) => p.detectedCity).filter(Boolean) as string[])]
  const servicesFound = [...new Set(pages.map((p) => p.detectedService).filter(Boolean) as string[])]

  const existingCombos = new Set(
    pages
      .filter((p) => p.detectedCity && p.detectedService)
      .map((p) => `${p.detectedCity!.toLowerCase()}::${p.detectedService!.toLowerCase()}`),
  )

  const targetCities = serviceAreaCities.length > 0 ? serviceAreaCities : citiesFound
  const targetServices = servicesFound.length > 0 ? servicesFound : COMMON_SERVICE_KEYWORDS.slice(0, 3)

  const opportunities: GeoOpportunity[] = []
  for (const city of targetCities) {
    for (const service of targetServices) {
      const key = `${city.toLowerCase()}::${service.toLowerCase()}`
      const hasPage = existingCombos.has(key)
      if (!hasPage) {
        opportunities.push({
          city,
          service,
          hasPage,
          reason: `No dedicated "${service} in ${city}" landing page was found. A focused page targeting this city + service combination can capture long-tail local search and AI answer-engine citations.`,
          suggestedUrlSlug: `/${slugify(service)}-${slugify(city)}`,
        })
      }
    }
  }

  // cap so the report stays readable
  const trimmed = opportunities.slice(0, 24)

  const coverageRatio =
    targetCities.length * targetServices.length > 0
      ? existingCombos.size / (targetCities.length * targetServices.length)
      : 0

  const score = clampScore(coverageRatio * 100)

  return { opportunities: trimmed, citiesFound, servicesFound, score }
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ---------------------------------------------------------------------------
// AI Search Readiness (GEO / answer-engine readiness)
// ---------------------------------------------------------------------------

function analyzeAiReadiness(pages: PageData[]) {
  const structuredDataTypes = [...new Set(pages.flatMap((p) => p.schemaBlocks.map((s) => s.type)))]
  const hasOrganizationSchema = structuredDataTypes.some((t) => /Organization/i.test(t))
  const hasLocalBusinessSchema = structuredDataTypes.some((t) => /LocalBusiness/i.test(t))
  const hasFaqSchema = structuredDataTypes.some((t) => /FAQPage/i.test(t))

  const notes: string[] = []

  // Heading structure: pages with a clean single-H1 -> H2 -> H3 hierarchy are
  // easier for LLMs / answer engines to chunk and cite.
  let structureHits = 0
  for (const page of pages) {
    const levels = page.headings.map((h) => h.level)
    const singleH1 = page.h1s.length === 1
    const hasH2 = levels.includes(2)
    const monotonic = isRoughlyMonotonic(levels)
    if (singleH1 && hasH2 && monotonic) structureHits += 1
  }
  const headingStructureScore = pages.length > 0 ? clampScore((structureHits / pages.length) * 100) : 0

  // Answerable content: does the page contain direct-answer patterns
  // (short declarative sentences near headings, question-style headings,
  // list/FAQ structure)? We approximate using heading text + word count.
  let answerableHits = 0
  for (const page of pages) {
    const hasQuestionHeading = page.headings.some((h) => /\?$/.test(h.text.trim()))
    const reasonableLength = page.wordCount >= 150
    if (hasQuestionHeading || (reasonableLength && page.headings.length >= 2)) answerableHits += 1
  }
  const answerableContentScore = pages.length > 0 ? clampScore((answerableHits / pages.length) * 100) : 0

  if (!hasOrganizationSchema && !hasLocalBusinessSchema)
    notes.push('Add Organization or LocalBusiness JSON-LD so AI assistants can confidently identify who you are and where you operate.')
  if (!hasFaqSchema)
    notes.push('Consider adding FAQPage schema to service/location pages — AI answer engines frequently lift FAQ content verbatim.')
  if (headingStructureScore < 60)
    notes.push('Tighten heading hierarchy (one H1, logical H2/H3 nesting) so content is easier for AI crawlers to chunk and cite.')
  if (answerableContentScore < 60)
    notes.push('Add direct, question-style headings (e.g. "How much does X cost in [City]?") followed by a concise answer paragraph — this pattern is favored by AI Overviews and chat assistants.')

  const score = clampScore(
    (Number(hasOrganizationSchema || hasLocalBusinessSchema) * 25) +
      (Number(hasFaqSchema) * 15) +
      headingStructureScore * 0.3 +
      answerableContentScore * 0.3,
  )

  return {
    hasOrganizationSchema,
    hasLocalBusinessSchema,
    hasFaqSchema,
    structuredDataTypes,
    headingStructureScore,
    answerableContentScore,
    notes,
    score,
  }
}

function isRoughlyMonotonic(levels: number[]) {
  if (levels.length === 0) return false
  let prev = levels[0]
  for (const lvl of levels.slice(1)) {
    if (lvl > prev + 1) return false
    prev = lvl
  }
  return true
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

function buildRecommendations(allIssues: Issue[], geoOpportunityCount: number): Recommendation[] {
  const recs: Recommendation[] = []
  const bySeverityCategory = new Map<string, Issue[]>()
  for (const issue of allIssues) {
    const key = `${issue.category}:${issue.title}`
    if (!bySeverityCategory.has(key)) bySeverityCategory.set(key, [])
    bySeverityCategory.get(key)!.push(issue)
  }

  const impactFor = (sev: IssueSeverity): Recommendation['impact'] =>
    sev === 'critical' || sev === 'high' ? 'high' : sev === 'medium' ? 'medium' : 'low'

  const effortGuess = (title: string): Recommendation['effort'] => {
    if (/schema|structured data/i.test(title)) return 'medium'
    if (/broken link/i.test(title)) return 'medium'
    if (/title|meta|alt/i.test(title)) return 'low'
    if (/location page|service page/i.test(title)) return 'high'
    return 'medium'
  }

  for (const issue of allIssues) {
    recs.push({
      id: nextId('rec'),
      title: `Fix: ${issue.title}`,
      description: issue.description,
      impact: impactFor(issue.severity),
      effort: effortGuess(issue.title),
      category: issue.category,
    })
  }

  if (geoOpportunityCount > 0) {
    recs.push({
      id: nextId('rec'),
      title: `Build ${Math.min(geoOpportunityCount, 24)} city + service landing pages`,
      description: 'Each city/service combination without a dedicated page is lost local search and AI-citation surface area. Prioritize the highest-population or highest-demand cities first.',
      impact: 'high',
      effort: 'high',
      category: 'geo',
    })
  }

  // Deduplicate by title, sort by impact then effort (quick wins first)
  const seen = new Set<string>()
  const deduped = recs.filter((r) => (seen.has(r.title) ? false : (seen.add(r.title), true)))

  const impactRank = { high: 0, medium: 1, low: 2 }
  const effortRank = { low: 0, medium: 1, high: 2 }
  deduped.sort((a, b) => {
    const impactDiff = impactRank[a.impact] - impactRank[b.impact]
    if (impactDiff !== 0) return impactDiff
    return effortRank[a.effort] - effortRank[b.effort]
  })

  return deduped
}

// ---------------------------------------------------------------------------
// Category score labels
// ---------------------------------------------------------------------------

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 50) return 'Needs Work'
  if (score >= 25) return 'Poor'
  return 'Critical'
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function runAudit(crawl: CrawlResult, mode: AuditMode, serviceAreaCities: string[] = []): AuditReport {
  const pages = crawl.pages

  const technical = analyzeTechnical(pages)
  const local = analyzeLocal(pages)
  const geo = analyzeGeo(pages, serviceAreaCities)
  const aiReadiness = analyzeAiReadiness(pages)

  const allIssues = [...technical.allIssues, ...local.allIssues].sort(
    (a, b) => b.priorityScore - a.priorityScore,
  )

  const overall = clampScore(
    technical.score * 0.35 + local.score * 0.25 + geo.score * 0.15 + aiReadiness.score * 0.25,
  )

  const recommendations = buildRecommendations(allIssues, geo.opportunities.filter((o) => !o.hasPage).length)

  const report: AuditReport = {
    id: nextId('audit'),
    mode,
    rootUrl: crawl.rootUrl,
    generatedAt: crawl.crawledAt,
    pagesAnalyzed: pages.length,
    scores: {
      overall,
      technical: { score: technical.score, label: scoreLabel(technical.score), summary: summarize(technical.allIssues.length, 'technical SEO issue') },
      local: { score: local.score, label: scoreLabel(local.score), summary: summarize(local.napIssues.length, 'local SEO issue') },
      geo: { score: geo.score, label: scoreLabel(geo.score), summary: `${geo.opportunities.filter((o) => !o.hasPage).length} untapped city/service page opportunities` },
      aiReadiness: { score: aiReadiness.score, label: scoreLabel(aiReadiness.score), summary: summarize(aiReadiness.notes.length, 'AI-readiness gap') },
    },
    technical: technical.result,
    local: { nap: local.nap, locationPages: local.locationPages, servicePages: local.servicePages, napIssues: local.napIssues },
    geo: { opportunities: geo.opportunities, citiesFound: geo.citiesFound, servicesFound: geo.servicesFound },
    aiReadiness: {
      hasOrganizationSchema: aiReadiness.hasOrganizationSchema,
      hasLocalBusinessSchema: aiReadiness.hasLocalBusinessSchema,
      hasFaqSchema: aiReadiness.hasFaqSchema,
      structuredDataTypes: aiReadiness.structuredDataTypes,
      headingStructureScore: aiReadiness.headingStructureScore,
      answerableContentScore: aiReadiness.answerableContentScore,
      notes: aiReadiness.notes,
    },
    allIssues,
    recommendations,
  }

  return report
}

function summarize(count: number, noun: string) {
  if (count === 0) return `No ${noun}s found`
  return `${count} ${noun}${count === 1 ? '' : 's'} found`
}
