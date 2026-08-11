# Demo 3: Lead Follow-Up Automation — Design Spec
**Date:** 2026-08-11
**Author:** Mark Calma

---

## Overview

**Goal:** Build a live demo showing that 100% of inbound leads get touched automatically — instant personalized reply in under 60 seconds, scored by Claude, logged to Google Sheets, and followed up on Day 3 and Day 7 with no manual work.

**Pain targeted:** Small agencies get inbound leads but 60% never get a reply because the team is swamped with active clients. Dead leads = dead revenue.

**Demo scenario:**
> "Alex Chen, founder of Apex Digital Agency, fills out your contact form. His pain: 40 leads a month, half never get a reply. Watch what happens."

**The number:** 60% of leads ignored → 0% ignored, 100% touched in under 60 seconds.

**Stack:** Tally.so + n8n + Claude via OpenRouter (Basic LLM Chain) + Gmail + Google Sheets + Slack

---

## Architecture

One linear n8n workflow triggered by a Tally.so form webhook. No loops. ~10 nodes.

```
Tally form submitted
        ↓
n8n Webhook (receives form data)
        ↓
Code node (normalize fields)
        ↓
Basic LLM Chain — Claude scores lead + writes reply email
        ↓
Code node (parse Claude JSON output)
        ↓
Gmail — sends instant personalized reply (<60 seconds)
        ↓
Google Sheets — logs lead with score, reason, tone, status
        ↓
Wait (3 days)
        ↓
Gmail — Day 3 follow-up
        ↓
Wait (4 days)
        ↓
Gmail — Day 7 final email
        ↓
Slack — alert to Mark: lead name, company, score, email
```

---

## Global Constraints

- n8n self-hosted at `https://n8n.srv1258745.hstgr.cloud`
- Claude model: `anthropic/claude-sonnet-4-6` via OpenRouter (OpenAI-compatible format)
- Basic LLM Chain node output field: `$json.text`
- Gmail credential: Mark's Gmail (28markcalma@gmail.com)
- Google Sheets: same file used for Demo 2 Reporting Clients; add a new tab called "Leads"
- Slack: same workspace used in Demo 1; post to `#leads` channel
- All test emails send to 28markcalma@gmail.com
- No em-dashes in any Claude-generated copy; write like a real person not an AI
- Workflow file saved to `delivery-template/n8n-workflows/demo-3-lead-followup.json`

---

## 1. Tally Form

**URL:** Create at tally.so (free account). Set webhook to n8n webhook URL.

**Fields:**

| Field | Type |
|---|---|
| Name | Short text |
| Email | Email |
| Company name | Short text |
| What's your biggest operational bottleneck right now? | Long text |
| Monthly revenue range | Dropdown |

**Revenue dropdown options:**
- Under $10K/month
- $10K–$50K/month
- $50K–$100K/month
- Over $100K/month

**Webhook:** In Tally → Integrations → Webhooks → paste n8n webhook URL. Tally sends all fields as JSON on submit.

---

## 2. n8n Workflow Nodes

| # | Node | Type | What it does |
|---|---|---|---|
| 1 | Tally Webhook | Webhook trigger | Receives POST from Tally on form submit |
| 2 | Normalize Lead | Code | Extracts name, email, company, pain, revenue from Tally's nested `fields` array |
| 3 | Score + Draft Reply | Basic LLM Chain | Claude returns JSON: score, reason, reply_tone, email_subject, email_body |
| 4 | Parse Claude Output | Code | Parses `$json.text` as JSON, exposes all fields |
| 5 | Send Instant Reply | Gmail | Sends personalized email to lead's email address |
| 6 | Log to Sheets | Google Sheets | Appends one row to "Leads" tab |
| 7 | Wait 3 Days | Wait | Pauses workflow execution for 3 days |
| 8 | Send Day 3 Follow-up | Gmail | Short follow-up referencing first email |
| 9 | Wait 4 Days | Wait | Pauses 4 more days (Day 7 total) |
| 10 | Send Day 7 Final | Gmail | Final email closing the sequence |
| 11 | Slack Alert | Slack | Posts lead summary to #leads channel |

**Tally field normalization (Code node):**

Tally's webhook sends fields as an array: `{ fields: [{ label: "Name", value: "Alex" }, ...] }`.
The Code node maps these to flat fields:

```javascript
const fields = $input.item.json.data.fields;
const get = (label) => {
  const f = fields.find(f => f.label === label);
  return f ? (f.value ?? '') : '';
};

return {
  name: get('Name'),
  email: get('Email'),
  company: get('Company name'),
  pain: get("What's your biggest operational bottleneck right now?"),
  revenue: get('Monthly revenue range'),
};
```

---

## 3. Claude Prompt

**Node type:** Basic LLM Chain (`@n8n/n8n-nodes-langchain.chainLlm`)
**Model:** `anthropic/claude-sonnet-4-6` via OpenRouter credential

**System prompt:**
```
You are a lead qualification assistant for an automation agency.
Analyze inbound leads and respond in valid JSON only — no explanation, no markdown, no code fences.
```

