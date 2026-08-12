# Demo 3 — Lead Follow-Up Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a live demo showing 100% of inbound leads touched automatically — instant Claude-written reply in under 60 seconds, scored and logged, with Day 3 and Day 7 follow-ups firing from a single n8n workflow.

**Architecture:** A Tally.so form posts to an n8n webhook. n8n normalizes the fields, passes them to Claude via Basic LLM Chain (OpenRouter), parses the JSON output, sends an instant Gmail reply, logs the lead to Google Sheets, then waits 3 days → sends follow-up → waits 4 more days → sends final email + Slack alert. Linear workflow, no loops.

**Tech Stack:** Tally.so + n8n (https://n8n.srv1258745.hstgr.cloud) + Claude via OpenRouter (anthropic/claude-sonnet-4-6) + Gmail + Google Sheets + Slack

## Global Constraints

- n8n instance: `https://n8n.srv1258745.hstgr.cloud`
- OpenRouter model: `anthropic/claude-sonnet-4-6`
- Basic LLM Chain output field: `$json.text`
- Google Sheets ID: `1b_-Jo0qw2ZnO6lTJpt36oKgSAfvcySufZM7YvtwSgU8` (same file as Demo 2)
- Leads tab name: `Leads` (new tab, exact casing)
- Gmail sender: `28markcalma@gmail.com`
- Slack workspace: same as Demo 1; channel: `#leads`
- All test emails route to `28markcalma@gmail.com`
- No em-dashes in any Claude-generated copy
- Workflow exported to: `delivery-template/n8n-workflows/demo-3-lead-followup.json`

---

### Task 1: Tally Form + Google Sheets Leads Tab

**Files:**
- No code files. Manual setup in Tally.so and Google Sheets.

**Interfaces:**
- Produces: A live Tally form URL + webhook URL for Task 2; a `Leads` tab in Google Sheets with 10 column headers consumed by the Google Sheets node in Task 2.

- [ ] **Step 1: Create Tally form**

Go to tally.so and sign in (free account). Click "New form". Name it: `Agency Contact Form`.

Add these 5 fields in order:

| Field label (exact) | Type |
|---|---|
| Name | Short answer |
| Email | Email |
| Company name | Short answer |
| What's your biggest operational bottleneck right now? | Long answer |
| Monthly revenue range | Dropdown |

For the Dropdown field, add these 4 options (exact text):
- Under $10K/month
- $10K–$50K/month
- $50K–$100K/month
- Over $100K/month

- [ ] **Step 2: Get the n8n webhook URL**

The n8n webhook URL will be (you set the path when creating the node in Task 2):
```
https://n8n.srv1258745.hstgr.cloud/webhook/lead-intake
```

Note: This is the **production** URL (used when workflow is Active). You'll connect Tally to this URL.

- [ ] **Step 3: Connect Tally to n8n webhook**

In Tally: click "Publish" at top right → toggle the form to Published. Then go to "Integrations" → "Webhooks" → "Add webhook". Paste the webhook URL:
```
https://n8n.srv1258745.hstgr.cloud/webhook/lead-intake
```

Click Save. Tally will send a test ping — ignore it.

- [ ] **Step 4: Add Leads tab to Google Sheets**

Open the Google Sheets command center (ID: `1b_-Jo0qw2ZnO6lTJpt36oKgSAfvcySufZM7YvtwSgU8`). Click the `+` at the bottom to add a new tab. Rename it exactly: `Leads`

- [ ] **Step 5: Add column headers in row 1**

Enter these 10 headers in row 1, columns A through J (exact casing):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Name | Email | Company | Revenue Range | Pain | Score | Score Reason | Reply Tone | Status |

- [ ] **Step 6: Verify**

Sheet has 1 row (headers only, no data). Tab name is exactly `Leads`. 10 columns, A–J.

---

### Task 2: n8n Workflow — 11 Nodes

**Files:**
- Create: `delivery-template/n8n-workflows/demo-3-lead-followup.json`

**Interfaces:**
- Consumes: Tally webhook URL path `lead-intake`, Google Sheets ID + `Leads` tab, OpenRouter credential, Gmail credential, Slack credential (all from Global Constraints + Task 1)
- Produces: Active n8n workflow + exported JSON at `delivery-template/n8n-workflows/demo-3-lead-followup.json`

- [ ] **Step 1: Create new workflow**

In n8n, click "New Workflow". Name it: `Demo 3 — Lead Follow-Up`. Delete the default Start node if present.

- [ ] **Step 2: Add Webhook node — "Tally Webhook"**

Add a Webhook node. Configure:
- Name: `Tally Webhook`
- HTTP Method: `POST`
- Path: `lead-intake`
- Response Mode: `Immediately`
- Response Code: `200`
- Response Body: `{"status": "received"}`

The production URL will show as: `https://n8n.srv1258745.hstgr.cloud/webhook/lead-intake`

- [ ] **Step 3: Add Code node — "Normalize Lead"**

Connect "Tally Webhook" → "Normalize Lead". Add a Code node, name it `Normalize Lead`.

Tally sends fields as a nested array under `data.fields`. Each element has `label` and `value` keys. Paste this code:

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

- [ ] **Step 4: Test the Code node with sample data**

To verify the normalization works before wiring Claude, click "Test step" on the Normalize Lead node. If n8n shows no input, manually pin this sample input by clicking the Webhook node → "Edit" → paste this as test data:

```json
{
  "data": {
    "fields": [
      { "label": "Name", "value": "Alex Chen" },
      { "label": "Email", "value": "28markcalma@gmail.com" },
      { "label": "Company name", "value": "Apex Digital Agency" },
      { "label": "What's your biggest operational bottleneck right now?", "value": "We get around 40 leads a month but honestly maybe half never hear back from us. The team is just slammed with current clients." },
      { "label": "Monthly revenue range", "value": "$10K–$50K/month" }
    ]
  }
}
```

Expected output from Normalize Lead:
```json
{
  "name": "Alex Chen",
  "email": "28markcalma@gmail.com",
  "company": "Apex Digital Agency",
  "pain": "We get around 40 leads a month but honestly maybe half never hear back from us. The team is just slammed with current clients.",
  "revenue": "$10K–$50K/month"
}
```

- [ ] **Step 5: Add Basic LLM Chain node — "Score + Draft Reply"**

Connect "Normalize Lead" → "Score + Draft Reply". Add a Basic LLM Chain node (`@n8n/n8n-nodes-langchain.chainLlm`). Name it `Score + Draft Reply`.

**Chat Model sub-node:** Click the `+` inside the LLM Chain node to add a model. Select "OpenAI Chat Model" (OpenRouter uses OpenAI-compatible format). Configure:
- Credential: select your OpenRouter credential
- Model: `anthropic/claude-sonnet-4-6`
- Base URL (in credential): `https://openrouter.ai/api/v1`

**System Message:** Click "Add Option" → "System Message". Paste:
```
You are a lead qualification assistant for an automation agency.
Analyze inbound leads and respond in valid JSON only — no explanation, no markdown, no code fences.
```

**Prompt field:**
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

- [ ] **Step 6: Add Code node — "Parse Claude Output"**

Connect "Score + Draft Reply" → "Parse Claude Output". Add a Code node, name it `Parse Claude Output`.

```javascript
const raw = $input.item.json.text;
const parsed = JSON.parse(raw);
return parsed;
```

Expected output shape:
```json
{
  "score": 8,
  "reason": "Alex described a clear, specific operational pain with quantified volume (40 leads/month) and selected a revenue range indicating budget. High follow-up priority.",
  "reply_tone": "urgent",
  "email_subject": "Re: Your inquiry — automating your lead follow-up",
  "email_body": "Hey Alex,\n\nRead your note about the 40 leads a month..."
}
```

- [ ] **Step 7: Add Gmail node — "Send Instant Reply"**

Connect "Parse Claude Output" → "Send Instant Reply". Add a Gmail node. Configure:
- Credential: Mark's Gmail credential
- Operation: Send
- To: `={{ $('Normalize Lead').item.json.email }}`
- Subject: `={{ $json.email_subject }}`
- Message: `={{ $json.email_body }}`
- Message Type: Text (plain text, not HTML)
- Name (display name in From field): `Mark Calma`

Note: `$('Normalize Lead').item.json.email` explicitly references the earlier node by name — safe across Wait nodes.

- [ ] **Step 8: Add Google Sheets node — "Log to Sheets"**

Connect "Send Instant Reply" → "Log to Sheets". Add a Google Sheets node. Configure:
- Credential: Mark's Google Sheets credential
- Operation: Append or Update Row (use "Append Row" if Append or Update is unavailable)
- Document ID: `1b_-Jo0qw2ZnO6lTJpt36oKgSAfvcySufZM7YvtwSgU8`
- Sheet: `Leads`
- Columns → map each column:

| Column name | Value expression |
|---|---|
| Timestamp | `={{ $now }}` |
| Name | `={{ $('Normalize Lead').item.json.name }}` |
| Email | `={{ $('Normalize Lead').item.json.email }}` |
| Company | `={{ $('Normalize Lead').item.json.company }}` |
| Revenue Range | `={{ $('Normalize Lead').item.json.revenue }}` |
| Pain | `={{ $('Normalize Lead').item.json.pain }}` |
| Score | `={{ $('Parse Claude Output').item.json.score }}` |
| Score Reason | `={{ $('Parse Claude Output').item.json.reason }}` |
| Reply Tone | `={{ $('Parse Claude Output').item.json.reply_tone }}` |
| Status | `Instant Sent` |

- [ ] **Step 9: Add Wait node — "Wait 3 Days"**

Connect "Log to Sheets" → "Wait 3 Days". Add a Wait node. Configure:
- Name: `Wait 3 Days`
- Resume: `After time interval`
- Wait Amount: `3`
- Wait Unit: `Days`

- [ ] **Step 10: Add Gmail node — "Send Day 3 Follow-up"**

Connect "Wait 3 Days" → "Send Day 3 Follow-up". Add a Gmail node. Configure:
- Credential: Mark's Gmail credential
- Operation: Send
- To: `={{ $('Normalize Lead').item.json.email }}`
- Subject: `={{ "Re: " + $('Parse Claude Output').item.json.email_subject }}`
- Message Type: Text
- Message:
```
Hey {{ $('Normalize Lead').item.json.name }} — just bumping this up in case it got buried.

Happy to show you what this looks like for an agency your size. Usually takes 15 minutes on a call.

— Mark
```

In n8n expressions, write the message body as:
```
={{ "Hey " + $('Normalize Lead').item.json.name + " — just bumping this up in case it got buried.\n\nHappy to show you what this looks like for an agency your size. Usually takes 15 minutes on a call.\n\n— Mark" }}
```

- [ ] **Step 11: Add Wait node — "Wait 4 Days"**

Connect "Send Day 3 Follow-up" → "Wait 4 Days". Add a Wait node. Configure:
- Name: `Wait 4 Days`
- Resume: `After time interval`
- Wait Amount: `4`
- Wait Unit: `Days`

- [ ] **Step 12: Add Gmail node — "Send Day 7 Final"**

Connect "Wait 4 Days" → "Send Day 7 Final". Add a Gmail node. Configure:
- Credential: Mark's Gmail credential
- Operation: Send
- To: `={{ $('Normalize Lead').item.json.email }}`
- Subject: `={{ "Re: " + $('Parse Claude Output').item.json.email_subject }}`
- Message Type: Text
- Message expression:
```
={{ "Last one, " + $('Normalize Lead').item.json.name + ". If the timing's off, no worries — leaving this here in case it's useful later.\n\n— Mark" }}
```

- [ ] **Step 13: Add Slack node — "Slack Alert"**

Connect "Send Day 7 Final" → "Slack Alert". Add a Slack node. Configure:
- Credential: Mark's Slack credential (same as Demo 1)
- Resource: Message
- Operation: Post
- Channel: `#leads` (create this channel in Slack if it doesn't exist yet)
- Message expression:
```
={{ "Lead went cold after 7 days\n\nName: " + $('Normalize Lead').item.json.name + " — " + $('Normalize Lead').item.json.company + "\nScore: " + $('Parse Claude Output').item.json.score + "/10\nReason: " + $('Parse Claude Output').item.json.reason + "\nEmail: " + $('Normalize Lead').item.json.email + "\nRevenue: " + $('Normalize Lead').item.json.revenue }}
```

- [ ] **Step 14: Verify all connections**

The workflow should have exactly this connection chain:
```
Tally Webhook → Normalize Lead → Score + Draft Reply → Parse Claude Output → Send Instant Reply → Log to Sheets → Wait 3 Days → Send Day 3 Follow-up → Wait 4 Days → Send Day 7 Final → Slack Alert
```

No branches. No loops. Linear.

- [ ] **Step 15: Create #leads channel in Slack if it doesn't exist**

In the Demo 1 Slack workspace, check if `#leads` exists. If not, create it manually in Slack: click + next to Channels → name it `leads` → Create.

- [ ] **Step 16: Export workflow JSON and commit**

In n8n, click the three-dot menu (top right) → "Download" → saves as JSON. Rename the downloaded file to `demo-3-lead-followup.json`. Copy it to:
```
delivery-template/n8n-workflows/demo-3-lead-followup.json
```

Then commit:
```bash
git add delivery-template/n8n-workflows/demo-3-lead-followup.json
git commit -m "feat: add Demo 3 lead follow-up n8n workflow"
```

---

### Task 3: End-to-End Test

**Files:**
- No new files. Verifies the live workflow.

**Interfaces:**
- Consumes: Active n8n workflow from Task 2, Tally form from Task 1, Google Sheets Leads tab from Task 1

- [ ] **Step 1: Activate the workflow**

In n8n, toggle the workflow from Inactive to Active (top-right toggle). Confirm it shows Active (green).

- [ ] **Step 2: Create #leads Slack channel (if not done in Task 2)**

Open the Demo 1 Slack workspace. Create channel `#leads` if it doesn't exist.

- [ ] **Step 3: Clear the Leads tab**

Open the Google Sheets Leads tab. Delete all rows except row 1 (the headers). Start fresh.

- [ ] **Step 4: Submit the Tally form**

Open the published Tally form URL. Fill it out:
- Name: `Alex Chen`
- Email: `28markcalma@gmail.com`
- Company name: `Apex Digital Agency`
- Bottleneck: `We get around 40 leads a month but honestly maybe half never hear back from us. The team is just slammed with current clients.`
- Revenue: `$10K–$50K/month`

Click Submit.

- [ ] **Step 5: Verify n8n executed**

In n8n, go to Executions. The workflow should show a green execution that ran through "Log to Sheets" and is now paused at "Wait 3 Days". Execution status: "Waiting".

- [ ] **Step 6: Verify instant email**

Open Gmail (28markcalma@gmail.com). A new email should arrive within 60 seconds of form submission. Verify:
- From: Mark Calma
- To: 28markcalma@gmail.com
- Subject: personalized (references Alex or Apex Digital Agency)
- Body: 3-4 paragraphs, references their specific bottleneck pain, ends with CTA, no em-dashes

- [ ] **Step 7: Verify Google Sheets log**

Open the Leads tab. Row 2 should now have:
- Timestamp: today's date/time
- Name: Alex Chen
- Email: 28markcalma@gmail.com
- Company: Apex Digital Agency
- Revenue Range: $10K–$50K/month
- Pain: the full bottleneck text
- Score: a number 1–10 (expect 7–9 for this lead)
- Score Reason: 2–3 sentences from Claude
- Reply Tone: urgent (expected for this lead profile)
- Status: Instant Sent

- [ ] **Step 8: Confirm test passed**

All 3 checks green: execution ran, email arrived, Sheets row populated. The Day 3 and Day 7 nodes are Wait nodes (native n8n feature, no custom code to verify). Test is complete.

---

### Task 4: Loom Script + Content Docs

**Files:**
- Create: `docs/loom-scripts/demo-3-lead-followup.md`
- Create: `docs/content/demo-3-linkedin-posts.md`
- Create: `docs/outreach/demo-3-templates.md`

**Interfaces:**
- Consumes: Working demo from Task 3
- Produces: Three content files ready for recording and outreach

- [ ] **Step 1: Write the Loom script**

Create `docs/loom-scripts/demo-3-lead-followup.md` with this content:

```markdown
# Demo 3 Loom Script — Lead Follow-Up Automation
**Target:** 2 min 30 sec | **Hard cap:** 3 min 00 sec

## Pre-recording checklist
- [ ] n8n workflow is Active
- [ ] Leads tab in Google Sheets is empty (headers only)
- [ ] Tally form is published and webhook is connected
- [ ] Gmail inbox open
- [ ] n8n Executions panel open in another tab
- [ ] Slack #leads channel open

---

## [0:00 – 0:30] The Pain

"Most agencies I talk to reply to maybe half their inbound leads. Not because they don't care — because the team is already slammed with active clients.

40 leads a month. 20 of them never hear back. That's revenue walking out the door every single week.

I built an automation that makes sure 100% of leads get a reply in under 60 seconds — no manual work."

---

## [0:30 – 1:15] Trigger Live

Switch to the Tally form in browser.

"Here's what a lead sees. Standard contact form."

Fill it out:
- Name: Alex Chen
- Email: your email
- Company: Apex Digital Agency
- Bottleneck: "We get around 40 leads a month but honestly maybe half never hear back from us. The team is just slammed with current clients."
- Revenue: $10K–$50K/month

Hit Submit.

Switch to n8n Executions panel.

"Watch it go. It's reading the form data... Claude is scoring the lead and writing a personalized reply right now... logging to Sheets... sending the email."

---

## [1:15 – 1:45] Show Results

Switch to Gmail.

"Already there. Under 60 seconds."

Open the email. Read one line from the body — the part that references their specific pain.

"It's not a template. Claude read what Alex wrote and responded to it directly."

Switch to Google Sheets Leads tab.

"Lead is logged. Score, Claude's reasoning, reply tone — all here. This is what you'd review every Monday instead of chasing leads manually."

---

## [1:45 – 2:10] Show the Sequence

Switch to n8n workflow view.

"Here's what happens next — no action required."

Point to Wait 3 Days node: "Day 3 — follow-up goes out automatically."
Point to Wait 4 Days node: "Day 7 — final email, and I get a Slack alert so I know to reach out personally if the score was high."

Open Slack #leads briefly: "This is what that alert looks like."

---

## [2:10 – 2:30] The Numbers + CTA

"60% of leads ignored — that's the average across agencies I've talked to.

This gets every lead touched in under 60 seconds, automatically, with a sequence that runs for a week without anyone lifting a finger.

If your agency is leaving leads on the table, link's below."

---

## Post-recording checklist
- [ ] Upload to Loom as Unlisted
- [ ] Copy Loom URL
- [ ] Paste in Build Library sheet — column E, row 4
- [ ] Replace [LOOM_URL] in docs/outreach/demo-3-templates.md
- [ ] Replace [LOOM_URL] in docs/content/demo-3-linkedin-posts.md
```

- [ ] **Step 2: Write the LinkedIn posts**

Create `docs/content/demo-3-linkedin-posts.md` with this content:

```markdown
# Demo 3 LinkedIn Posts — Lead Follow-Up Automation

Post order: Post 1 (Wednesday) → Post 2 (Monday) → Carousel (Thursday)

---

## Post 1 — The Pain
**Publish:** Wednesday of Week 1
**Format:** Text only

Most agencies reply to about half their inbound leads.

Not because they don't want to. Because the team is already full on active clients and nobody has time to write 20 cold replies every week.

So the other half just... don't hear back.

Building an automation that fixes this. Demo next week.

---

## Post 2 — The Build Reveal
**Publish:** Monday of Week 2
**Format:** Text + screen recording clip
**Replace [LOOM_URL] before posting**

I built a lead follow-up automation that responds to every inbound lead in under 60 seconds.

Here's what fires the moment someone fills out your contact form:

✅ Claude reads their pain and scores the lead 1-10
✅ Personalized reply sent — not a template, an actual response to what they wrote
✅ Lead logged to Google Sheets with score and reasoning
✅ Day 3 follow-up queued automatically
✅ Day 7 final email + Slack alert if they still haven't replied

2-min demo: [LOOM_URL]

The scoring paragraph is the part worth watching.

Claude reads what the lead wrote and decides how urgent the reply should be. Hot leads get a different tone than cold ones. All automatic.

If your agency is leaving leads on the table, DM me.

---

## Post 3 — Carousel
**Publish:** Thursday of Week 2
**Format:** 6 slides, dark background, white text

Slide 1: "Why 60% of agency leads never get a reply" [title]
Slide 2: "The problem: your team is full. New leads get pushed to tomorrow. Tomorrow becomes next week."
Slide 3: "Step 1 — Instant reply: Claude reads their pain and writes a personalized response in under 60 seconds"
Slide 4: "Step 2 — Lead scored: 1-10 score with reasoning logged to Google Sheets automatically"
Slide 5: "Step 3 — Full sequence: Day 3 follow-up, Day 7 final email, Slack alert — all automatic"
Slide 6: "Result: 0% of leads ignored. Every single one touched within 60 seconds." [CTA: DM me]

Caption:
Broke down exactly why agencies lose leads and how automation fixes each step.

The instant personalized reply is the part that changes everything. Nobody expects that.

Demo in my previous post.

DM me if your agency is losing leads to slow follow-up.
```

- [ ] **Step 3: Write the outreach templates**

Create `docs/outreach/demo-3-templates.md` with this content:

```markdown
# Demo 3 Outreach Templates — Lead Follow-Up

Replace [LOOM_URL] before sending.
Replace [First Name] and [Company] with real data.
Send manually via LinkedIn DMs.

---

## Day 1 — First Touch

Hey [First Name] —

Quick question — what happens when a new lead fills out your contact form on a day your team is slammed?

I built an automation that replies to every inbound lead in under 60 seconds. Claude reads what they wrote and responds to their actual pain — not a template. Then queues Day 3 and Day 7 follow-ups automatically.

2-min demo showing it fire for a real lead: [LOOM_URL]

Worth a look if your team is losing leads to slow follow-up.

— Mark

---

## Day 4 — Follow-Up

Hey [First Name] — bumping this up.

The demo shows Claude scoring the lead, writing a personalized reply, and logging everything to a dashboard — all in under 60 seconds from form submit.

Happy to build a version for [Company]'s inbound leads if it's useful.

— Mark

---

## Day 8 — Final Touch

Last one, [First Name]. Leaving the video here in case the timing's better later: [LOOM_URL]

— Mark
```

- [ ] **Step 4: Commit all content docs**

```bash
git add docs/loom-scripts/demo-3-lead-followup.md
git add docs/content/demo-3-linkedin-posts.md
git add docs/outreach/demo-3-templates.md
git commit -m "docs: add Demo 3 loom script, linkedin posts, outreach templates"
```
