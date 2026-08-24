# Demo 5 — On-Brand Social Image Generator Design Spec

## Goal

Build a form-triggered n8n workflow that takes a brand's name, primary color, style vibe, and content topic, then generates three platform-ready social media images (Instagram Square, Instagram Story, LinkedIn Banner) and delivers them in one email — all in under 60 seconds.

## Target Pain

Agencies producing social content for multiple clients spend 2-3 hours per client per week in Canva — manually recreating on-brand visuals for every platform. This workflow eliminates that entirely.

- **Tagline:** "3 on-brand social images. 5 fields. 60 seconds."
- **Pain:** "Most agencies producing social content for clients spend 2-3 hours per client per week in Canva — manually sizing, recoloring, and adapting every post. For a 5-client agency, that's a full day of design work every week."

## Stack

`n8n` `Tally` `Claude` `Gemini` `OpenRouter` `Gmail`

## Architecture

Form-triggered sequential pipeline. One Claude call writes all three image prompts. Three sequential Gemini calls generate one image each. One Gmail node delivers all three in a single HTML email.

## Tally Form

**Form name:** On-Brand Social Image Generator

| Field | Type | Required |
|---|---|---|
| Email | Email | Yes |
| Brand name | Short text | Yes |
| Primary color | Short text (hex, e.g. #2563eb) | Yes |
| Style vibe | Dropdown: Modern / Bold / Playful / Minimal | Yes |
| Content topic | Short text (e.g. "summer sale", "new product launch") | Yes |

No em-dashes in any field labels or descriptions.

## n8n Workflow

### Node 1: Tally Trigger
- **Type:** Tally Trigger
- **Config:** Webhook — listens for form submission
- **Output:** Raw Tally payload

### Node 2: Normalize Fields
- **Type:** Code (JavaScript)
- **Purpose:** Extract the 5 fields from Tally's nested `fields` array by label
- **Output:**
```json
{
  "email": "agency@example.com",
  "brandName": "Apex Digital",
  "primaryColor": "#2563eb",
  "styleVibe": "Modern",
  "contentTopic": "summer sale"
}
```

**Code:**
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

### Node 3: Write Image Prompts
- **Type:** Basic LLM Chain
- **Model:** anthropic/claude-sonnet-4-6 via OpenRouter
- **Purpose:** Write three distinct image prompts, one per platform, incorporating brand color, style vibe, and content topic

**System prompt:**
```
You are a creative director specializing in social media visual content for agencies.
Given a brand's details, write three image generation prompts — one per platform.
Each prompt must produce a visually striking, on-brand image with no text overlaid.
Incorporate the brand's primary color prominently.
Match the style vibe precisely: Modern means clean lines and minimal design; Bold means high contrast and strong shapes; Playful means bright colors and dynamic composition; Minimal means whitespace-heavy and understated.
Return only valid JSON. No explanation. No markdown.
```

**User prompt:**
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

**Output:** `{ text: "{ \"instagramSquare\": \"...\", ... }" }`

### Node 4: Parse Prompts
- **Type:** Code (JavaScript)
- **Purpose:** JSON.parse the Claude output
- **Code:**
```javascript
const raw = $input.item.json.text;
const prompts = JSON.parse(raw);
return prompts;
```
- **Output:**
```json
{
  "instagramSquare": "A clean modern square...",
  "instagramStory": "A vertical bold story...",
  "linkedInBanner": "A wide minimal banner..."
}
```

### Node 5: Generate Instagram Square
- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://openrouter.ai/api/v1/chat/completions`
- **Headers:**
  - `Authorization: Bearer {{ $env.OPENROUTER_API_KEY }}`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "user",
      "content": "{{ $('Parse Prompts').item.json.instagramSquare }} Square 1:1 format."
    }
  ]
}
```
- **Output:** Raw Gemini response

### Node 6: Extract Square Image
- **Type:** Code (JavaScript)
- **Purpose:** Pull base64 data URI from Gemini response
- **Code:**
```javascript
const imageUrl = $input.item.json.choices[0].message.images[0].image_url.url;
return { squareDataUri: imageUrl };
```

### Node 7: Generate Instagram Story
- **Type:** HTTP Request
- **Config:** Same as Node 5
- **Body:**
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "user",
      "content": "{{ $('Parse Prompts').item.json.instagramStory }} Vertical 9:16 portrait format."
    }
  ]
}
```

