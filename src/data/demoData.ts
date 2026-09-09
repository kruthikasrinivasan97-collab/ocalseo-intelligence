import type {
  CrawlResult,
  DemoBusinessProfile,
  ImageInfo,
  LinkInfo,
  PageData,
} from '../types'

// ---------------------------------------------------------------------------
// DEMO DATA — fictional business used to power Demo Mode.
// "Rhine Plumbing" — a plumbing & heating company in Bonn, Germany.
// None of this is fetched live; it exists so recruiters/reviewers can use
// the full product instantly with zero setup.
// ---------------------------------------------------------------------------

const DOMAIN = 'https://www.rhineplumbing.de'

function img(src: string, alt: string | null): ImageInfo {
  return { src, alt, hasAlt: !!alt && alt.trim().length > 0 }
}

function link(href: string, text: string, isInternal: boolean, isBroken = false, statusCode = 200): LinkInfo {
  return { href, text, isInternal, isBroken, statusCode: isBroken ? statusCode : 200 }
}

const NAP_CANONICAL = {
  name: 'Rhine Plumbing GmbH',
  address: 'Poppelsdorfer Allee 42, 53115 Bonn, Germany',
  phone: '+49 228 555 0142',
}

// Sensible defaults for the mobile-friendliness / performance signals added
// after the initial build. Most demo pages are well-optimized; a couple of
// pages intentionally override these to demonstrate the new issue types.
const GOOD_MOBILE_PERF = {
  hasViewportMeta: true,
  imagesWithSrcset: 1,
  renderBlockingScripts: 1,
  imagesMissingLazyLoading: 0,
  possiblyJsRendered: false,
}

// Home page — clean, mostly well-optimized
const home: PageData = {
  url: `${DOMAIN}/`,
  path: '/',
  statusCode: 200,
  title: 'Rhine Plumbing GmbH | Emergency Plumber & Heating Repair in Bonn',
  metaDescription: 'Licensed plumbing and heating company serving Bonn and the Rhine-Sieg region. 24/7 emergency callouts, boiler repair, drain cleaning & bathroom remodeling.',
  h1s: ['Bonn’s Trusted Emergency Plumber Since 2009'],
  headings: [
    { level: 1, text: 'Bonn’s Trusted Emergency Plumber Since 2009' },
    { level: 2, text: 'Our Services' },
    { level: 2, text: 'Why Homeowners Choose Rhine Plumbing' },
    { level: 3, text: '24/7 Emergency Response' },
    { level: 3, text: 'Licensed & Insured Technicians' },
    { level: 2, text: 'Service Areas' },
    { level: 2, text: 'What Our Customers Say' },
  ],
  canonical: `${DOMAIN}/`,
  robotsMeta: 'index, follow',
  isIndexable: true,
  wordCount: 640,
  images: [
    img('/img/hero-plumber-bonn.jpg', 'Rhine Plumbing technician repairing a boiler in Bonn'),
    img('/img/team-photo.jpg', 'Rhine Plumbing team outside the Bonn office'),
    img('/img/van-fleet.jpg', 'Rhine Plumbing service van fleet'),
  ],
  links: [
    link(`${DOMAIN}/services`, 'Our Services', true),
    link(`${DOMAIN}/services/emergency-plumbing`, 'Emergency Plumbing', true),
    link(`${DOMAIN}/services/drain-cleaning`, 'Drain Cleaning', true),
    link(`${DOMAIN}/services/boiler-repair`, 'Boiler Repair', true),
    link(`${DOMAIN}/services/bathroom-remodeling`, 'Bathroom Remodeling', true),
    link(`${DOMAIN}/locations/bonn`, 'Plumber in Bonn', true),
    link(`${DOMAIN}/locations/cologne`, 'Plumber in Cologne', true),
    link(`${DOMAIN}/about`, 'About Us', true),
    link(`${DOMAIN}/contact`, 'Contact', true),
    link(`${DOMAIN}/blog/how-to-prevent-frozen-pipes`, 'How to Prevent Frozen Pipes', true),
    link('https://www.google.com/maps/place/Rhine+Plumbing', 'Get Directions', false),
    link('https://facebook.com/rhineplumbing', 'Facebook', false),
  ],
  schemaBlocks: [
    { type: 'LocalBusiness', valid: true },
    { type: 'Organization', valid: true },
  ],
  pageType: 'home',
  detectedCity: 'Bonn',
  detectedService: null,
  napMentions: [{ ...NAP_CANONICAL, source: 'schema' }, { ...NAP_CANONICAL, source: 'footer' }],
  loadTimeMs: 820,
  ...GOOD_MOBILE_PERF,
  renderBlockingScripts: 3, // homepage loads a chat widget + analytics + carousel script synchronously
}

