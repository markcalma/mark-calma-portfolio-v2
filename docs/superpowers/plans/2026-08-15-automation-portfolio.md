# Automation Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark, minimal Next.js portfolio site that showcases Mark's 4 automation demos to agency prospects, with Google Drive video embeds, workflow diagrams, and a Calendly CTA on every page.

**Architecture:** Next.js 14 App Router + Tailwind CSS static site. All content is data-driven via a single `demos.ts` file — adding a demo means adding one object. Home page shows a card grid; `/demo/[slug]` pages show the video, how-it-works steps, workflow screenshot, and CTA. Zero server-side logic.

**Tech Stack:** Next.js 14, Tailwind CSS, TypeScript, Vercel

**Spec:** `docs/superpowers/specs/2026-08-15-automation-portfolio-design.md`

## Global Constraints

- Site lives in `site/` subdirectory of the current repo (`mark-calma-portfolio-v2`)
- Background: `#0f1117`, Surface: `#1a1d27`, Border: `#2a2d3a`, Accent: `#2563eb`, Accent hover: `#1d4ed8`
- Text: primary `#f8fafc`, secondary `#94a3b8`, muted `#475569`
- Fonts: Inter (headings/body via `next/font/google`), JetBrains Mono (tags/labels via `next/font/google`)
- Video embeds: Google Drive iframe — `https://drive.google.com/file/d/{videoId}/preview`
- Workflow screenshots: `public/workflows/demo-[n].png` — graceful fallback if file missing
- Calendly URL: `CALENDLY_URL` constant in `src/data/config.ts`
- Mobile responsive — Tailwind `md:` breakpoints throughout
- No animations beyond hover state `transition-colors` / `transition-all`
- No em-dashes in any copy
- `videoId` fields in `demos.ts` start as empty string `''` — Mark fills them in after recording

---

### Task 1: Project Scaffold + Design Tokens

**Files:**
- Create: `site/` (Next.js 14 project, bootstrapped via create-next-app)
- Modify: `site/tailwind.config.ts`
- Modify: `site/src/app/globals.css`
- Modify: `site/src/app/layout.tsx`
- Create: `site/public/workflows/` (directory with placeholder README)

**Interfaces:**
- Produces: `bg-background`, `bg-surface`, `border-border`, `text-accent`, `text-primary`, `text-secondary`, `text-muted`, `font-sans`, `font-mono` Tailwind utilities available site-wide; `--font-inter` and `--font-jetbrains` CSS variables available in all components

- [ ] **Step 1: Scaffold Next.js project**

From the repo root (`mark-calma-portfolio-v2/`):