### Node 8: Extract Story Image
- **Type:** Code (JavaScript)
- **Code:**
```javascript
const imageUrl = $input.item.json.choices[0].message.images[0].image_url.url;
return { storyDataUri: imageUrl };
```

### Node 9: Generate LinkedIn Banner
- **Type:** HTTP Request
- **Config:** Same as Node 5
- **Body:**
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "user",
      "content": "{{ $('Parse Prompts').item.json.linkedInBanner }} Wide 16:9 landscape format."
    }
  ]
}
```

### Node 10: Extract LinkedIn Banner
- **Type:** Code (JavaScript)
- **Code:**
```javascript
const imageUrl = $input.item.json.choices[0].message.images[0].image_url.url;
return { linkedInDataUri: imageUrl };
```

### Node 11: Build Email Body
- **Type:** Code (JavaScript)
- **Purpose:** Assemble HTML email with all three images embedded as base64 data URIs
- **References:**
  - `$('Normalize Fields').item.json` — brandName, contentTopic, email
  - `$('Extract Square Image').item.json.squareDataUri`
  - `$('Extract Story Image').item.json.storyDataUri`
  - `$('Extract LinkedIn Banner').item.json.linkedInDataUri`

**Code:**
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

### Node 12: Send Email
- **Type:** Gmail
- **Operation:** Send
- **To:** `{{ $json.emailTo }}`
- **Subject:** `{{ $json.emailSubject }}`
- **Message:** `{{ $json.emailBody }}`
- **Email type:** HTML

## Data Flow Summary

```
Tally Trigger
  → Normalize Fields (extract 5 fields)
  → Write Image Prompts (Claude writes 3 prompts as JSON)
  → Parse Prompts (JSON.parse)
  → Generate Instagram Square (Gemini HTTP)
  → Extract Square Image
  → Generate Instagram Story (Gemini HTTP)
  → Extract Story Image
  → Generate LinkedIn Banner (Gemini HTTP)
  → Extract LinkedIn Banner
  → Build Email Body (assemble HTML with all 3 images)
  → Send Email (Gmail)
```

## Demo Script Summary

**Live demo flow (2.5 min):**
1. Show Tally form — fill 5 fields live (use a real brand: "Apex Digital", "#2563eb", Modern, "client acquisition tips")
2. Submit → switch to n8n Executions panel → narrate each node as it fires
3. Open Gmail → show email with all 3 images
4. Point out: correct brand color, correct style, correct platform format
5. CTA: "This runs for every client, every week, automatically."

## Portfolio Page

- **Slug:** `demo-5`
- **Title:** On-Brand Social Image Generator
- **Tagline:** "3 on-brand social images. 5 fields. 60 seconds."
- **Pain:** "Most agencies producing social content for clients spend 2-3 hours per client per week in Canva - manually sizing, recoloring, and adapting every post. For a 5-client agency, that is a full day of design work every week."
- **Stack:** `n8n` `Tally` `Claude` `Gemini` `OpenRouter` `Gmail`
- **Steps:**
  1. **Form submitted** - agency inputs brand name, color, style, and topic
  2. **Claude writes image prompts** - three tailored prompts, one per platform, built around the brand
  3. **Gemini generates Instagram Square** - 1:1 format, on-brand colors and style
  4. **Gemini generates Instagram Story** - 9:16 vertical format
  5. **Gemini generates LinkedIn Banner** - 16:9 wide format, ready to post
  6. **Email delivered** - all three images in one email, under 60 seconds

## What Mark Provides Before Recording

1. Tally form published and webhook connected to n8n
2. OpenRouter API key set as n8n credential
3. Gmail connected in n8n
4. n8n workflow Active
5. A real brand to demo with (colors, style, topic ready)
6. Gmail inbox open and cleared
7. n8n Executions panel open in another tab
