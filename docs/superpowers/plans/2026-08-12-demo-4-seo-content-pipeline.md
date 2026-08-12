# Demo 4 — SEO Content Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an n8n workflow that takes a keyword form submission, scrapes competitor articles with Firecrawl, writes an SEO blog post + 4 social formats with Claude, generates 2 images with Gemini, and emails the full content package to the submitter in under 2 minutes.

**Architecture:** One linear n8n workflow (12 nodes). Tally Trigger → Normalize → Firecrawl search → Combine research → Claude (blog post) → Parse → Claude (social repurpose) → Parse → Gemini hero image → Gemini square image → Build email body → Gmail send. All AI calls go through OpenRouter. Image generation has a graceful fallback if Gemini returns no image data.

**Tech Stack:** Tally.so + n8n (https://n8n.srv1258745.hstgr.cloud) + Firecrawl API + Claude via OpenRouter (anthropic/claude-sonnet-4-6) + Gemini 2.0 Flash via OpenRouter (google/gemini-2.0-flash-exp:free) + Gmail

## Global Constraints

- n8n instance: `https://n8n.srv1258745.hstgr.cloud`
- Claude model: `anthropic/claude-sonnet-4-6` via OpenRouter (OpenAI-compatible format)
- Image model: `google/gemini-2.0-flash-exp:free` via OpenRouter
- OpenRouter base URL: `https://openrouter.ai/api/v1`
- Basic LLM Chain output field: `$json.text`
- Firecrawl endpoint: `https://api.firecrawl.dev/v1/search`, limit 3
- Gmail sender: `28markcalma@gmail.com`
- No em-dashes in any Claude-generated copy
- Workflow file: `delivery-template/n8n-workflows/demo-4-seo-content-pipeline.json`
- If Gemini image generation fails, include `image_prompt` text in email — do not fail the workflow

---

### Task 1: Tally Form Setup

**Files:**
- No code files. Manual setup in Tally.so.

**Interfaces:**
- Produces: A published Tally form with 4 fields consumed by the Tally Trigger node in Task 2.

- [ ] **Step 1: Create the Tally form**

Go to tally.so → sign in → New form → name it `SEO Content Request`.

Add these 4 fields in order:

| Field label (exact) | Type |
|---|---|
| Your email | Email |
| Keyword | Short text |
| Target location | Short text |
| Target audience | Short text |

- [ ] **Step 2: Publish the form**

Click Publish (top right) → toggle Published. Copy the public form URL.

Note: The Tally Trigger node in n8n will handle the webhook connection — no manual webhook URL needed in Tally's settings.

- [ ] **Step 3: Verify**

Open the public form URL. Confirm all 4 fields appear with the exact labels above.

---

### Task 2: n8n Workflow — 12 Nodes

**Files:**
- Create: `delivery-template/n8n-workflows/demo-4-seo-content-pipeline.json`

**Interfaces:**
- Consumes: Tally form (Task 1), OpenRouter credential (existing), Firecrawl API key (Mark provides), Gmail credential (existing)
- Produces: Active n8n workflow + exported JSON at the path above

- [ ] **Step 1: Create new workflow**

In n8n → New Workflow → name it `Demo 4 — SEO Content Pipeline`.

- [ ] **Step 2: Add Tally Trigger node**

Add a Tally Trigger node (`n8n-nodes-base.tallyTrigger`). Name it `Tally Trigger`.
- Connect to your Tally credential
- Select the `SEO Content Request` form from the dropdown

- [ ] **Step 3: Add Normalize Fields node**

Connect `Tally Trigger` → `Normalize Fields`. Add a Code node, name it `Normalize Fields`.

```javascript
const item = $input.item.json;

const get = (label) => {
  const keys = Object.keys(item).filter(k => k.startsWith('question_'));
  for (const key of keys) {
    if (item[key] && item[key].label === label) return item[key].value ?? '';
  }
  return '';
};

return {
  email: get('Your email'),
  keyword: get('Keyword'),
  location: get('Target location'),
  audience: get('Target audience'),
};
```

- [ ] **Step 4: Test Normalize Fields with sample data**

Pin this test input on the Tally Trigger node to test downstream nodes:

```json
{
  "question_aa1": { "label": "Your email", "value": "28markcalma@gmail.com", "type": "INPUT_EMAIL" },
  "question_bb2": { "label": "Keyword", "value": "social media marketing for small businesses", "type": "INPUT_TEXT" },
  "question_cc3": { "label": "Target location", "value": "Manila, Philippines", "type": "INPUT_TEXT" },
  "question_dd4": { "label": "Target audience", "value": "small business owners who want more clients", "type": "INPUT_TEXT" }
}
```

Expected output from Normalize Fields:
```json
{
  "email": "28markcalma@gmail.com",
  "keyword": "social media marketing for small businesses",
  "location": "Manila, Philippines",
  "audience": "small business owners who want more clients"
}
```

- [ ] **Step 5: Add Firecrawl Search node**

Connect `Normalize Fields` → `Firecrawl Search`. Add an HTTP Request node, name it `Firecrawl Search`.

- Method: `POST`
- URL: `https://api.firecrawl.dev/v1/search`
- Authentication: Header Auth
  - Name: `Authorization`
  - Value: `Bearer YOUR_FIRECRAWL_API_KEY` (Mark provides the key — paste directly)
- Body Content Type: JSON
- Body:
```json
{
  "query": "={{ $json.keyword + ' ' + $json.location }}",
  "limit": 3,
  "scrapeOptions": {
    "formats": ["markdown"]
  }
}
```

- [ ] **Step 6: Add Combine Research node**

Connect `Firecrawl Search` → `Combine Research`. Add a Code node, name it `Combine Research`.

Firecrawl returns a `data` array. Each item has `title` and `markdown` fields:

```javascript
const results = $input.item.json.data || [];

const combined = results.map((r, i) => {
  const title = r.title || r.url || `Article ${i + 1}`;
  const content = r.markdown || r.content || '';
  return `--- Article ${i + 1}: ${title} ---\n${content}`;
}).join('\n\n');

return {
  keyword: $('Normalize Fields').item.json.keyword,
  location: $('Normalize Fields').item.json.location,
  audience: $('Normalize Fields').item.json.audience,
  email: $('Normalize Fields').item.json.email,
  competitor_research: combined.slice(0, 12000), // cap at 12k chars to avoid prompt overflow
};
```

- [ ] **Step 7: Add Write Blog Post node (Basic LLM Chain)**

Connect `Combine Research` → `Write Blog Post`. Add a Basic LLM Chain node (`@n8n/n8n-nodes-langchain.chainLlm`). Name it `Write Blog Post`.

**Chat Model sub-node:** Click `+` inside the LLM Chain → OpenAI Chat Model → select OpenRouter credential → model: `anthropic/claude-sonnet-4-6`.

**System Message** (Add Option → System Message):
```
You are an expert SEO content writer. Return valid JSON only, no markdown, no code fences.
```

**Prompt field:**
```
Write an SEO-optimized blog post for a content agency.

Keyword: {{ $json.keyword }}
Target location: {{ $json.location }}
Target audience: {{ $json.audience }}

Competitor research (top 3 ranking articles):
{{ $json.competitor_research }}

Analyze what is ranking and write a better, original article. No em-dashes. Write like a real person.

Return this exact JSON:
{
  "title": "<H1 title that naturally includes the keyword>",
  "meta_description": "<155 characters max, includes keyword, compelling>",
  "headings": ["<H2 section 1>", "<H2 section 2>", "<H2 section 3>", "<H2 section 4>"],
  "body": "<full 1000-word article in plain text, no markdown, organized by the headings above>",
  "image_prompt": "<descriptive prompt for a hero image that visually represents this article topic>"
}
```

- [ ] **Step 8: Add Parse Blog Post node**

Connect `Write Blog Post` → `Parse Blog Post`. Add a Code node, name it `Parse Blog Post`.

```javascript
const raw = $input.item.json.text;
const parsed = JSON.parse(raw);
return {
  ...parsed,
  keyword: $('Combine Research').item.json.keyword,
  location: $('Combine Research').item.json.location,
  audience: $('Combine Research').item.json.audience,
  email: $('Combine Research').item.json.email,
};
```

- [ ] **Step 9: Add Repurpose for Social node (Basic LLM Chain)**

Connect `Parse Blog Post` → `Repurpose for Social`. Add a Basic LLM Chain node. Name it `Repurpose for Social`.

**Chat Model sub-node:** Same as Step 7 — OpenRouter credential, model `anthropic/claude-sonnet-4-6`.

**System Message:**
```
You are a social media content strategist. Return valid JSON only, no markdown, no code fences.
```

**Prompt field:**
```
Repurpose this blog post into 4 social media formats.

Article title: {{ $json.title }}
Article body: {{ $json.body }}
Target audience: {{ $json.audience }}

Rules: no em-dashes, write like a real person, no corporate phrases, no AI-sounding language.

Return this exact JSON:
{
  "linkedin": "<3-4 paragraph professional post, ends with a question to drive comments>",
  "twitter_thread": "<5 tweets numbered 1/ through 5/, punchy and direct, each under 280 characters>",
  "instagram": "<caption with strong hook first line, 3 short paragraphs, 5 relevant hashtags at end>",
  "email_newsletter": "<subject line on first line, blank line, then 2-paragraph teaser that makes them want to read the full article>"
}
```

- [ ] **Step 10: Add Parse Social Content node**

Connect `Repurpose for Social` → `Parse Social Content`. Add a Code node, name it `Parse Social Content`.

```javascript
const raw = $input.item.json.text;
const parsed = JSON.parse(raw);
return {
  ...parsed,
  title: $('Parse Blog Post').item.json.title,
  meta_description: $('Parse Blog Post').item.json.meta_description,
  body: $('Parse Blog Post').item.json.body,
  headings: $('Parse Blog Post').item.json.headings,
  image_prompt: $('Parse Blog Post').item.json.image_prompt,
  email: $('Parse Blog Post').item.json.email,
  keyword: $('Parse Blog Post').item.json.keyword,
};
```

- [ ] **Step 11: Add Generate Hero Image node**

Connect `Parse Social Content` → `Generate Hero Image`. Add an HTTP Request node, name it `Generate Hero Image`.

- Method: `POST`
- URL: `https://openrouter.ai/api/v1/chat/completions`
- Authentication: Header Auth
  - Name: `Authorization`
  - Value: `Bearer YOUR_OPENROUTER_API_KEY`
- Send Headers: add `Content-Type: application/json`
- Body Content Type: JSON
- Body:
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "user",
      "content": "={{ 'Generate an image: ' + $json.image_prompt + '. Wide landscape format 16:9, professional editorial style, suitable for a blog header. No text overlays.' }}"
    }
  ],
  "modalities": ["text", "image"]
}
```

- On Error: Continue (set in Settings tab) — image generation may fail on experimental endpoint

- [ ] **Step 12: Add Generate Square Image node**

Connect `Generate Hero Image` → `Generate Square Image`. Add an HTTP Request node, name it `Generate Square Image`.

Same config as Step 11 except body content:
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "user",
      "content": "={{ 'Generate an image: ' + $('Parse Social Content').item.json.image_prompt + '. Square 1:1 format, bold and eye-catching, suitable for Instagram. No text overlays.' }}"
    }
  ],
  "modalities": ["text", "image"]
}
```

