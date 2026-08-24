# Demo 5 — On-Brand Social Image Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an n8n workflow that takes 5 brand inputs from a Tally form, generates 3 on-brand social images via Gemini, and delivers all three in one email.

**Architecture:** Sequential 12-node pipeline. Tally webhook fires → Claude writes 3 image prompts → 3 sequential Gemini HTTP calls generate one image each → Gmail sends all three as base64 data URIs in one HTML email.

**Tech Stack:** Tally, n8n (self-hosted), Claude via OpenRouter (Basic LLM Chain), Gemini via OpenRouter (HTTP Request), Gmail

**Spec:** `docs/superpowers/specs/2026-08-24-demo-5-image-generator-design.md`

## Global Constraints

- No em-dashes in any copy — field labels, email content, node names. Use ` - ` (space-hyphen-space) instead.
- Claude model: `anthropic/claude-sonnet-4-6` via OpenRouter
- Image model: `google/gemini-2.0-flash-exp:free` via OpenRouter
- n8n instance: `https://n8n.srv1258745.hstgr.cloud`
- Tally field labels must match Node 2 Code **exactly** — same casing, same spacing
- All images embedded as base64 data URIs — never as external URLs
- Gmail node email type: HTML (not plain text)
- OpenRouter API key stored as n8n environment variable `OPENROUTER_API_KEY`

---

### Task 1: Tally Form + Trigger

**Files:**
- n8n workflow (new) — "Demo 5: On-Brand Social Image Generator"
- Tally form (new) — "On-Brand Social Image Generator"

**Interfaces:**
- Produces: Tally webhook payload consumed by Task 2

- [ ] **Step 1: Create Tally form**

Go to tally.so. Create a new form named **"On-Brand Social Image Generator"**. Add these fields in order with these exact labels (casing matters — Node 2 Code matches by label string):

| Label | Type |
|---|---|
| Email | Email |
| Brand name | Short answer |
| Primary color | Short answer |
| Style vibe | Dropdown |
| Content topic | Short answer |

For Style vibe dropdown, add these four options exactly: `Modern`, `Bold`, `Playful`, `Minimal`

Add placeholder hint to Primary color field: `e.g. #2563eb`

Publish the form.

- [ ] **Step 2: Create n8n workflow and add Tally Trigger**

In n8n, create a new workflow named **"Demo 5: On-Brand Social Image Generator"**.

Add a **Tally Trigger** node. Copy the webhook URL from the node. Go back to Tally form settings → Integrations → Webhook → paste the URL. Save.

- [ ] **Step 3: Verify trigger receives payload**

Submit the Tally form with test data:
- Email: `28markcalma@gmail.com`
- Brand name: `Apex Digital`
- Primary color: `#2563eb`
- Style vibe: `Modern`
- Content topic: `client acquisition tips`

In n8n, check the Tally Trigger node output. Confirm `data.fields` array is present. Look for an object with `label: "Brand name"` and `value: "Apex Digital"`. If you see the fields array — trigger is working.

---

### Task 2: Normalize Fields

**Files:**
- Node 2 in the n8n workflow

**Interfaces:**
- Consumes: `$input.item.json.data.fields` — array of `{ label: string, value: string }` objects from Tally Trigger
- Produces: `{ email, brandName, primaryColor, styleVibe, contentTopic }` — consumed by Tasks 3 and 8

- [ ] **Step 1: Add Code node**

Add a **Code** node after Tally Trigger. Name it `Normalize Fields`. Set mode to **Run Once for All Items**.

Paste this code exactly:

```javascript
const fields = $input.item.json.data.fields;
const get = (label) => fields.find(f => f.label === label)?.value ?? '';

return {
  email: get('Email'),
  brandName: get('Brand name'),
  primaryColor: get('Primary color'),
  styleVibe: get('Style vibe'),
  contentTopic: get('Content topic')
};
```

- [ ] **Step 2: Pin test data on Tally Trigger and execute Normalize Fields**

Click the Tally Trigger node → click **Pin data** on the test execution output you got in Task 1. Then click **Execute node** on Normalize Fields.

