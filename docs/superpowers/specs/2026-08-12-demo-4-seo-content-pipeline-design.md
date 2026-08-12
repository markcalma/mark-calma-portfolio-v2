# Demo 4: SEO Content Pipeline — Design Spec
**Date:** 2026-08-12
**Author:** Mark Calma

---

## Overview

**Goal:** Build a live demo showing a complete SEO content pipeline — from keyword input to finished blog post + 4 social media formats + 2 AI-generated images — delivered to the SEO manager's inbox in under 2 minutes.

**Pain targeted:** Content agencies spend 10+ hours producing one piece of content: researching competitors, writing the article, adapting it for each social platform, and creating visuals. All manual, all repeated every week per client.

**Demo scenario:**
> "Sarah runs a content agency in Manila. Her team spends 2 full days producing one piece of content for a client. Watch what happens when she types a keyword and hits submit."

**The number:** 10 hours of content work → 2 minutes, fully automated.

**Stack:** Tally.so + n8n + Firecrawl API + Claude via OpenRouter (anthropic/claude-sonnet-4-6) + Gemini 2.0 Flash via OpenRouter (image generation) + Gmail

---

## Architecture

One linear n8n workflow triggered by a Tally form. Two Claude calls + two Gemini image calls, all via OpenRouter on Mark's existing account.

```
Tally form submitted (email, keyword, location, audience)
        ↓
n8n Tally Trigger
        ↓
Normalize Fields (Code node)
        ↓
Firecrawl Search + Scrape (HTTP Request)
        — searches keyword + location, scrapes top 3 articles as markdown
        ↓
Combine Scraped Content (Code node)
        — concatenates 3 articles into one competitor research block
        ↓
Claude Call 1 — Write SEO Blog Post (Basic LLM Chain)
        — analyzes competitor content, writes original 1000-word post
        — outputs JSON: title, meta_description, headings, body, image_prompt
        ↓
Parse Blog Post (Code node)
        ↓
Claude Call 2 — Repurpose for Social (Basic LLM Chain)
        — reads finished blog post, outputs 4 platform-ready formats
        — outputs JSON: linkedin, twitter_thread, instagram, email_newsletter
        ↓
Parse Social Content (Code node)
        ↓
Gemini Image 1 — Hero image (HTTP Request to OpenRouter)
        — landscape 16:9, based on image_prompt from Claude Call 1
        ↓
Gemini Image 2 — Square image (HTTP Request to OpenRouter)
        — square 1:1, styled for Instagram
        ↓
Build + Send Email (Gmail node)
        — assembles all pieces, attaches images, sends to submitter's email
```

---

## Global Constraints

- n8n instance: `https://n8n.srv1258745.hstgr.cloud`
- Claude model: `anthropic/claude-sonnet-4-6` via OpenRouter (OpenAI-compatible format)
- Image generation model: `google/gemini-2.0-flash-exp:free` via OpenRouter
- OpenRouter base URL: `https://openrouter.ai/api/v1`
- Firecrawl endpoint: `https://api.firecrawl.dev/v1/search`
- Firecrawl result limit: 3 articles
- Gmail sender: `28markcalma@gmail.com`
- Basic LLM Chain output field: `$json.text`
- No em-dashes in any Claude-generated copy
- Workflow exported to: `delivery-template/n8n-workflows/demo-4-seo-content-pipeline.json`
- If Gemini image generation fails (experimental endpoint), include image prompt text in email as fallback — do not fail the whole workflow

---

## 1. Tally Form

**Fields (4, in order):**

| Field label (exact) | Type |
|---|---|
| Your email | Email |
| Keyword | Short text |
| Target location | Short text |
| Target audience | Short text |

**Demo fill-in (live on Loom):**
- Your email: `28markcalma@gmail.com`
- Keyword: `social media marketing for small businesses`
- Target location: `Manila, Philippines`
- Target audience: `small business owners who want more clients`

---

## 2. n8n Workflow Nodes