```bash
npx create-next-app@latest site --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

When prompted "Would you like to use Turbopack?" → No.

- [ ] **Step 2: Replace `tailwind.config.ts`**

Replace `site/tailwind.config.ts` entirely:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f1117',
        surface: '#1a1d27',
        border: '#2a2d3a',
        accent: '#2563eb',
        'accent-hover': '#1d4ed8',
        primary: '#f8fafc',
        secondary: '#94a3b8',
        muted: '#475569',
        success: '#22c55e',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 3: Replace `src/app/globals.css`**

Replace `site/src/app/globals.css` entirely:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Replace `src/app/layout.tsx`**

Replace `site/src/app/layout.tsx` entirely:

```tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata: Metadata = {
  title: 'Mark Calma — Automation for Agencies',
  description: 'I build automations that save agencies 10+ hours a week.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-background text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Create `public/workflows/` directory**

```bash
mkdir -p site/public/workflows
echo "Add demo-1.png, demo-2.png, demo-3.png, demo-4.png here." > site/public/workflows/README.md
```

- [ ] **Step 6: Verify in browser**

```bash
cd site && npm run dev
```

Open `http://localhost:3000`. Expected: dark background (`#0f1117`), no console errors. The default Next.js page content will still show — that's fine, it will be replaced in Task 4.

- [ ] **Step 7: Commit**

```bash
cd .. && git add site/ && git commit -m "feat: scaffold Next.js portfolio site with design tokens"
```

---

### Task 2: Data Layer

**Files:**
- Create: `site/src/data/config.ts`
- Create: `site/src/data/demos.ts`

**Interfaces:**
- Produces:
  - `CALENDLY_URL: string` exported from `@/data/config`
  - `AUTHOR_NAME: string` exported from `@/data/config`
  - `SITE_TAGLINE: string` exported from `@/data/config`
  - `SITE_DESCRIPTION: string` exported from `@/data/config`
  - `DemoStep` interface: `{ label: string; description: string }` exported from `@/data/demos`
  - `Demo` interface: `{ slug, number, title, tagline, pain, videoId, stack, steps }` exported from `@/data/demos`
  - `demos: Demo[]` exported from `@/data/demos`
  - `getDemoBySlug(slug: string): Demo | undefined` exported from `@/data/demos`

- [ ] **Step 1: Create `src/data/config.ts`**

Create `site/src/data/config.ts`:

```typescript
export const CALENDLY_URL = 'https://calendly.com/28markcalma'; // update with real Calendly slug
export const AUTHOR_NAME = 'Mark Calma';
export const SITE_TAGLINE = 'I build automations that save agencies 10+ hours a week.';
export const SITE_DESCRIPTION = 'Client onboarding. Reporting. Lead follow-up. Content production. All on autopilot.';
```

- [ ] **Step 2: Create `src/data/demos.ts`**

Create `site/src/data/demos.ts`:

```typescript
export interface DemoStep {
  label: string;
  description: string;
}

export interface Demo {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  pain: string;
  videoId: string;
  stack: string[];
  steps: DemoStep[];
}

export const demos: Demo[] = [
  {
    slug: 'demo-1',
    number: 1,
    title: 'Client Onboarding',
    tagline: '12 manual steps. Automated in 30 seconds.',
    pain: 'Most agencies spend 2-3 hours onboarding every new client — manually. Drive folder, Slack channel, Notion workspace, welcome email. 12 steps. Every single client.',
    videoId: '',
    stack: ['n8n', 'Claude', 'Google Drive', 'Slack', 'Notion', 'Gmail'],
    steps: [
      { label: 'Webhook fires', description: 'Client signs and the trigger fires instantly — no manual action needed.' },
      { label: 'Google Drive folder created', description: 'Named and organized automatically under the Clients folder.' },
      { label: 'Slack channel opened', description: 'Channel created and the whole team invited in seconds.' },
      { label: 'Notion workspace set up', description: 'Client added to the database with status Active.' },
      { label: 'Welcome email sent', description: "Claude writes a personalized email based on the client's industry and contract value — not a template." },
    ],
  },
  {
    slug: 'demo-2',
    number: 2,
    title: 'Automated Client Reporting',
    tagline: '8 hours of Friday reporting. Done in 60 seconds.',
    pain: "Every Friday, agencies pull numbers manually and write summary emails for each client. For a 5-client agency, that's 8 hours gone before a single billable thing happens.",
    videoId: '',
    stack: ['n8n', 'Claude', 'Google Analytics', 'Gmail'],
    steps: [
      { label: 'Scheduled trigger fires', description: 'Every Friday, automatically — no manual action needed.' },
      { label: 'Metrics pulled per client', description: 'Google Analytics data fetched for each client account.' },
      { label: 'Claude writes the insight', description: 'A human-sounding paragraph per client — not a data dump.' },
      { label: 'Live report page generated', description: 'A unique URL per client, always up to date and ready to share.' },
      { label: 'Email sent to each client', description: 'One-click link to their report page, arrives automatically.' },
    ],
  },
  {
    slug: 'demo-3',
    number: 3,
    title: 'Lead Follow-Up Automation',
    tagline: '100% of leads replied to in under 60 seconds.',
    pain: "Most agencies reply to maybe half their inbound leads — not because they don't care, but because the team is already slammed. 40 leads a month. 20 never hear back.",
    videoId: '',
    stack: ['n8n', 'Claude', 'Tally', 'Google Sheets', 'Gmail', 'Slack'],
    steps: [
      { label: 'Lead submits form', description: 'Standard contact form on Tally — no change for the prospect.' },
      { label: 'Claude scores and replies', description: 'Reads their message, scores the lead, writes a personalized response.' },
      { label: 'Email sent in under 60 seconds', description: 'References what the lead actually wrote — not a template.' },
      { label: 'Lead logged to Sheets', description: 'Score, reasoning, and calculated Day 3 and Day 7 follow-up dates recorded.' },
      { label: 'Follow-up sequence fires automatically', description: 'Day 3 and Day 7 emails go out on schedule. Slack alert on Day 7 for high-score leads.' },
    ],
  },
  {
    slug: 'demo-4',
    number: 4,
    title: 'SEO Content Pipeline',
    tagline: '10 hours of content work. 2 minutes. Automated.',
    pain: 'A content agency producing one blog post per client per week spends 10+ hours on it — research, writing, repurposing for LinkedIn, Instagram, email, Twitter. Every week. For every client.',
    videoId: '',
    stack: ['n8n', 'Tally', 'Firecrawl', 'Claude', 'Gemini', 'Gmail'],
    steps: [
      { label: 'SEO manager submits a form', description: 'Keyword, target location, and audience — four fields.' },
      { label: 'Firecrawl scrapes top 3 ranking articles', description: "Reads what's currently winning for that keyword." },
      { label: 'Claude writes a better article', description: '1000-word SEO post with title, meta description, and headings.' },
      { label: 'Claude repurposes into 4 formats', description: 'LinkedIn post, Twitter thread, Instagram caption, and email newsletter — all written automatically.' },
      { label: 'Images generated and package emailed', description: 'Gemini generates a hero and square image. Everything lands in the inbox in 2 minutes.' },
    ],
  },
];

export function getDemoBySlug(slug: string): Demo | undefined {
  return demos.find(d => d.slug === slug);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd site && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd .. && git add site/src/data/ && git commit -m "feat: add portfolio data layer — demos and config"
```

---

### Task 3: Shared Components (Nav, CTAButton, StackTag)

**Files:**
- Create: `site/src/components/CTAButton.tsx`
- Create: `site/src/components/StackTag.tsx`
- Create: `site/src/components/Nav.tsx`

**Interfaces:**
- Consumes: `CALENDLY_URL` from `@/data/config`; `AUTHOR_NAME` from `@/data/config`
- Produces:
  - `CTAButton({ label?: string, className?: string })` — renders Calendly `<a>` tag
  - `StackTag({ name: string })` — renders monospace pill `<span>`
  - `Nav()` — renders top nav with logo link + CTA button

- [ ] **Step 1: Create `CTAButton.tsx`**

Create `site/src/components/CTAButton.tsx`:

```tsx
import { CALENDLY_URL } from '@/data/config';

interface CTAButtonProps {
  label?: string;
  className?: string;
}

export function CTAButton({ label = 'Book a free 15-min call →', className = '' }: CTAButtonProps) {
  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3 rounded-lg transition-colors ${className}`}
    >
      {label}
    </a>
  );
}
```

- [ ] **Step 2: Create `StackTag.tsx`**

Create `site/src/components/StackTag.tsx`:

```tsx
interface StackTagProps {
  name: string;
}