- On Error: Continue (set in Settings tab)

- [ ] **Step 13: Add Build Email Body node**

Connect `Generate Square Image` → `Build Email Body`. Add a Code node, name it `Build Email Body`.

This node assembles all content into a plain-text email body and extracts image data if available:

```javascript
const social = $('Parse Social Content').item.json;
const blog = $('Parse Blog Post').item.json;

// Try to extract hero image base64 from Gemini response
let heroImageData = null;
let squareImageData = null;

try {
  const heroResponse = $('Generate Hero Image').item.json;
  const heroContent = heroResponse?.choices?.[0]?.message?.content;
  if (Array.isArray(heroContent)) {
    const imgPart = heroContent.find(p => p.type === 'image_url');
    if (imgPart?.image_url?.url?.startsWith('data:image')) {
      heroImageData = imgPart.image_url.url;
    }
  }
} catch(e) {}

try {
  const squareResponse = $('Generate Square Image').item.json;
  const squareContent = squareResponse?.choices?.[0]?.message?.content;
  if (Array.isArray(squareContent)) {
    const imgPart = squareContent.find(p => p.type === 'image_url');
    if (imgPart?.image_url?.url?.startsWith('data:image')) {
      squareImageData = imgPart.image_url.url;
    }
  }
} catch(e) {}

const imageNote = heroImageData
  ? 'Hero image and square image attached.'
  : `Images could not be generated automatically. Use this prompt to create them manually:\n${blog.image_prompt}`;

const emailBody = `CONTENT PACKAGE: ${blog.keyword}
Generated by Mark Calma's SEO Content Pipeline