| # | Node | Type | What it does |
|---|---|---|---|
| 1 | Tally Trigger | `n8n-nodes-base.tallyTrigger` | Receives form submission |
| 2 | Normalize Fields | Code | Extracts email, keyword, location, audience from Tally's question_ fields |
| 3 | Firecrawl Search | HTTP Request | POST to Firecrawl /v1/search, returns top 3 articles as markdown |
| 4 | Combine Research | Code | Concatenates 3 scraped articles into one competitor research string |
| 5 | Write Blog Post | Basic LLM Chain | Claude writes SEO blog post, returns JSON |
| 6 | Parse Blog Post | Code | Parses `$json.text` into title, meta_description, headings, body, image_prompt |
| 7 | Repurpose for Social | Basic LLM Chain | Claude repurposes blog post into 4 social formats, returns JSON |
| 8 | Parse Social Content | Code | Parses `$json.text` into linkedin, twitter_thread, instagram, email_newsletter |
| 9 | Generate Hero Image | HTTP Request | POST to OpenRouter with Gemini 2.0 Flash, landscape image |
| 10 | Generate Square Image | HTTP Request | POST to OpenRouter with Gemini 2.0 Flash, square image |
| 11 | Send Email | Gmail | Assembles all content + images, sends to submitter |

---

## 3. Normalize Fields Code Node

Tally sends fields as `question_XXXX` keys. Extract by label:

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

---

## 4. Firecrawl HTTP Request

- Method: `POST`
- URL: `https://api.firecrawl.dev/v1/search`
- Authentication: Header Auth — `Authorization: Bearer {{ FIRECRAWL_API_KEY }}`
- Body (JSON):
```json
{
  "query": "{{ $json.keyword }} {{ $json.location }}",
  "limit": 3,
  "scrapeOptions": {
    "formats": ["markdown"]
  }
}
```

---

## 5. Combine Research Code Node

Firecrawl returns `data` array with objects containing `markdown` field per article:

```javascript
const results = $input.item.json.data;

const combined = results.map((r, i) => {
  return `--- Article ${i + 1}: ${r.title || 'Untitled'} ---\n${r.markdown || ''}`;
}).join('\n\n');

return {
  keyword: $('Normalize Fields').item.json.keyword,
  location: $('Normalize Fields').item.json.location,
  audience: $('Normalize Fields').item.json.audience,
  email: $('Normalize Fields').item.json.email,
  competitor_research: combined,
};
```

---

## 6. Claude Call 1 — Write Blog Post

**Node:** Basic LLM Chain (`@n8n/n8n-nodes-langchain.chainLlm`)
**Model sub-node:** OpenAI Chat Model with OpenRouter credential, model `anthropic/claude-sonnet-4-6`

**System prompt:**
```
You are an expert SEO content writer. Return valid JSON only, no markdown, no code fences.
```

**User prompt:**
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

**Parse Blog Post Code Node:**
```javascript
const raw = $input.item.json.text;
const parsed = JSON.parse(raw);
// Pass through upstream fields needed by later nodes
return {
  ...parsed,
  keyword: $('Combine Research').item.json.keyword,
  location: $('Combine Research').item.json.location,
  audience: $('Combine Research').item.json.audience,
  email: $('Combine Research').item.json.email,
};
```

---

## 7. Claude Call 2 — Repurpose for Social

**System prompt:**
```
You are a social media content strategist. Return valid JSON only, no markdown, no code fences.
```

**User prompt:**
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

**Parse Social Content Code Node:**
```javascript
const raw = $input.item.json.text;
const parsed = JSON.parse(raw);
return {
  ...parsed,
  title: $('Parse Blog Post').item.json.title,
  meta_description: $('Parse Blog Post').item.json.meta_description,
  body: $('Parse Blog Post').item.json.body,
  image_prompt: $('Parse Blog Post').item.json.image_prompt,
  email: $('Parse Blog Post').item.json.email,
  keyword: $('Parse Blog Post').item.json.keyword,
};
```