const servicesOverview: PageData = {
  url: `${DOMAIN}/services`,
  path: '/services',
  statusCode: 200,
  title: 'Plumbing & Heating Services | Rhine Plumbing Bonn',
  metaDescription: 'Explore emergency plumbing, drain cleaning, boiler repair, and bathroom remodeling services from Rhine Plumbing, serving Bonn and the Rhine-Sieg region.',
  h1s: ['Our Plumbing & Heating Services'],
  headings: [
    { level: 1, text: 'Our Plumbing & Heating Services' },
    { level: 2, text: 'Emergency Plumbing' },
    { level: 2, text: 'Drain Cleaning' },
    { level: 2, text: 'Boiler Repair' },
    { level: 2, text: 'Bathroom Remodeling' },
  ],
  canonical: `${DOMAIN}/services`,
  robotsMeta: 'index, follow',
  isIndexable: true,
  wordCount: 410,
  images: [img('/img/services-overview.jpg', 'Overview of Rhine Plumbing services')],
  links: [
    link(`${DOMAIN}/`, 'Home', true),
    link(`${DOMAIN}/services/emergency-plumbing`, 'Emergency Plumbing', true),
    link(`${DOMAIN}/services/drain-cleaning`, 'Drain Cleaning', true),
    link(`${DOMAIN}/services/boiler-repair`, 'Boiler Repair', true),
    link(`${DOMAIN}/services/bathroom-remodeling`, 'Bathroom Remodeling', true),
    link(`${DOMAIN}/contact`, 'Get a Quote', true),
  ],
  schemaBlocks: [{ type: 'BreadcrumbList', valid: true }],
  pageType: 'other',
  detectedCity: null,
  detectedService: null,
  napMentions: [],
  loadTimeMs: 640,
  ...GOOD_MOBILE_PERF,
}

function servicePage(opts: {
  slug: string
  service: string
  title: string
  metaDescription: string | null
  h1s: string[]
  hasSchema: boolean
  indexable: boolean
  wordCount: number
  missingAltImage?: boolean
  renderBlockingScripts?: number
  imagesMissingLazyLoading?: number
}): PageData {
  const url = `${DOMAIN}/services/${opts.slug}`
  return {
    url,
    path: `/services/${opts.slug}`,
    statusCode: 200,
    title: opts.title,
    metaDescription: opts.metaDescription,
    h1s: opts.h1s,
    headings: [
      ...opts.h1s.map((t) => ({ level: 1 as const, text: t })),
      { level: 2 as const, text: `How much does ${opts.service.toLowerCase()} cost in Bonn?` },
      { level: 2 as const, text: 'Why Choose Rhine Plumbing' },
      { level: 2 as const, text: 'Frequently Asked Questions' },
    ],
    canonical: url,
    robotsMeta: opts.indexable ? 'index, follow' : 'noindex, follow',
    isIndexable: opts.indexable,
    wordCount: opts.wordCount,
    images: [
      img(`/img/${opts.slug}-1.jpg`, opts.missingAltImage ? null : `${opts.service} technician at work in Bonn`),
      img(`/img/${opts.slug}-2.jpg`, `Before and after ${opts.service.toLowerCase()}`),
    ],
    links: [
      link(`${DOMAIN}/`, 'Home', true),
      link(`${DOMAIN}/services`, 'All Services', true),
      link(`${DOMAIN}/contact`, 'Request a Quote', true),
      link(`${DOMAIN}/locations/bonn`, 'Serving Bonn', true),
    ],
    schemaBlocks: opts.hasSchema ? [{ type: 'Service', valid: true }, { type: 'FAQPage', valid: true }] : [],
    pageType: 'service',
    detectedCity: null,
    detectedService: opts.service,
    napMentions: [],
    loadTimeMs: 700 + Math.round(Math.random() * 200),
    ...GOOD_MOBILE_PERF,
    renderBlockingScripts: opts.renderBlockingScripts ?? GOOD_MOBILE_PERF.renderBlockingScripts,
    imagesMissingLazyLoading: opts.imagesMissingLazyLoading ?? GOOD_MOBILE_PERF.imagesMissingLazyLoading,
  }
}

const emergencyPlumbing = servicePage({
  slug: 'emergency-plumbing',
  service: 'Emergency Plumbing',
  title: '24/7 Emergency Plumber in Bonn | Rhine Plumbing',
  metaDescription: 'Burst pipe or major leak? Rhine Plumbing offers 24/7 emergency plumbing response across Bonn with a 45-minute average arrival time.',
  h1s: ['24/7 Emergency Plumbing in Bonn'],
  hasSchema: true,
  indexable: true,
  wordCount: 520,
})