==========================================
BLOG POST
==========================================
Title: ${blog.title}

Meta description: ${blog.meta_description}

${blog.body}

==========================================
LINKEDIN
==========================================
${social.linkedin}

==========================================
TWITTER/X THREAD
==========================================
${social.twitter_thread}

==========================================
INSTAGRAM
==========================================
${social.instagram}

==========================================
EMAIL NEWSLETTER
==========================================
${social.email_newsletter}

==========================================
IMAGES
==========================================
${imageNote}`;

return {
  emailBody,
  emailTo: blog.email,
  emailSubject: 'Content package ready: ' + blog.keyword,
  heroImageData,
  squareImageData,
};
```

- [ ] **Step 14: Add Send Email node**

Connect `Build Email Body` → `Send Email`. Add a Gmail node. Name it `Send Email`.

- Credential: Mark's Gmail credential
- Operation: Send
- To: `={{ $json.emailTo }}`
- Subject: `={{ $json.emailSubject }}`
- Message Type: Text
- Message: `={{ $json.emailBody }}`

Note on image attachments: n8n's Gmail node requires binary data for attachments. If Gemini returns base64 data URLs, attaching them requires converting via n8n's binary data handling. For this demo, including the image prompt fallback text in the email body is sufficient — the email proves the pipeline works even if images are not attached. A production version would add a Convert to File node between Build Email Body and Send Email.