---

## 8. Gemini Image Generation

Both image nodes use the same config with different prompts.

**HTTP Request config:**
- Method: `POST`
- URL: `https://openrouter.ai/api/v1/chat/completions`
- Authentication: Header Auth — `Authorization: Bearer {{ OPENROUTER_API_KEY }}`
- Header: `Content-Type: application/json`
- Body (JSON):

**Hero image (landscape):**
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "user",
      "content": "Generate an image: {{ $json.image_prompt }}. Wide landscape format 16:9, professional editorial style, suitable for a blog header. No text overlays."
    }
  ],
  "modalities": ["text", "image"]
}
```

**Square image (Instagram):**
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "user",
      "content": "Generate an image: {{ $json.image_prompt }}. Square 1:1 format, bold and eye-catching, suitable for Instagram. No text overlays."
    }
  ],
  "modalities": ["text", "image"]
}
```

**Fallback:** If the response does not contain image data (experimental endpoint may fail), the Send Email node includes `image_prompt` text in the email body so the user can generate manually. Use n8n's IF node to check if image data exists before attaching.

---

## 9. Email Output

**Gmail node config:**
- To: `={{ $('Parse Blog Post').item.json.email }}`
- Subject: `={{ "Content package ready: " + $('Parse Blog Post').item.json.keyword }}`
- Message Type: HTML
- Body (HTML assembled in a Code node before Gmail):

```
Content Package: [keyword]

BLOG POST
Title: [title]
Meta description: [meta_description]

[body]

---

LINKEDIN
[linkedin]

---

TWITTER/X THREAD
[twitter_thread]

---

INSTAGRAM
[instagram]

---

EMAIL NEWSLETTER
[email_newsletter]

---

IMAGES
Hero image and square image attached.
(If images are not attached, use this prompt to generate them manually:
[image_prompt])
```

Images attached as base64 inline attachments if Gemini returned image data.

---

## 10. Loom Demo Flow

**Target:** 2 min 30 sec | **Hard cap:** 3 min

### Pre-recording checklist
- [ ] n8n workflow is Active
- [ ] Tally form is published and Tally Trigger is connected
- [ ] Gmail inbox open
- [ ] n8n Executions panel open
- [ ] Firecrawl API key connected in HTTP Request node

### [0:00 – 0:20] The Pain

"A content agency producing one blog post per client per week spends 10 hours on it. Writing, researching competitors, adapting for LinkedIn, Instagram, email, Twitter. Every week. For every client.

I built an automation that does all of it from one keyword input."

### [0:20 – 0:45] Trigger Live

Switch to Tally form. Fill it out as Sarah.

"Keyword: social media marketing for small businesses. Location: Manila. Audience: small business owners. Submit."

Switch to n8n Executions. Watch it run.

"Firecrawl is pulling the top ranking articles for that keyword right now. Claude is reading what's ranking and writing something better. Now repurposing for social..."

### [0:45 – 1:30] Show Results

Open Gmail. Email arrived.

"Everything's here. Blog post, LinkedIn post, Twitter thread, Instagram caption, email newsletter intro, and two AI-generated images — hero and square."

Read one line from the blog post body. Show the LinkedIn post. Show one of the images.

### [1:30 – 2:00] Show the Workflow

Switch to n8n workflow view.

"Firecrawl pulls the research. Claude writes the article. Claude repurposes it. Gemini generates the images. All chained automatically."

### [2:00 – 2:30] The Numbers + CTA

"10 hours of content work. 2 minutes. Automated. For every client, every week.

If your agency is still doing this manually, DM me."

### Post-recording checklist
- [ ] Upload to Loom as Unlisted
- [ ] Copy Loom URL
- [ ] Paste in Build Library sheet — column E, row 5
- [ ] Replace [LOOM_URL] in outreach templates
- [ ] Replace [LOOM_URL] in LinkedIn posts