const drainCleaning = servicePage({
  slug: 'drain-cleaning',
  service: 'Drain Cleaning',
  title: 'Professional Drain Cleaning Bonn', // short title, will flag
  metaDescription: null, // missing meta description on purpose
  h1s: ['Drain Cleaning'],
  hasSchema: true,
  indexable: true,
  wordCount: 380,
  missingAltImage: true,
})

const boilerRepair = servicePage({
  slug: 'boiler-repair',
  service: 'Boiler Repair',
  title: 'Boiler Repair & Servicing in Bonn | Rhine Plumbing GmbH | Fast Same-Day Response for Homeowners',
  metaDescription: 'Fast, certified boiler repair and annual servicing in Bonn. Same-day appointments available for gas and electric boiler systems.',
  h1s: ['Boiler Repair', 'Boiler Servicing'], // multiple H1s on purpose
  hasSchema: false, // missing schema on purpose
  indexable: true,
  wordCount: 455,
  imagesMissingLazyLoading: 5, // gallery of before/after photos, none lazy-loaded
})

const bathroomRemodeling = servicePage({
  slug: 'bathroom-remodeling',
  service: 'Bathroom Remodeling',
  title: 'Bathroom Remodeling Bonn | Rhine Plumbing',
  metaDescription: 'Full bathroom remodeling services in Bonn, from plumbing rough-in to fixture installation. Free on-site quotes.',
  h1s: ['Bathroom Remodeling Services in Bonn'],
  hasSchema: true,
  indexable: false, // accidental noindex on purpose
  wordCount: 490,
})

function locationPage(opts: { city: string; slug: string; hasContent: boolean }): PageData {
  const url = `${DOMAIN}/locations/${opts.slug}`
  return {
    url,
    path: `/locations/${opts.slug}`,
    statusCode: 200,
    title: `Plumber in ${opts.city} | Rhine Plumbing`,
    metaDescription: `Need a licensed plumber in ${opts.city}? Rhine Plumbing offers emergency repairs, drain cleaning, and boiler service with local technicians.`,
    h1s: [`Trusted Plumber in ${opts.city}`],
    headings: [
      { level: 1, text: `Trusted Plumber in ${opts.city}` },
      { level: 2, text: `Plumbing Services We Offer in ${opts.city}` },
      { level: 2, text: `Why ${opts.city} Homeowners Choose Us` },
    ],
    canonical: url,
    robotsMeta: 'index, follow',
    isIndexable: true,
    wordCount: opts.hasContent ? 380 : 0,
    images: [img(`/img/${opts.slug}-location.jpg`, `Rhine Plumbing van in ${opts.city}`)],
    links: [
      link(`${DOMAIN}/`, 'Home', true),
      link(`${DOMAIN}/services`, 'Services', true),
      link(`${DOMAIN}/contact`, 'Contact', true),
    ],
    schemaBlocks: [{ type: 'LocalBusiness', valid: true }],
    pageType: 'location',
    detectedCity: opts.city,
    detectedService: null,
    napMentions: [{ ...NAP_CANONICAL, source: 'text' }],
    loadTimeMs: 710,
    ...GOOD_MOBILE_PERF,
  }
}

const locationBonn = locationPage({ city: 'Bonn', slug: 'bonn', hasContent: true })
// Cologne location page exists but with a slightly different phone number formatting -> NAP inconsistency
const locationCologne: PageData = {
  ...locationPage({ city: 'Cologne', slug: 'cologne', hasContent: true }),
  napMentions: [{ name: 'Rhine Plumbing GmbH', address: 'Poppelsdorfer Allee 42, 53115 Bonn, Germany', phone: '0228-5550142', source: 'text' }],
}

const about: PageData = {
  url: `${DOMAIN}/about`,
  path: '/about',
  statusCode: 200,
  title: 'About Rhine Plumbing | Family-Owned Since 2009',
  metaDescription: 'Rhine Plumbing GmbH has served Bonn and the Rhine-Sieg region since 2009. Meet our licensed, insured team of plumbing and heating technicians.',
  h1s: ['About Rhine Plumbing'],
  headings: [
    { level: 1, text: 'About Rhine Plumbing' },
    { level: 2, text: 'Our Story' },
    { level: 2, text: 'Licenses & Certifications' },
  ],
  canonical: `${DOMAIN}/about`,
  robotsMeta: 'index, follow',
  isIndexable: true,
  wordCount: 520,
  images: [img('/img/founder.jpg', 'Founder of Rhine Plumbing, Klaus Weber')],
  links: [
    link(`${DOMAIN}/`, 'Home', true),
    link(`${DOMAIN}/contact`, 'Contact', true),
    link(`${DOMAIN}/careers`, 'Careers', true, true, 404), // broken link on purpose
  ],
  schemaBlocks: [{ type: 'Organization', valid: true }],
  pageType: 'other',
  detectedCity: null,
  detectedService: null,
  napMentions: [{ ...NAP_CANONICAL, source: 'text' }],
  loadTimeMs: 590,
  ...GOOD_MOBILE_PERF,
}

