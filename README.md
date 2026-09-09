# LocalSEO Intelligence

**[🔗 Live demo](https://YOUR-SITE-NAME.netlify.app)** — click "Try Demo" for an instant sample audit, no signup required.

A free, portfolio-ready **Local SEO + GEO (AI Search) Audit** web app for small businesses. Built with React, TypeScript, Vite, Tailwind CSS, and Netlify Functions — deployable on **Netlify's free tier for $0**, with **no paid APIs required**. Every core feature (the full crawl-based audit) works with zero setup and zero signup; one optional feature (real Google Search Console rankings) works with free signup — see [Optional: real Google Search Console data](#optional-real-google-search-console-data) below.

Try it instantly in **Demo Mode** (a fully realistic sample audit for a fictional Bonn, Germany plumbing company), or paste in any public website URL to run a **live audit**.

## Why this exists

Local businesses want to know: *"Why aren't we showing up in Google, in the local map pack, or in AI answers like ChatGPT/Gemini/Perplexity?"* Commercial tools that answer this (Ahrefs, SEMrush, Moz, BrightLocal, Local Falcon, DataForSEO) all require paid subscriptions. This app answers the same core questions using **deterministic, rule-based analysis of what the crawler can actually see** — no paid SEO or AI APIs anywhere in the stack.

## Features

- **Landing page** with a clear "Try Demo" CTA and a live-audit URL form
- **Demo Mode** — instant, realistic sample data for "Rhine Plumbing" (Bonn, Germany): pages, technical issues, NAP data, keyword rankings, Search-Console-style traffic, a Google Business Profile mock, and reviews. No login, no network calls.
- **Live website audit by URL**, powered by a Netlify Function that crawls a handful of public pages
- **SEO Health Score** — weighted composite of all categories below
- **Technical SEO audit** — title/meta description/H1 checks, broken-link detection, canonical & indexability checks, image alt-text coverage, structured data (JSON-LD schema) detection, internal-link mapping & orphan-page detection
- **Local SEO audit** — NAP (Name/Address/Phone) consistency checks across the whole site, location-page and service-page inventory
- **GEO opportunity finder** — cross-references your service-area cities against the services you actually have dedicated pages for, and lists the missing city × service combinations with a suggested URL slug
- **AI Search Readiness score** — schema coverage (Organization/LocalBusiness/FAQ), heading-hierarchy quality, and "answerable content" patterns that AI answer engines (AI Overviews, ChatGPT, Perplexity, etc.) tend to favor
- **Rule-based recommendations** with impact/effort scoring, sorted so quick wins surface first
- **Charts & tables** (via Recharts): score breakdown, keyword position chart, 30-day traffic trend (demo), issue tables
- **Printable SEO report** — a clean print view, plus a real **Download PDF** button (client-side, via `jspdf`/`html2canvas-pro`)
- **Responsive, modern SaaS-style dashboard** with tabs for every audit category
- **Error & loading states** throughout the live-audit flow
- **robots.txt-aware crawling** — the live crawler fetches and respects `robots.txt` `Disallow` rules before fetching any page
- **sitemap.xml-seeded crawling** — if a sitemap is declared (via `robots.txt` or the default `/sitemap.xml`), it's used to discover real pages (including one level of sitemap-index nesting) instead of relying only on homepage links
- **Priority-based crawl ordering** — within the small per-audit page budget, likely location/service/contact pages (and pages matching your listed service-area cities) are crawled before generic pages
- **Mobile-friendliness checks** — flags a missing responsive viewport meta tag and low `srcset` adoption on image-heavy pages
- **Performance / Core Web Vitals proxies** — static-HTML heuristics for render-blocking scripts and images missing `loading="lazy"` (not a real Lighthouse run — see limitations below)
- **JavaScript-rendering detection** — flags when crawled pages return very little text relative to their script tags, a strong sign the real content is client-side rendered and wasn't visible to the crawler, with a clear on-dashboard warning instead of a silently low score
- **Optional real Google Search Console data** — for a live audit, connect your own Search Console account (free, OAuth, one click) to replace demo-style rankings with real keyword positions, clicks, impressions, and traffic for that site — see setup below

Everything is clearly labeled **DEMO DATA** (amber badge) or **LIVE AUDIT** (green badge) so it's never ambiguous which mode you're looking at.

## What this app deliberately does NOT do

- No paid SEO APIs (Ahrefs, SEMrush, Moz, DataForSEO, BrightLocal, Local Falcon) — none are used or required
- No paid AI APIs (OpenAI, Anthropic, etc.) — all scoring is deterministic, rule-based TypeScript, not LLM calls
- No scraping of Google Search or Google Maps
- No dependency on Google Search Console or Google Business Profile for any core feature — the full crawl-based audit (Technical/Local/GEO/AI Readiness) works with zero accounts of any kind. Search Console can *optionally* be connected for real ranking data (see below); Google Business Profile is not integrated at all, since Google gates that API behind manual production approval
- No login/auth required for the app itself — the one optional Search Console connection uses Google's own OAuth, not a custom account system

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4, Recharts for charts, lucide-react for icons, `jspdf`/`html2canvas-pro` (lazy-loaded, MIT-licensed, free) for the Download PDF button
- **Backend:** Netlify Functions written in TypeScript — `audit.ts` (crawl + SSRF-guarded fetch, using `node-html-parser`, no headless browser) and `gsc-*.ts` (optional Search Console OAuth, using `@netlify/blobs` — free, built into Netlify, for a single-use data hand-off, not a database)
- **Analysis engine:** `src/lib/analyzer.ts` is a pure, isomorphic TypeScript module that scores a `CrawlResult`. Demo Mode and Live Mode both run through the *exact same* analyzer, so the scoring logic is identical regardless of data source.

## Known limitations (by design, to stay free)

- **No headless-browser rendering.** The crawler does a plain HTTP fetch + static HTML parse — it does not execute JavaScript. Sites that render their real content client-side (React/Vue/Angular SPAs without server-side rendering) will show mostly-empty pages to the crawler. The app detects this pattern and surfaces a clear warning banner rather than just showing a misleadingly low score. Real headless-browser rendering (Playwright/Puppeteer) would need a paid function tier — deliberately not used here.
- **Performance signals are static-HTML proxies, not a real Lighthouse/Core Web Vitals run.** Render-blocking-script and lazy-loading checks are inferred from markup, not from actual load timing.
- **Small crawl budget.** Netlify's free function tier has a short execution timeout, so each live audit crawls at most ~6 pages (prioritized by sitemap.xml + likely location/service/contact URLs) within a ~9-second budget.

## SSRF protection (live crawling)

Because the live-audit endpoint fetches a user-supplied URL from the server, `netlify/functions/ssrf.ts` enforces:

- Only `http:`/`https:` protocols, only default ports (80/443)
- No embedded credentials in the URL
- Rejects `localhost`, `*.localhost`, `0.0.0.0`, and known cloud-metadata hostnames
- Resolves the hostname via DNS and blocks private/reserved IPv4 ranges (RFC1918, loopback, link-local incl. `169.254.169.254` cloud metadata, CGNAT, multicast, TEST-NET) and IPv6 equivalents (loopback, link-local, unique-local `fc00::/7`)
- Re-validates every URL immediately before each fetch during crawling (defense in depth against redirect-based bypasses)
- Hard timeouts (per-request and a global crawl budget) and a response-size cap to keep the function inside Netlify's free-tier function limits

This is a solid, portfolio-appropriate SSRF defense. A production system handling untrusted input at scale would add IP-pinning per connection (to fully close DNS-rebinding races) and an egress proxy/allowlist — noted here for transparency.

## Optional: real Google Search Console data

Everything described above works the moment you open the app — no accounts, no setup. Separately, the **Search Console** tab on a *live* audit (Demo Mode is unaffected) offers a "Connect Search Console" button. This is entirely opt-in and lets a site owner pull their own **real** keyword positions, clicks, impressions, and 30-day traffic — no paid API, no manual approval process (unlike Google Business Profile, which this app deliberately does not integrate — see [Known limitations](#known-limitations-by-design-to-stay-free)).

**How it works:** the user clicks "Connect Search Console" → signs in with Google and grants read-only access → is redirected straight back to the audit with real data. Nothing is stored after that single hand-off (`netlify/functions/gsc-callback.ts` fetches the data and hands it to the browser once via a short-lived Netlify Blobs entry that's deleted on first read — no accounts, sessions, or databases in this app).

**To enable it on your deployment** (skip this if you don't need real ranking data — the app works fully without it):

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a project (free) and enable the **Google Search Console API**.
2. Under **APIs & Services → Credentials**, create an **OAuth client ID** (type: Web application).
3. Add an authorized redirect URI: `https://<your-site-name>.netlify.app/api/gsc/callback` (use your real deployed Netlify URL, or custom domain if you attach one).
4. Under **OAuth consent screen**, add the scope `.../auth/webmasters.readonly` and add yourself (or intended users) as a test user if the app is in "Testing" publishing status.
5. In Netlify: **Site configuration → Environment variables**, add:
   - `GOOGLE_CLIENT_ID` — from step 2
   - `GOOGLE_CLIENT_SECRET` — from step 2
6. Redeploy. The "Connect Search Console" button will now work for any site the connecting Google account has **verified Search Console access to**.

If these env vars aren't set, the button shows a clear inline message instead of failing silently — the rest of the app is completely unaffected either way.

## Project structure

```
├── src/
│   ├── types/            # Shared TypeScript types (PageData, AuditReport, etc.)
│   ├── data/demoData.ts  # Realistic "Rhine Plumbing" demo dataset
│   ├── lib/
│   │   ├── analyzer.ts   # Deterministic SEO/GEO/AI-readiness scoring engine
│   │   └── api.ts        # Demo + live audit orchestration
│   ├── state/            # React context for audit state (incl. GSC OAuth round-trip)
│   ├── components/       # UI primitives + dashboard tab components
│   └── pages/             # LandingPage, DashboardPage
├── netlify/functions/
│   ├── ssrf.ts            # SSRF allowlist/validation
│   ├── crawler.ts         # Crawler + HTML extraction (shared PageData shape)
│   ├── audit.ts           # HTTP handler: POST /api/audit
│   ├── gsc-shared.ts      # Shared Search Console OAuth/API helpers
│   ├── gsc-auth-start.ts  # GET /api/gsc/start — redirects to Google consent screen
│   ├── gsc-callback.ts    # GET /api/gsc/callback — token exchange + data fetch
│   └── gsc-result.ts      # GET /api/gsc/result — one-time result hand-off
├── netlify.toml           # Build config, redirects, security headers
└── README.md
```

## Local development

```bash
npm install
npm run dev
```

The dev server runs the frontend only; live audits need the Netlify Function running too. Use the Netlify CLI for full local parity:

```bash
npm install -g netlify-cli
netlify dev
```

This serves the frontend **and** proxies `/api/audit` to the local function.

## Build & verify

```bash
npm install
npm run typecheck   # tsc for the app + the Netlify Function
npm run build        # tsc -b && vite build -> outputs to dist/
```

## Deploying to GitHub + Netlify (free)

### 1. Push to GitHub

```bash
cd localseo-intelligence
git init
git add .
git commit -m "Initial commit: LocalSEO Intelligence"
git branch -M main
git remote add origin https://github.com/<your-username>/localseo-intelligence.git
git push -u origin main
```

### 2. Deploy on Netlify (free tier)

**Option A — via the Netlify dashboard (recommended for a first deploy):**

1. Go to [app.netlify.com](https://app.netlify.com) and sign in (free account is enough).
2. Click **Add new site → Import an existing project**.
3. Choose **GitHub** and select your `localseo-intelligence` repository.
4. Netlify will auto-detect the settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
5. Click **Deploy site**. That's it — no environment variables are required for any core feature.
6. Once deployed, your app is live at `https://<your-site-name>.netlify.app`. You can rename the site (Site configuration → Change site name) or attach a custom domain, both free.

**Option B — via the Netlify CLI:**

```bash
npm install -g netlify-cli
netlify login
netlify init      # links this folder to a new or existing Netlify site
netlify deploy --prod
```

### 3. Verify after deploy

- Open the site URL, click **Try Demo** — the dashboard should populate instantly with the Rhine Plumbing sample data.
- Enter a real public URL (e.g. your own site) in **Run Live Audit** and confirm it crawls and scores correctly.
- Refresh on any route — the SPA redirect in `netlify.toml` (`/* → /index.html`) ensures deep links don't 404.

No further configuration, secrets, or API keys are needed for the app to be fully functional.
