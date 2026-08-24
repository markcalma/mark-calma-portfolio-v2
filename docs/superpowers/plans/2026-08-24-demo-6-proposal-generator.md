# Demo 6 — Proposal Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an n8n workflow that takes 6 prospect details from a Tally form, has Claude write a full custom proposal, and emails it directly to the prospect in 90 seconds.

**Architecture:** 6-node sequential pipeline. Tally webhook → Normalize Fields → Claude writes proposal as JSON → Parse → Build HTML email → Gmail sends to prospect.

**Tech Stack:** Tally, n8n, Claude via OpenRouter (Basic LLM Chain), Gmail

**Spec:** `docs/superpowers/specs/2026-08-24-demo-6-proposal-generator-design.md`

## Global Constraints

- No em-dashes in any copy — use ` - ` (space-hyphen-space) instead
- Claude model: `anthropic/claude-sonnet-4-6` via OpenRouter
- Tally field labels must match Node 2 Code exactly — same casing, same spacing
- Gmail node email type: HTML
- OpenRouter API key stored as n8n environment variable `OPENROUTER_API_KEY`

---

### Task 1: Tally Form + Trigger

**Interfaces:**
- Produces: Tally webhook payload consumed by Task 2

- [ ] **Step 1: Create Tally form**

Create a new Tally form named **"Proposal Generator"**. Add these fields with these exact labels:

| Label | Type |
|---|---|
| Prospect name | Short answer |
| Prospect email | Email |
| Company name | Short answer |
| Main challenge (what they told you on the call) | Long answer |
| Service you are proposing | Short answer |
| Investment range | Short answer |

Add placeholder to Investment range: `e.g. $2,000-$5,000/month`

Publish the form.

- [ ] **Step 2: Create workflow + add Tally Trigger**

Create a new n8n workflow named **"Demo 6: Proposal Generator"**. Add a **Tally Trigger** node. Copy the webhook URL and connect it in Tally form settings → Integrations → Webhook.

- [ ] **Step 3: Verify trigger**

Submit the form with test data:
- Prospect name: `Alex Chen`
- Prospect email: `28markcalma@gmail.com`
- Company name: `Apex Digital Agency`
- Main challenge: `We get around 40 leads a month but honestly maybe half never hear back from us. The team is just slammed with current clients.`
- Service you are proposing: `lead follow-up automation`
- Investment range: `$2,000-$4,000/month`

Confirm `data.fields` array appears in Tally Trigger output.

---

### Task 2: Normalize Fields

**Interfaces:**
- Consumes: `$input.item.json.data.fields`
- Produces: `{ prospectName, prospectEmail, companyName, mainChallenge, serviceProposed, investmentRange }` — consumed by Tasks 3 and 5

- [ ] **Step 1: Add Code node**

Add a **Code** node after Tally Trigger. Name it `Normalize Fields`.

```javascript
const fields = $input.item.json.data.fields;
const get = (label) => fields.find(f => f.label === label)?.value ?? '';

return {
  prospectName: get('Prospect name'),
  prospectEmail: get('Prospect email'),
  companyName: get('Company name'),
  mainChallenge: get('Main challenge (what they told you on the call)'),
  serviceProposed: get('Service you are proposing'),
  investmentRange: get('Investment range')
};
```

- [ ] **Step 2: Pin data and execute**

Pin the Tally Trigger output from Task 1. Execute Normalize Fields. Expected:
```json
{
  "prospectName": "Alex Chen",
  "prospectEmail": "28markcalma@gmail.com",
  "companyName": "Apex Digital Agency",
  "mainChallenge": "We get around 40 leads...",
  "serviceProposed": "lead follow-up automation",
  "investmentRange": "$2,000-$4,000/month"
}
```

Empty fields mean label mismatch — fix the label string in the code.

---

### Task 3: Write Proposal (Claude)

**Interfaces:**
- Consumes: `{ prospectName, companyName, mainChallenge, serviceProposed, investmentRange }` from Normalize Fields
- Produces: `{ text: "{ \"subject\": \"...\", \"body\": \"...\" }" }` — consumed by Task 4