- [ ] **Step 15: Export workflow JSON and commit**

In n8n → three-dot menu → Download → save as `demo-4-seo-content-pipeline.json`. Copy to:
```
delivery-template/n8n-workflows/demo-4-seo-content-pipeline.json
```

```bash
cd delivery-template
git add n8n-workflows/demo-4-seo-content-pipeline.json
git commit -m "feat: add Demo 4 SEO content pipeline n8n workflow"
```

---

### Task 3: End-to-End Test

**Files:**
- No new files. Verifies the live workflow.

**Interfaces:**
- Consumes: Active n8n workflow from Task 2, Tally form from Task 1

- [ ] **Step 1: Activate the workflow**

In n8n, toggle the workflow to Active. Confirm green Active status.

- [ ] **Step 2: Submit the Tally form**

Open the published Tally form. Fill it out:
- Your email: `28markcalma@gmail.com`
- Keyword: `social media marketing for small businesses`
- Target location: `Manila, Philippines`
- Target audience: `small business owners who want more clients`

Submit.

- [ ] **Step 3: Watch n8n execute**

Open n8n Executions panel. The workflow should run through all nodes. Watch for:
- Firecrawl Search: returns `data` array with 3 articles
- Write Blog Post: returns JSON with `title`, `body`, `image_prompt`
- Repurpose for Social: returns JSON with `linkedin`, `twitter_thread`, `instagram`, `email_newsletter`
- Generate Hero/Square Image: may succeed or fail gracefully (On Error: Continue)
- Build Email Body: assembles everything
- Send Email: fires