Expected output:
```json
{
  "email": "28markcalma@gmail.com",
  "brandName": "Apex Digital",
  "primaryColor": "#2563eb",
  "styleVibe": "Modern",
  "contentTopic": "client acquisition tips"
}
```

If any field is empty string, the label in the code doesn't match the Tally field label. Fix the label in the code to match exactly.

---

### Task 3: Write Image Prompts (Claude)

**Files:**
- Node 3 in the n8n workflow

**Interfaces:**
- Consumes: `{ brandName, primaryColor, styleVibe, contentTopic }` from Normalize Fields
- Produces: `{ text: "{ \"instagramSquare\": \"...\", \"instagramStory\": \"...\", \"linkedInBanner\": \"...\" }" }` — consumed by Task 4

- [ ] **Step 1: Add Basic LLM Chain node**

Add a **Basic LLM Chain** node after Normalize Fields. Name it `Write Image Prompts`.

Set the model to **OpenRouter** (or whichever credential type you have for OpenRouter). Select model: `anthropic/claude-sonnet-4-6`.

- [ ] **Step 2: Set system prompt**

In the System Prompt field, paste:

```
You are a creative director specializing in social media visual content for agencies.
Given a brand's details, write three image generation prompts - one per platform.
Each prompt must produce a visually striking, on-brand image with no text overlaid.
Incorporate the brand's primary color prominently.
Match the style vibe precisely: Modern means clean lines and minimal design; Bold means high contrast and strong shapes; Playful means bright colors and dynamic composition; Minimal means whitespace-heavy and understated.
Return only valid JSON. No explanation. No markdown.
```

- [ ] **Step 3: Set user prompt**

In the User Message / Prompt field, paste:

```
Brand name: {{ $json.brandName }}
Primary color: {{ $json.primaryColor }}
Style vibe: {{ $json.styleVibe }}
Content topic: {{ $json.contentTopic }}

Return this exact JSON structure:
{
  "instagramSquare": "detailed image prompt for a 1:1 square format Instagram post",
  "instagramStory": "detailed image prompt for a 9:16 vertical format Instagram story",
  "linkedInBanner": "detailed image prompt for a 16:9 wide format LinkedIn post"
}
```

- [ ] **Step 4: Execute and verify**

Click **Execute node** on Write Image Prompts.

Expected output: `{ "text": "{ \"instagramSquare\": \"...\", \"instagramStory\": \"...\", \"linkedInBanner\": \"...\" }" }`