const contact: PageData = {
  url: `${DOMAIN}/contact`,
  path: '/contact',
  statusCode: 200,
  title: 'Contact Rhine Plumbing | Bonn, Germany',
  metaDescription: 'Get in touch with Rhine Plumbing for a free quote. Call +49 228 555 0142 or fill out our contact form. Serving Bonn and surrounding areas.',
  h1s: ['Contact Us'],
  headings: [
    { level: 1, text: 'Contact Us' },
    { level: 2, text: 'Request a Free Quote' },
    { level: 2, text: 'Office Hours' },
  ],
  canonical: `${DOMAIN}/contact`,
  robotsMeta: 'index, follow',
  isIndexable: true,
  wordCount: 260,
  images: [img('/img/office-exterior.jpg', 'Rhine Plumbing office exterior in Bonn')],
  links: [
    link(`${DOMAIN}/`, 'Home', true),
    link('tel:+49228555142', 'Call Us', false),
  ],
  schemaBlocks: [{ type: 'LocalBusiness', valid: true }],
  pageType: 'contact',
  detectedCity: 'Bonn',
  detectedService: null,
  napMentions: [{ ...NAP_CANONICAL, source: 'schema' }],
  loadTimeMs: 540,
  ...GOOD_MOBILE_PERF,
}

const blogPost: PageData = {
  url: `${DOMAIN}/blog/how-to-prevent-frozen-pipes`,
  path: '/blog/how-to-prevent-frozen-pipes',
  statusCode: 200,
  title: 'How to Prevent Frozen Pipes This Winter | Rhine Plumbing',
  metaDescription: 'Learn how Bonn homeowners can prevent frozen and burst pipes during winter with these five simple, low-cost precautions.',
  h1s: ['How to Prevent Frozen Pipes This Winter'],
  headings: [
    { level: 1, text: 'How to Prevent Frozen Pipes This Winter' },
    { level: 2, text: 'Why Do Pipes Freeze?' },
    { level: 2, text: 'What Temperature Should I Set My Heating To?' },
    { level: 2, text: '5 Steps to Protect Your Pipes' },
    { level: 2, text: 'What Should I Do If a Pipe Already Burst?' },
  ],
  canonical: `${DOMAIN}/blog/how-to-prevent-frozen-pipes`,
  robotsMeta: 'index, follow',
  isIndexable: true,
  wordCount: 890,
  images: [img('/img/frozen-pipe.jpg', 'Frozen exterior pipe close-up')],
  links: [
    link(`${DOMAIN}/`, 'Home', true),
    link(`${DOMAIN}/services/emergency-plumbing`, 'Emergency Plumbing', true),
  ],
  schemaBlocks: [], // blog has no Article/FAQ schema on purpose
  pageType: 'blog',
  detectedCity: null,
  detectedService: null,
  napMentions: [],
  loadTimeMs: 610,
  ...GOOD_MOBILE_PERF,
  hasViewportMeta: false, // blog runs on an older template that predates the mobile redesign
}

export const demoPages: PageData[] = [
  home,
  servicesOverview,
  emergencyPlumbing,
  drainCleaning,
  boilerRepair,
  bathroomRemodeling,
  locationBonn,
  locationCologne,
  about,
  contact,
  blogPost,
]

export const demoServiceAreaCities = ['Bonn', 'Cologne', 'Koblenz', 'Siegburg', 'Troisdorf']

export const demoCrawlResult: CrawlResult = {
  rootUrl: DOMAIN,
  crawledAt: new Date().toISOString(),
  pages: demoPages,
  crawlErrors: [],
  truncated: false,
  siteWarnings: [],
  usedSitemap: true,
  robotsTxtChecked: true,
  disallowedPathsSkipped: 0,
}

// ---------------------------------------------------------------------------
// Demo marketing analytics (Search-Console / GBP style — sample only)
// ---------------------------------------------------------------------------