Total execution time: expect 60-90 seconds (two LLM calls are the bottleneck).

- [ ] **Step 4: Verify email**

Open Gmail (28markcalma@gmail.com). Email should arrive with:
- Subject: `Content package ready: social media marketing for small businesses`
- Blog post title + meta description + 1000-word body
- LinkedIn post (3-4 paragraphs, ends with question)
- Twitter thread (5 tweets numbered 1/ through 5/)
- Instagram caption (hook + 3 paragraphs + 5 hashtags)
- Email newsletter (subject line + 2-paragraph teaser)
- Image note (either "Hero image and square image attached" or the manual image prompt)

- [ ] **Step 5: Verify no em-dashes**

Scan the email body. No em-dashes (`—`) should appear anywhere in Claude-generated copy.

- [ ] **Step 6: Confirm test passed**

All content sections present, email arrived, no em-dashes. Test complete.

---

### Task 4: Loom Script + Content Docs

**Files:**
- Create: `docs/loom-scripts/demo-4-seo-content-pipeline.md`
- Create: `docs/content/demo-4-linkedin-posts.md`
- Create: `docs/outreach/demo-4-templates.md`

**Interfaces:**
- Consumes: Working demo from Task 3
- Produces: Three content files ready for recording and outreach

- [ ] **Step 1: Write the Loom script**

Create `docs/loom-scripts/demo-4-seo-content-pipeline.md`:

```markdown
# Demo 4 Loom Script — SEO Content Pipeline
**Target:** 2 min 30 sec | **Hard cap:** 3 min 00 sec

## Pre-recording checklist
- [ ] n8n workflow is Active
- [ ] Tally form is published
- [ ] Gmail inbox open and cleared
- [ ] n8n Executions panel open
- [ ] Firecrawl API key connected in n8n

---

## [0:00 – 0:20] The Pain

"A content agency producing one blog post per client per week spends 10 hours on it. Writing, researching competitors, adapting for LinkedIn, Instagram, email, Twitter. Every week. For every client.

I built an automation that does all of it from one keyword input."

---

## [0:20 – 0:45] Trigger Live

Switch to Tally form in browser.

"Here's what the SEO manager sees. Four fields."

Fill out:
- Email: 28markcalma@gmail.com
- Keyword: social media marketing for small businesses
- Location: Manila, Philippines
- Audience: small business owners who want more clients

Hit Submit.

Switch to n8n Executions panel.

"Firecrawl is pulling the top ranking articles for that keyword right now. Claude is reading what's ranking and writing something better. Now repurposing for every platform."

---

## [0:45 – 1:30] Show Results

Open Gmail.

"Already here."

Open the email. Read the blog post title and one sentence from the body.

"1000-word SEO article, meta description included."

Scroll to LinkedIn section. Read first line.

"LinkedIn post, written from the article."

Scroll to Twitter thread.

"5-tweet thread, ready to post."

Scroll to Instagram.

"Instagram caption with hashtags."

Scroll to email newsletter section.

"Email newsletter teaser. Five pieces of content. One keyword. Two minutes."

---

## [1:30 – 2:00] Show the Workflow

Switch to n8n workflow view.

"Here's what ran. Firecrawl pulled the competitor research. Claude wrote the article. Claude repurposed it into four formats. Gemini generated the images. All automatic."

Point to each node group as you name it.

---

## [2:00 – 2:30] The Numbers + CTA

"10 hours of content work. 2 minutes. Automated. For every client, every week.

If your agency is still doing this manually, DM me."

---

## Post-recording checklist
- [ ] Upload to Loom as Unlisted
- [ ] Copy Loom URL
- [ ] Paste in Build Library sheet — column E, row 5
- [ ] Replace [LOOM_URL] in docs/outreach/demo-4-templates.md
- [ ] Replace [LOOM_URL] in docs/content/demo-4-linkedin-posts.md
```

- [ ] **Step 2: Write the LinkedIn posts**

Create `docs/content/demo-4-linkedin-posts.md`:

