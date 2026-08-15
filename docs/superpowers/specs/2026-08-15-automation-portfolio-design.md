# Automation Portfolio — Design Spec

## Goal

Build a Next.js portfolio site hosted on Vercel that showcases Mark Calma's automation demos to small agency prospects. A prospect clicks a link from a LinkedIn DM or post, lands on a demo page, watches a 2-3 minute video, sees how the workflow runs, and books a 15-minute call.

## Architecture

Static Next.js 14 (App Router) + Tailwind CSS site. No database, no auth, no CMS. All content lives in a single TypeScript data file — adding a new demo means adding one object. Deployed on Vercel via GitHub push.

## Pages

### `/` — Home
- Hero headline and subheadline
- Grid of demo cards (one per demo)
- Footer with Calendly CTA

### `/demo/[slug]` — Demo Page (dynamic)
- Demo title + pain hook
- Google Drive video embed (full width)
- "How it works" — 4-5 numbered steps in plain English
- Workflow screenshot (n8n canvas, provided by Mark)
- Tech stack tags
- "Book a free 15-min call" button → Calendly

## File Structure

```
src/
  app/
    layout.tsx              # Root layout: fonts, metadata, global styles
    page.tsx                # Home page
    demo/
      [slug]/
        page.tsx            # Dynamic demo page
  components/
    DemoCard.tsx            # Card used on home grid
    VideoEmbed.tsx          # Google Drive iframe wrapper
    HowItWorks.tsx          # Numbered steps list
    WorkflowDiagram.tsx     # Workflow screenshot in dark card
    StackTag.tsx            # Monospace pill tag
    CTAButton.tsx           # Calendly CTA button
    Nav.tsx                 # Top nav (logo + CTA)
  data/
    demos.ts                # All demo content — single source of truth
    config.ts               # Site-wide constants: Calendly URL, author name
public/
  workflows/                # n8n screenshots (Mark provides)
    demo-1.png
    demo-2.png
    demo-3.png
    demo-4.png
  og/                       # Open Graph images (one per demo, generated)
    home.png
```

## Data Model

```typescript
// src/data/demos.ts
export interface DemoStep {
  label: string;       // short label, e.g. "Form submitted"
  description: string; // one sentence, plain English
}

export interface Demo {
  slug: string;         // "demo-1" — used as URL segment and image filename
  number: number;       // 1, 2, 3, 4
  title: string;        // "Client Onboarding"
  tagline: string;      // bold one-liner shown on card and page hero
  pain: string;         // 1-2 sentence problem statement
  videoId: string;      // Google Drive file ID (from share URL)
  stack: string[];      // ["n8n", "Claude", "Gmail"] — shown as tags
  steps: DemoStep[];    // 4-5 steps, shown as numbered list
}
```

```typescript
// src/data/config.ts
export const CALENDLY_URL = "https://calendly.com/[MARK_SLUG]"; // Mark fills this in
export const AUTHOR_NAME = "Mark Calma";
export const SITE_TAGLINE = "I build automations that save agencies 10+ hours a week.";
```

## Demo Content

### Demo 1 — Client Onboarding
- **Tagline:** "12 manual steps. Automated in 30 seconds."
- **Pain:** "Most agencies spend 2-3 hours onboarding every new client — manually. Drive folder, Slack channel, Notion workspace, welcome email. 12 steps. Every single client."
- **Stack:** `n8n` `Claude` `Google Drive` `Slack` `Notion` `Gmail`
- **Steps:**
  1. **Webhook fires** — client signs, trigger fires instantly
  2. **Google Drive folder created** — named and organized automatically
  3. **Slack channel opened** — team invited in seconds
  4. **Notion workspace set up** — client added to the database
  5. **Welcome email sent** — Claude writes it personalized to the client's industry and contract value

### Demo 2 — Automated Client Reporting
- **Tagline:** "8 hours of Friday reporting. Done in 60 seconds."
- **Pain:** "Every Friday, agencies pull numbers manually and write summary emails for each client. For a 5-client agency, that's 8 hours gone before a single billable thing happens."
- **Stack:** `n8n` `Claude` `Google Analytics` `Gmail`
- **Steps:**
  1. **Scheduled trigger fires** — every Friday, no manual action needed
  2. **Metrics pulled per client** — Google Analytics data fetched automatically
  3. **Claude writes the insight** — a human-sounding paragraph per client, not a data dump
  4. **Live report page generated** — a unique URL per client, always up to date
  5. **Email sent to each client** — one click to their report page