function traffic(): { date: string; clicks: number; impressions: number }[] {
  const points: { date: string; clicks: number; impressions: number }[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const weekday = d.getDay()
    const base = weekday === 0 || weekday === 6 ? 0.6 : 1
    const impressions = Math.round((820 + Math.sin(i / 3) * 120 + i * 4) * base)
    const clicks = Math.round(impressions * (0.045 + Math.sin(i / 5) * 0.008))
    points.push({ date: d.toISOString().slice(0, 10), clicks, impressions })
  }
  return points
}

export const demoBusinessProfile: DemoBusinessProfile = {
  name: 'Rhine Plumbing GmbH',
  city: 'Bonn',
  country: 'Germany',
  domain: 'rhineplumbing.de',
  industry: 'Plumbing & Heating Services',
  gbp: {
    businessName: 'Rhine Plumbing GmbH',
    category: 'Plumber',
    address: 'Poppelsdorfer Allee 42, 53115 Bonn, Germany',
    phone: '+49 228 555 0142',
    website: DOMAIN,
    hours: {
      Monday: '7:00–18:00',
      Tuesday: '7:00–18:00',
      Wednesday: '7:00–18:00',
      Thursday: '7:00–18:00',
      Friday: '7:00–18:00',
      Saturday: '9:00–14:00',
      Sunday: 'Emergency calls only',
    },
    averageRating: 4.7,
    totalReviews: 183,
    photosCount: 46,
    postsLast30Days: 3,
    qAndACount: 12,
    recentReviews: [
      {
        author: 'Anna K.',
        rating: 5,
        date: '2026-08-19',
        text: 'Called at 11pm with a burst pipe and someone was here in 40 minutes. Fixed quickly and explained everything clearly. Highly recommend.',
        platform: 'Google',
      },
      {
        author: 'Markus B.',
        rating: 5,
        date: '2026-08-11',
        text: 'Replaced our old boiler ahead of winter. Fair quote, clean work, and they even sorted the paperwork for the subsidy program.',
        platform: 'Google',
      },
      {
        author: 'Sabine R.',
        rating: 4,
        date: '2026-07-28',
        text: 'Good work on our bathroom remodel, took a day longer than quoted but the quality was worth it.',
        platform: 'Google',
      },
      {
        author: 'Jonas W.',
        rating: 3,
        date: '2026-07-15',
        text: 'Drain cleaning fixed the immediate issue but it backed up again within a month. Had to call a second time.',
        platform: 'Facebook',
      },
      {
        author: 'Petra H.',
        rating: 5,
        date: '2026-06-30',
        text: 'Friendly, on time, and reasonably priced. This is the third time we’ve used Rhine Plumbing and they never disappoint.',
        platform: 'Google',
      },
    ],
  },
  keywordRankings: [
    { keyword: 'plumber bonn', position: 4, previousPosition: 6, clicks: 312, impressions: 5400, ctr: 0.058, searchVolume: 1300, intent: 'local' },
    { keyword: 'emergency plumber bonn', position: 2, previousPosition: 3, clicks: 268, impressions: 2100, ctr: 0.128, searchVolume: 480, intent: 'transactional' },
    { keyword: 'boiler repair bonn', position: 7, previousPosition: 5, clicks: 94, impressions: 1900, ctr: 0.049, searchVolume: 590, intent: 'transactional' },
    { keyword: 'drain cleaning bonn', position: 11, previousPosition: 9, clicks: 41, impressions: 1400, ctr: 0.029, searchVolume: 320, intent: 'transactional' },
    { keyword: 'plumber cologne', position: 18, previousPosition: 22, clicks: 22, impressions: 2600, ctr: 0.008, searchVolume: 2100, intent: 'local' },
    { keyword: 'bathroom remodeling bonn', position: 9, previousPosition: 9, clicks: 37, impressions: 980, ctr: 0.038, searchVolume: 260, intent: 'commercial' },
    { keyword: 'plumber near me', position: 15, previousPosition: 19, clicks: 58, impressions: 4200, ctr: 0.014, searchVolume: 9900, intent: 'local' },
    { keyword: 'plumber koblenz', position: 34, previousPosition: 31, clicks: 3, impressions: 640, ctr: 0.005, searchVolume: 480, intent: 'local' },
    { keyword: 'heating repair bonn', position: 6, previousPosition: 8, clicks: 61, impressions: 1100, ctr: 0.055, searchVolume: 310, intent: 'transactional' },
    { keyword: 'how to prevent frozen pipes', position: 3, previousPosition: 3, clicks: 145, impressions: 3800, ctr: 0.038, searchVolume: 1600, intent: 'informational' },
  ],
  trafficHistory: traffic(),
  competitorNames: ['Kölner Sanitär Profis', 'Bonn24 Notdienst', 'Heizung Meier GmbH'],
}