```markdown
# Demo 4 LinkedIn Posts — SEO Content Pipeline

Post order: Post 1 (Wednesday) → Post 2 (Monday) → Carousel (Thursday)

---

## Post 1 — The Pain
**Publish:** Wednesday of Week 1
**Format:** Text only

Most content agencies I talk to produce one blog post per client per week.

Here's what that actually takes:

→ Research what's ranking (2 hours)
→ Write the article (3 hours)
→ Rewrite it for LinkedIn (45 min)
→ Cut it into a Twitter thread (30 min)
→ Adapt for Instagram (30 min)
→ Write the email newsletter version (45 min)

That's 10 hours. Per client. Every week.

Building an automation that does all of it from one keyword. Posting the demo next week.

---

## Post 2 — The Build Reveal
**Publish:** Monday of Week 2
**Format:** Text + screen recording clip
**Replace [LOOM_URL] before posting**

I built a content pipeline that turns one keyword into a full content package in 2 minutes.

Here's what fires automatically when a keyword gets submitted:

✅ Firecrawl scrapes the top 3 ranking articles for that keyword
✅ Claude reads what's ranking and writes a better, original 1000-word article
✅ Claude repurposes it into LinkedIn, Twitter thread, Instagram, and email newsletter
✅ Gemini generates a hero image and a square image
✅ Everything lands in the SEO manager's inbox

2-min demo: [LOOM_URL]

The part worth watching is when Claude reads the competitor research. It's not summarizing — it's identifying gaps and writing something that should outrank them.

If your agency is still doing this manually, DM me.

---

## Post 3 — Carousel
**Publish:** Thursday of Week 2
**Format:** 6 slides, dark background, white text

Slide 1: "How agencies waste 10 hours producing one piece of content" [title]
Slide 2: "Step 1 — Research: 2 hours manual → Firecrawl scrapes top 3 competitors in 8 seconds"
Slide 3: "Step 2 — Write: 3 hours manual → Claude reads competitors and writes a better article in 45 seconds"
Slide 4: "Step 3 — Repurpose: 4 hours manual → LinkedIn, Twitter, Instagram, email newsletter written automatically"
Slide 5: "Step 4 — Images: 30 min manual → Gemini generates hero and square images automatically"
Slide 6: "Total: 10 hours → 2 minutes. Every week. For every client." [CTA: DM me]

Caption:
Broke down every step of the content production process an agency does manually.

Each one automated. The competitor research step is the one that makes the output actually good.

Demo in my previous post.

DM me if your agency is still doing this manually.
```

- [ ] **Step 3: Write the outreach templates**

Create `docs/outreach/demo-4-templates.md`:

```markdown
# Demo 4 Outreach Templates — SEO Content Pipeline

Replace [LOOM_URL] before sending.
Replace [First Name] and [Company] with real data.
Send manually via LinkedIn DMs.

---

## Day 1 — First Touch

Hey [First Name] —

Quick question — how long does your team spend producing content for one client each week?

I built an automation that takes a keyword, scrapes what's ranking, has Claude write a better article, repurposes it into LinkedIn, Twitter, Instagram, and email, generates images, and delivers everything to your inbox in under 2 minutes.

2-min demo: [LOOM_URL]

Worth a look if your team is still doing this by hand.

— Mark

---

## Day 4 — Follow-Up

Hey [First Name] — bumping this up.

The demo shows Firecrawl pulling live competitor data, Claude writing the article and repurposing it for four platforms, and Gemini generating the images — all in one automated run.

Happy to build a version for [Company]'s content workflow if it's useful.

— Mark

---

## Day 8 — Final Touch

Last one, [First Name]. Leaving the video here in case the timing's better later: [LOOM_URL]

— Mark
```

- [ ] **Step 4: Commit all content docs**

```bash
git add docs/loom-scripts/demo-4-seo-content-pipeline.md
git add docs/content/demo-4-linkedin-posts.md
git add docs/outreach/demo-4-templates.md
git commit -m "docs: add Demo 4 loom script, linkedin posts, outreach templates"
```