export function StackTag({ name }: StackTagProps) {
  return (
    <span className="font-mono text-xs bg-border text-secondary px-2 py-1 rounded">
      {name}
    </span>
  );
}
```

- [ ] **Step 3: Create `Nav.tsx`**

Create `site/src/components/Nav.tsx`:

```tsx
import Link from 'next/link';
import { CTAButton } from './CTAButton';
import { AUTHOR_NAME } from '@/data/config';

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
      <Link href="/" className="text-primary font-semibold text-sm">
        {AUTHOR_NAME} <span className="text-muted">· Automation</span>
      </Link>
      <CTAButton label="Book a call" className="text-sm px-4 py-2" />
    </nav>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd site && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd .. && git add site/src/components/ && git commit -m "feat: add shared components — Nav, CTAButton, StackTag"
```

---

### Task 4: Home Page

**Files:**
- Create: `site/src/components/DemoCard.tsx`
- Modify: `site/src/app/page.tsx`

**Interfaces:**
- Consumes: `Demo` from `@/data/demos`; `demos` array from `@/data/demos`; `AUTHOR_NAME`, `SITE_TAGLINE`, `SITE_DESCRIPTION` from `@/data/config`; `Nav`, `CTAButton`, `StackTag` from components
- Produces: `DemoCard({ demo: Demo })` — card component; `/` route renders full home page

- [ ] **Step 1: Create `DemoCard.tsx`**

Create `site/src/components/DemoCard.tsx`:

```tsx
import Link from 'next/link';
import { Demo } from '@/data/demos';
import { StackTag } from './StackTag';