### Demo 3 — Lead Follow-Up Automation
- **Tagline:** "100% of leads replied to in under 60 seconds."
- **Pain:** "Most agencies reply to maybe half their inbound leads — not because they don't care, but because the team is already slammed. 40 leads a month. 20 never hear back."
- **Stack:** `n8n` `Claude` `Tally` `Google Sheets` `Gmail` `Slack`
- **Steps:**
  1. **Lead submits form** — Tally form, standard contact fields
  2. **Claude scores and replies** — reads their message, scores the lead, writes a personalized response
  3. **Email sent in under 60 seconds** — references what the lead actually wrote, not a template
  4. **Lead logged to Sheets** — score, reasoning, and calculated follow-up dates recorded
  5. **Day 3 and Day 7 emails fire automatically** — Slack alert on Day 7 for high-score leads

### Demo 4 — SEO Content Pipeline
- **Tagline:** "10 hours of content work. 2 minutes. Automated."
- **Pain:** "A content agency producing one blog post per client per week spends 10+ hours on it — research, writing, repurposing for LinkedIn, Instagram, email, Twitter. Every week. For every client."
- **Stack:** `n8n` `Tally` `Firecrawl` `Claude` `Gemini` `Gmail`
- **Steps:**
  1. **SEO manager submits a form** — keyword, target location, and audience
  2. **Firecrawl scrapes top 3 ranking articles** — reads what's currently winning for that keyword
  3. **Claude writes a better article** — 1000-word SEO post with title, meta description, and headings
  4. **Claude repurposes into 4 formats** — LinkedIn, Twitter thread, Instagram caption, email newsletter
  5. **Gemini generates images, package emailed** — hero and square image generated; everything in the inbox in 2 minutes

## Design System

| Token | Value |
|---|---|
| Background | `#0f1117` |
| Surface | `#1a1d27` |
| Border | `#2a2d3a` |
| Accent | `#2563eb` |
| Accent hover | `#1d4ed8` |
| Text primary | `#f8fafc` |
| Text secondary | `#94a3b8` |
| Text muted | `#475569` |
| Success green | `#22c55e` |

**Typography:**
- Headings: Inter (700)
- Body: Inter (400)
- Stack tags / node names: JetBrains Mono (400)

**Component specs:**
- Demo cards: `bg-surface border border-border rounded-xl p-6`, hover lifts with `shadow-lg` and border brightens
- CTA button: `bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3 rounded-lg`
- Stack tags: `font-mono text-xs bg-border text-secondary px-2 py-1 rounded`
- Video embed: `aspect-video w-full rounded-xl overflow-hidden border border-border`
- Workflow image: dark card wrapper, `border border-border rounded-xl p-4 bg-surface`

## Copy

**Home hero:**
```
Mark Calma
I build automations that save agencies 10+ hours a week.
Client onboarding. Reporting. Lead follow-up. Content production. All on autopilot.
[Book a free 15-min call →]
```

**Home card CTA:** "View demo →"

**Demo page CTA:** "Book a free 15-min automation audit →"

**Nav:** Logo left (Mark Calma · Automation) | "Book a call" button right

## SEO & Metadata

Each demo page gets its own `<title>` and `<meta description>`:
- Demo 1: `"Client Onboarding Automation | Mark Calma"`
- Demo 2: `"Automated Client Reporting | Mark Calma"`
- Demo 3: `"Lead Follow-Up Automation | Mark Calma"`
- Demo 4: `"SEO Content Pipeline | Mark Calma"`

Open Graph: title + tagline, dark background OG image per demo.

## What Mark Provides Before Launch

1. **Google Drive share links** — one per demo, sharing set to "Anyone with the link can view". Paste into `videoId` field in `demos.ts` (just the file ID portion of the URL).
2. **n8n workflow screenshots** — one per demo, saved to `public/workflows/demo-[n].png`
3. **Calendly link** — paste into `CALENDLY_URL` in `src/data/config.ts`
4. **Headshot** — optional, 400×400px, saved to `public/mark.jpg`

## Deployment

1. New GitHub repo: `mark-calma-portfolio` (public or private)
2. Push code → connect repo to Vercel → auto-deploy
3. Vercel subdomain: `mark-calma-portfolio.vercel.app`
4. Custom domain: add later via Vercel dashboard → DNS CNAME

No environment variables needed. All content is static.

## Constraints

- No CMS, no database, no auth — static only
- Google Drive video embed only (no Loom, no YouTube)
- One Calendly link site-wide (no per-demo links)
- Mobile responsive — agency owners may view on phone after clicking a LinkedIn DM
- No animations beyond subtle hover states — load fast, look credible
- Adding Demo 5+ requires only: one new object in `demos.ts` + one workflow screenshot