**User prompt:**
```
A new lead filled out our contact form. Analyze and respond.

Lead data:
- Name: {{ $json.name }}
- Company: {{ $json.company }}
- Monthly revenue: {{ $json.revenue }}
- Their pain: {{ $json.pain }}

Return this exact JSON:
{
  "score": <number 1-10>,
  "reason": "<2-3 sentences explaining the score based on their pain and revenue>",
  "reply_tone": "<urgent|nurturing|standard>",
  "email_subject": "<personalized subject line, no em-dashes>",
  "email_body": "<personalized reply email, 3-4 short paragraphs, no em-dashes, write like a real person not an AI, end with a soft CTA to schedule a quick call>"
}

Scoring guide:
- 8-10: Clear specific pain + revenue over $10K/month — follow up fast
- 5-7: Pain described but revenue unclear or under $10K — nurture
- 1-4: Vague pain or no budget signal — standard sequence

Reply tone guide:
- urgent: score 8-10, warmer and more direct, reference their specific pain
- nurturing: score 5-7, more educational, show value before asking for a call
- standard: score 1-4, brief, leave the door open
```

**Parse Claude Output (Code node):**
```javascript
const raw = $input.item.json.text;
const parsed = JSON.parse(raw);
return parsed;
```

---

## 4. Google Sheets Schema

**Sheet:** Same Google Sheets file used for Demo 2. Add a new tab named **"Leads"**.

**Columns (in order):**

| Column | Value |
|---|---|
| Timestamp | `={{ $now }}` |
| Name | `={{ $json.name }}` |
| Email | `={{ $json.email }}` |
| Company | `={{ $json.company }}` |
| Revenue Range | `={{ $json.revenue }}` |
| Pain (raw) | `={{ $json.pain }}` |
| Score | `={{ $json.score }}` |
| Score Reason | `={{ $json.reason }}` |
| Reply Tone | `={{ $json.reply_tone }}` |
| Status | `Instant Sent` (hardcoded string) |

---

## 5. Email Templates

### Email 1 — Instant Reply
Claude writes this entirely. Subject and body are both from `$json.email_subject` and `$json.email_body`. No template.

**Gmail node config:**
- To: `={{ $json.email }}`
- Subject: `={{ $json.email_subject }}`
- Body: `={{ $json.email_body }}` (HTML mode off, plain text)

### Email 2 — Day 3 Follow-up
```
Subject: Re: {{ email_subject }}

Hey {{ name }} — just bumping this up in case it got buried.

Happy to show you what this looks like for an agency your size. Usually takes 15 minutes on a call.

— Mark
```

### Email 3 — Day 7 Final
```
Subject: Re: {{ email_subject }}

Last one, {{ name }}. If the timing's off, no worries — leaving this here in case it's useful later.

— Mark
```

---

## 6. Slack Alert

**Fires after Email 3 (Day 7), alongside the final email.**

**Channel:** `#leads` (create in Demo 1's Slack workspace if it doesn't exist)

**Message:**
```
Lead went cold after 7 days

Name: {{ name }} — {{ company }}
Score: {{ score }}/10
Reason: {{ reason }}
Email: {{ email }}
Revenue: {{ revenue }}
```

No emoji. Plain text. The score and reason are what matters — if it's an 8+ lead, Mark knows to reach out manually.

---

## 7. Loom Demo Flow

**Target:** 2 min 30 sec | **Hard cap:** 3 min

### Pre-recording checklist
- [ ] Tally form live and webhook connected to n8n
- [ ] n8n workflow is Active
- [ ] Leads tab exists in Google Sheets (empty or cleared)
- [ ] Gmail inbox open
- [ ] n8n Executions panel open
- [ ] `#leads` Slack channel exists

### [0:00 – 0:30] The Pain
"Most agencies I talk to get leads every week and reply to maybe half of them. Not because they don't want to — because the team is already full on active clients. That's money walking out the door."

### [0:30 – 1:15] Trigger Live
Switch to Tally form. Fill it out as "Alex Chen, Apex Digital Agency."

For the pain field, type: *"We get around 40 leads a month but honestly maybe half never hear back from us. The team is just slammed with current clients."*

Select revenue: $10K–$50K/month. Submit.

Switch to n8n Executions panel. Watch it run.

"It's scoring the lead right now... Claude is writing a personalized reply... posting to Sheets... sending the email."

### [1:15 – 1:45] Show Results
Open Gmail: "Reply already there. Under 60 seconds."

Open the email. Read a line from Claude's body — it references Alex's exact pain.

Open Google Sheets — "Lead is logged. Score, reason, everything."

### [1:45 – 2:10] Show the Sequence
Switch to n8n workflow view. Point to Wait nodes.

"Day 3 — another email goes out automatically. Day 7 — final touch, and I get a Slack alert if they still haven't replied. Zero manual work."

### [2:10 – 2:30] The Numbers + CTA
"60% of leads ignored — that's the industry average. This gets every single lead touched in under 60 seconds, automatically. If your agency is leaving leads on the table, DM me."

### Post-recording checklist
- [ ] Upload to Loom as Unlisted
- [ ] Copy Loom URL
- [ ] Paste in Build Library sheet — column E, row 4
- [ ] Replace [LOOM_URL] in outreach templates
- [ ] Replace [LOOM_URL] in LinkedIn posts