interface DemoCardProps {
  demo: Demo;
}

export function DemoCard({ demo }: DemoCardProps) {
  return (
    <Link
      href={`/demo/${demo.slug}`}
      className="block bg-surface border border-border rounded-xl p-6 hover:border-accent hover:shadow-lg transition-all group"
    >
      <div className="mb-3">
        <span className="font-mono text-xs text-muted">Demo {demo.number}</span>
      </div>
      <h2 className="text-lg font-semibold text-primary mb-2 group-hover:text-accent transition-colors">
        {demo.title}
      </h2>
      <p className="text-secondary text-sm mb-4 leading-relaxed">
        {demo.tagline}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {demo.stack.map(tool => (
          <StackTag key={tool} name={tool} />
        ))}
      </div>
      <div className="text-accent text-sm font-medium">
        View demo →
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Replace `src/app/page.tsx`**

Replace `site/src/app/page.tsx` entirely:

```tsx
import { Nav } from '@/components/Nav';
import { DemoCard } from '@/components/DemoCard';
import { CTAButton } from '@/components/CTAButton';
import { demos } from '@/data/demos';
import { AUTHOR_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from '@/data/config';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-16">
          <p className="font-mono text-accent text-sm mb-4">{AUTHOR_NAME}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 leading-tight">
            {SITE_TAGLINE}
          </h1>
          <p className="text-secondary text-lg mb-8 max-w-xl">
            {SITE_DESCRIPTION}
          </p>
          <CTAButton label="Book a free 15-min automation audit →" />
        </div>

        <div>
          <p className="font-mono text-muted text-xs uppercase tracking-widest mb-6">
            Live Demos
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demos.map(demo => (
              <DemoCard key={demo.slug} demo={demo} />
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-24 py-12 px-6 text-center">
        <p className="text-muted text-sm mb-6">Ready to automate your agency?</p>
        <CTAButton />
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
cd site && npm run dev
```

Open `http://localhost:3000`. Expected:
- Dark background, "Mark Calma" in accent blue
- Large headline, subheadline, blue CTA button
- 2×2 grid of demo cards with correct titles, taglines, stack tags
- "View demo →" on each card in accent blue
- Footer with "Ready to automate your agency?" and CTA

- [ ] **Step 4: Commit**

```bash
cd .. && git add site/src/components/DemoCard.tsx site/src/app/page.tsx && git commit -m "feat: add home page with demo card grid"
```

---

### Task 5: Demo Pages

**Files:**
- Create: `site/src/components/VideoEmbed.tsx`
- Create: `site/src/components/HowItWorks.tsx`
- Create: `site/src/components/WorkflowDiagram.tsx`
- Create: `site/src/app/demo/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Demo`, `DemoStep`, `demos`, `getDemoBySlug` from `@/data/demos`; `Nav`, `CTAButton`, `StackTag` from components
- Produces:
  - `VideoEmbed({ videoId: string, title: string })` — Google Drive iframe or "coming soon" placeholder
  - `HowItWorks({ steps: DemoStep[] })` — numbered steps list
  - `WorkflowDiagram({ slug: string, title: string })` — Next.js Image with error fallback (client component)
  - `/demo/demo-1` through `/demo/demo-4` routes, statically generated

- [ ] **Step 1: Create `VideoEmbed.tsx`**

Create `site/src/components/VideoEmbed.tsx`:

```tsx
interface VideoEmbedProps {
  videoId: string;
  title: string;
}

export function VideoEmbed({ videoId, title }: VideoEmbedProps) {
  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-xl border border-border bg-surface flex items-center justify-center">
        <p className="text-muted font-mono text-sm">Video coming soon</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden border border-border">
      <iframe
        src={`https://drive.google.com/file/d/${videoId}/preview`}
        title={title}
        allow="autoplay"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `HowItWorks.tsx`**

Create `site/src/components/HowItWorks.tsx`:

```tsx
import { DemoStep } from '@/data/demos';

interface HowItWorksProps {
  steps: DemoStep[];
}

export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <div>
      <p className="font-mono text-muted text-xs uppercase tracking-widest mb-6">
        How it works
      </p>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-primary text-sm">{step.label}</p>
              <p className="text-secondary text-sm mt-0.5">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: Create `WorkflowDiagram.tsx`**

Create `site/src/components/WorkflowDiagram.tsx`:

```tsx
'use client';
import Image from 'next/image';
import { useState } from 'react';

interface WorkflowDiagramProps {
  slug: string;
  title: string;
}

export function WorkflowDiagram({ slug, title }: WorkflowDiagramProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div>
      <p className="font-mono text-muted text-xs uppercase tracking-widest mb-6">
        Workflow
      </p>
      <div className="bg-surface border border-border rounded-xl p-4">
        {failed ? (
          <div className="aspect-video w-full flex items-center justify-center">
            <p className="text-muted font-mono text-sm">Workflow screenshot coming soon</p>
          </div>
        ) : (
          <Image
            src={`/workflows/${slug}.png`}
            alt={`${title} n8n workflow diagram`}
            width={1200}
            height={600}
            className="w-full rounded-lg"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/demo/[slug]/page.tsx`**

Create `site/src/app/demo/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { VideoEmbed } from '@/components/VideoEmbed';
import { HowItWorks } from '@/components/HowItWorks';
import { WorkflowDiagram } from '@/components/WorkflowDiagram';
import { StackTag } from '@/components/StackTag';
import { CTAButton } from '@/components/CTAButton';
import { demos, getDemoBySlug } from '@/data/demos';

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return demos.map(d => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const demo = getDemoBySlug(params.slug);
  if (!demo) return {};
  return {
    title: `${demo.title} | Mark Calma`,
    description: demo.pain,
  };
}

export default function DemoPage({ params }: PageProps) {
  const demo = getDemoBySlug(params.slug);
  if (!demo) notFound();

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-16">
        <div>
          <p className="font-mono text-accent text-xs mb-3">Demo {demo.number}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            {demo.title}
          </h1>
          <p className="text-xl text-secondary mb-6">{demo.tagline}</p>
          <div className="flex flex-wrap gap-2">
            {demo.stack.map(tool => (
              <StackTag key={tool} name={tool} />
            ))}
          </div>
        </div>

        <VideoEmbed videoId={demo.videoId} title={demo.title} />

        <div className="bg-surface border border-border rounded-xl p-6">
          <p className="text-secondary leading-relaxed">{demo.pain}</p>
        </div>

        <HowItWorks steps={demo.steps} />

        <WorkflowDiagram slug={demo.slug} title={demo.title} />

        <div className="border-t border-border pt-12 text-center">
          <p className="text-secondary mb-6">Want this built for your agency?</p>
          <CTAButton label="Book a free 15-min automation audit →" />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Verify in browser**

```bash
cd site && npm run dev
```

Open `http://localhost:3000/demo/demo-4`. Expected:
- "Demo 4" label in accent blue
- "SEO Content Pipeline" heading, tagline below
- Stack tags: n8n, Tally, Firecrawl, Claude, Gemini, Gmail
- "Video coming soon" placeholder (videoId is empty)
- Pain statement in a surface card
- 5 numbered how-it-works steps with blue circles
- "Workflow screenshot coming soon" placeholder
- "Book a free 15-min automation audit →" CTA

Open `/demo/demo-1`, `/demo/demo-2`, `/demo/demo-3` — all must load without errors.

Open `/demo/fake` — must return the Next.js 404 page.

Click "Mark Calma · Automation" in nav — must return to home.

- [ ] **Step 6: Commit**

```bash
cd .. && git add site/src/components/VideoEmbed.tsx site/src/components/HowItWorks.tsx site/src/components/WorkflowDiagram.tsx site/src/app/demo/ && git commit -m "feat: add demo pages with video embed, how-it-works, workflow diagram"
```

---

### Task 6: Build Verification + Vercel Deploy

**Files:**
- No new source files

**Interfaces:**
- Consumes: all prior tasks
- Produces: live site at `*.vercel.app`

- [ ] **Step 1: Run production build**

```bash
cd site && npm run build
```

Expected: build succeeds, output lists `/`, `/demo/demo-1`, `/demo/demo-2`, `/demo/demo-3`, `/demo/demo-4` as static pages. No TypeScript errors.

If build fails with image errors about missing PNGs, create empty placeholder files to satisfy Next.js at build time:

```bash
# Run only if build fails on workflow images
node -e "
const fs = require('fs');
['demo-1','demo-2','demo-3','demo-4'].forEach(s => {
  const p = \`public/workflows/\${s}.png\`;
  if (!fs.existsSync(p)) fs.writeFileSync(p, Buffer.alloc(0));
});
"
```

Then re-run `npm run build`.

- [ ] **Step 2: Push to GitHub**

```bash
cd .. && git push origin master
```

- [ ] **Step 3: Connect repo to Vercel**

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import the `mark-calma-portfolio-v2` GitHub repository
3. In "Configure Project" → set **Root Directory** to `site`
4. Framework Preset: Next.js (auto-detected)
5. Leave all other settings as defaults
6. Click Deploy

- [ ] **Step 4: Verify live site**

Once Vercel finishes deploying, open the provided URL (e.g., `mark-calma-portfolio-v2.vercel.app`).

Check:
- Home page loads: dark background, headline, 4 demo cards
- Each card links correctly to its demo page
- `/demo/demo-1` through `/demo/demo-4` all load with correct content
- "Book a call" button in Nav opens Calendly in a new tab
- Mobile: open on phone or DevTools mobile view — cards stack to 1 column, text remains readable

- [ ] **Step 5: Commit deploy confirmation**

```bash
git commit --allow-empty -m "chore: deploy portfolio to Vercel"
```

---

## After Launch: Mark Fills In Content

Once the site is live, complete these steps to go from placeholders to the real content:

**1. Add Calendly URL** — Open `site/src/data/config.ts`. Replace the `CALENDLY_URL` value with your real Calendly link. Push to redeploy.

**2. Add Google Drive video IDs** — For each demo, open the Google Drive share link. The file ID is the long string between `/d/` and `/view` in the URL (e.g., `https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE3upms/view` → ID is `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE3upms`). Paste each ID into the `videoId` field for the matching demo in `site/src/data/demos.ts`. Push to redeploy.

**3. Add workflow screenshots** — Screenshot each n8n workflow canvas (full canvas view, not execution view). Save as `demo-1.png`, `demo-2.png`, `demo-3.png`, `demo-4.png`. Drop files into `site/public/workflows/`. Push to redeploy.