The `text` field should be a valid JSON string containing the three prompt keys. If Claude returns markdown code fences (` ```json `), the Parse Prompts node in Task 4 will fail — fix by adding "Return only valid JSON. No explanation. No markdown." at the end of the system prompt (already included above).

---

### Task 4: Parse Prompts

**Files:**
- Node 4 in the n8n workflow

**Interfaces:**
- Consumes: `$input.item.json.text` — raw JSON string from Write Image Prompts
- Produces: `{ instagramSquare: string, instagramStory: string, linkedInBanner: string }` — consumed by Tasks 5, 7, 9

- [ ] **Step 1: Add Code node**

Add a **Code** node after Write Image Prompts. Name it `Parse Prompts`.

Paste this code:

```javascript
const raw = $input.item.json.text;
const prompts = JSON.parse(raw);
return prompts;
```

- [ ] **Step 2: Execute and verify**

Click **Execute node** on Parse Prompts.

Expected output:
```json
{
  "instagramSquare": "A clean modern square composition...",
  "instagramStory": "A vertical portrait composition...",
  "linkedInBanner": "A wide landscape composition..."
}
```

All three keys must be present and non-empty. If `JSON.parse` throws, Claude returned invalid JSON — re-run Write Image Prompts or tighten the system prompt.

---

### Task 5: Generate + Extract Instagram Square

**Files:**
- Nodes 5 and 6 in the n8n workflow

**Interfaces:**
- Consumes: `$('Parse Prompts').item.json.instagramSquare` — image prompt string
- Produces: `{ squareDataUri: string }` — base64 PNG data URI, consumed by Task 8

- [ ] **Step 1: Add HTTP Request node for Gemini**

Add an **HTTP Request** node after Parse Prompts. Name it `Generate Instagram Square`.

Configure:
- Method: POST
- URL: `https://openrouter.ai/api/v1/chat/completions`
- Authentication: None (header-based)
- Headers:
  - `Authorization`: `Bearer {{ $env.OPENROUTER_API_KEY }}`
  - `Content-Type`: `application/json`
- Body Content Type: JSON
- Body:
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "user",
      "content": "={{ $('Parse Prompts').item.json.instagramSquare + ' Square 1:1 format.' }}"
    }
  ]
}
```

Note: the `content` field uses an n8n expression (starts with `=`). The value concatenates the prompt with the format instruction.

- [ ] **Step 2: Execute and verify raw response**

Click **Execute node** on Generate Instagram Square.

Expected: response JSON with `choices[0].message.images[0].image_url.url` containing a data URI starting with `data:image/png;base64,` or `data:image/jpeg;base64,`.

If the response has no `images` key, the model did not return an image. Check OpenRouter dashboard to confirm `google/gemini-2.0-flash-exp:free` is available. Try `google/gemini-2.0-flash-thinking-exp:free` as fallback.

- [ ] **Step 3: Add Extract Square Image code node**

Add a **Code** node after Generate Instagram Square. Name it `Extract Square Image`.

```javascript
const imageUrl = $input.item.json.choices[0].message.images[0].image_url.url;
return { squareDataUri: imageUrl };
```

- [ ] **Step 4: Execute and verify**

Execute Extract Square Image. Expected output: `{ "squareDataUri": "data:image/png;base64,iVBOR..." }`. The value should be a long base64 string.

---

### Task 6: Generate + Extract Instagram Story

**Files:**
- Nodes 7 and 8 in the n8n workflow

**Interfaces:**
- Consumes: `$('Parse Prompts').item.json.instagramStory`
- Produces: `{ storyDataUri: string }` — consumed by Task 8

- [ ] **Step 1: Add HTTP Request node**

Add an **HTTP Request** node after Extract Square Image. Name it `Generate Instagram Story`.

Same config as Generate Instagram Square (Task 5, Step 1), but change the body content field to:

```
={{ $('Parse Prompts').item.json.instagramStory + ' Vertical 9:16 portrait format.' }}
```

- [ ] **Step 2: Add Extract Story Image code node**

Add a **Code** node after Generate Instagram Story. Name it `Extract Story Image`.

```javascript
const imageUrl = $input.item.json.choices[0].message.images[0].image_url.url;
return { storyDataUri: imageUrl };
```

- [ ] **Step 3: Execute both nodes and verify**

Execute Extract Story Image. Expected: `{ "storyDataUri": "data:image/png;base64,..." }`. Confirm non-empty base64 string.

---

### Task 7: Generate + Extract LinkedIn Banner

**Files:**
- Nodes 9 and 10 in the n8n workflow

**Interfaces:**
- Consumes: `$('Parse Prompts').item.json.linkedInBanner`
- Produces: `{ linkedInDataUri: string }` — consumed by Task 8

- [ ] **Step 1: Add HTTP Request node**

Add an **HTTP Request** node after Extract Story Image. Name it `Generate LinkedIn Banner`.

Same config as previous Gemini nodes, body content field:

```
={{ $('Parse Prompts').item.json.linkedInBanner + ' Wide 16:9 landscape format.' }}
```

- [ ] **Step 2: Add Extract LinkedIn Banner code node**

Add a **Code** node after Generate LinkedIn Banner. Name it `Extract LinkedIn Banner`.

```javascript
const imageUrl = $input.item.json.choices[0].message.images[0].image_url.url;
return { linkedInDataUri: imageUrl };
```

- [ ] **Step 3: Execute both nodes and verify**

Expected: `{ "linkedInDataUri": "data:image/png;base64,..." }`. Confirm non-empty.

---

### Task 8: Build Email Body + Send Email

**Files:**
- Nodes 11 and 12 in the n8n workflow

**Interfaces:**
- Consumes:
  - `$('Normalize Fields').item.json` — `{ email, brandName, contentTopic }`
  - `$('Extract Square Image').item.json.squareDataUri`
  - `$('Extract Story Image').item.json.storyDataUri`
  - `$input.item.json.linkedInDataUri` (direct parent: Extract LinkedIn Banner)
- Produces: email delivered to `fields.email`

- [ ] **Step 1: Add Build Email Body code node**

Add a **Code** node after Extract LinkedIn Banner. Name it `Build Email Body`.

```javascript
const fields = $('Normalize Fields').item.json;
const squareImg = $('Extract Square Image').item.json.squareDataUri;
const storyImg = $('Extract Story Image').item.json.storyDataUri;
const linkedInImg = $input.item.json.linkedInDataUri;