- [ ] **Step 1: Add Basic LLM Chain node**

Add a **Basic LLM Chain** node after Normalize Fields. Name it `Write Proposal`. Model: `anthropic/claude-sonnet-4-6` via OpenRouter.

System prompt:
```
You are a senior agency consultant writing custom proposals for automation services.
Write a professional, persuasive proposal email that reads as if personally written - not templated.
Reference the prospect's specific challenge directly. Use plain English. No jargon.
Structure: opening hook, problem restatement, proposed solution, what they get (3-4 bullet deliverables), timeline, investment, clear next step.
Return only valid JSON. No explanation. No markdown.
```

User prompt:
```
Prospect name: {{ $json.prospectName }}
Company: {{ $json.companyName }}
Their main challenge: {{ $json.mainChallenge }}
Service proposed: {{ $json.serviceProposed }}
Investment range: {{ $json.investmentRange }}

Return this exact JSON:
{
  "subject": "email subject line",
  "body": "full HTML proposal email body"
}
```

- [ ] **Step 2: Execute and verify**

Execute Write Proposal. The `text` field must be a valid JSON string containing `subject` and `body` keys. The body should reference the prospect's actual challenge (not generic text). If Claude returns markdown fences, tighten the system prompt.

---

### Task 4: Parse Proposal

**Interfaces:**
- Consumes: `$input.item.json.text` — JSON string from Write Proposal
- Produces: `{ subject: string, body: string }` — consumed by Task 5

- [ ] **Step 1: Add Code node**

Add a **Code** node after Write Proposal. Name it `Parse Proposal`.

```javascript
const raw = $input.item.json.text;
return JSON.parse(raw);
```

- [ ] **Step 2: Execute and verify**

Expected: `{ "subject": "...", "body": "<p>Hi Alex..." }`. Both keys must be non-empty strings.

---

### Task 5: Build Email Body

**Interfaces:**
- Consumes: `$('Normalize Fields').item.json.prospectEmail`, `$input.item.json` (subject + body from Parse Proposal)
- Produces: `{ emailTo, emailSubject, emailBody }` — consumed by Task 6

- [ ] **Step 1: Add Code node**

Add a **Code** node after Parse Proposal. Name it `Build Email Body`.

```javascript
const fields = $('Normalize Fields').item.json;
const proposal = $input.item.json;

const html = `
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111; line-height: 1.6;">
  ${proposal.body}
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
  <p style="color: #888; font-size: 12px;">Sent via Mark Calma Automation</p>
</div>
`;

return {
  emailTo: fields.prospectEmail,
  emailSubject: proposal.subject,
  emailBody: html
};
```

- [ ] **Step 2: Execute and verify**

Expected: `{ "emailTo": "28markcalma@gmail.com", "emailSubject": "...", "emailBody": "<div..." }`. The emailBody should contain the full proposal HTML.

---

### Task 6: Send Email + End-to-End Test + Activate + Screenshot

- [ ] **Step 1: Add Gmail Send node**

Add a **Gmail** node after Build Email Body. Name it `Send Email`.
- Operation: Send
- To: `{{ $json.emailTo }}`
- Subject: `{{ $json.emailSubject }}`
- Message: `{{ $json.emailBody }}`
- Email Type: **HTML**

- [ ] **Step 2: Run end-to-end test**

Submit the Tally form live. Watch all 6 nodes go green in Executions panel.

- [ ] **Step 3: Check Gmail**

Open Gmail. Find the proposal email. Confirm:
- Subject line is compelling and references the prospect
- Body reads as a real proposal, not a template
- Prospect's actual challenge is referenced in the opening
- No em-dashes anywhere in subject or body

- [ ] **Step 4: Activate workflow**

Set workflow to **Active**.

- [ ] **Step 5: Screenshot and commit**

Screenshot n8n canvas with all 6 nodes visible. Save as `site/public/workflows/demo-6.png`.

```bash
git add site/public/workflows/demo-6.png
git commit -m "feat: add Demo 6 workflow screenshot"
git push origin master
```