const html = `
<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f9f9f9; padding: 32px;">
  <h2 style="color: #111; margin-bottom: 4px;">On-Brand Social Images</h2>
  <p style="color: #555; margin-top: 0;">Brand: <strong>${fields.brandName}</strong> | Topic: <strong>${fields.contentTopic}</strong></p>

  <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />

  <h3 style="color: #111;">Instagram Square (1:1)</h3>
  <img src="${squareImg}" style="width: 100%; max-width: 500px; border-radius: 8px; display: block; margin-bottom: 32px;" />

  <h3 style="color: #111;">Instagram Story (9:16)</h3>
  <img src="${storyImg}" style="width: 100%; max-width: 280px; border-radius: 8px; display: block; margin-bottom: 32px;" />

  <h3 style="color: #111;">LinkedIn Banner (16:9)</h3>
  <img src="${linkedInImg}" style="width: 100%; max-width: 600px; border-radius: 8px; display: block; margin-bottom: 32px;" />

  <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
  <p style="color: #888; font-size: 13px;">Generated by Mark Calma Automation</p>
</div>
`;

return {
  emailTo: fields.email,
  emailSubject: `On-brand images ready: ${fields.brandName} - ${fields.contentTopic}`,
  emailBody: html
};
```

- [ ] **Step 2: Execute Build Email Body and verify**

Expected output:
```json
{
  "emailTo": "28markcalma@gmail.com",
  "emailSubject": "On-brand images ready: Apex Digital - client acquisition tips",
  "emailBody": "<div style=..."
}
```

The `emailBody` should be a long HTML string. Confirm it contains all three `<img src="data:image/` tags.

- [ ] **Step 3: Add Gmail Send node**

Add a **Gmail** node after Build Email Body. Name it `Send Email`.

Configure:
- Operation: Send
- To: `{{ $json.emailTo }}`
- Subject: `{{ $json.emailSubject }}`
- Message: `{{ $json.emailBody }}`
- Email Type: **HTML**

---

### Task 9: End-to-End Test + Activate + Portfolio Screenshot

**Files:**
- n8n workflow (set to Active)
- `site/public/workflows/demo-5.png` — workflow canvas screenshot for portfolio

- [ ] **Step 1: Run end-to-end test**

Submit the Tally form live (not pinned data). Use:
- Email: `28markcalma@gmail.com`
- Brand name: `Apex Digital`
- Primary color: `#2563eb`
- Style vibe: `Modern`
- Content topic: `client acquisition tips`

Watch the n8n Executions panel. All 12 nodes must show green. If any node fails, check its error output and fix before continuing.

- [ ] **Step 2: Check Gmail**

Open Gmail. Find the email with subject `On-brand images ready: Apex Digital - client acquisition tips`. Open it. Confirm:
- All three images render (not broken)
- Brand color `#2563eb` (blue) is visually prominent
- Square image looks squarish, story image looks tall, LinkedIn image looks wide
- No em-dashes in subject or body

- [ ] **Step 3: Activate the workflow**

In n8n, click the toggle in the top right to set the workflow to **Active**. This enables the live Tally webhook.

- [ ] **Step 4: Take workflow screenshot**

In n8n, zoom out so all 12 nodes are visible on the canvas. Take a screenshot. Save it as:

```
site/public/workflows/demo-5.png
```

- [ ] **Step 5: Commit**

```bash
git add site/public/workflows/demo-5.png
git commit -m "feat: add Demo 5 workflow screenshot"
git push origin master
```
