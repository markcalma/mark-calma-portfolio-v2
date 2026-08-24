# Demo 8 — Change Request Intake Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an n8n workflow where a client submits a change request via Tally, Claude classifies it and estimates effort, a task is logged to Google Sheets, the client receives an acknowledgment, and the PM gets a Slack alert — all in 30 seconds.

**Architecture:** 7-node pipeline. Tally → Normalize → Claude classifies and estimates → Parse → Log to Sheets → Gmail to client → Slack to PM.

**Tech Stack:** Tally, n8n, Claude via OpenRouter, Google Sheets, Gmail, Slack

**Spec:** `docs/superpowers/specs/2026-08-24-demo-8-change-request-intake-design.md`

## Global Constraints

- No em-dashes in any copy
- Claude model: `anthropic/claude-sonnet-4-6` via OpenRouter
- Tally field labels must match Normalize Fields code exactly
- Google Sheet: `Change Request Log` (exact name)
- Gmail node email type: HTML
- Slack channel: `#project-ops`
- OpenRouter API key: `OPENROUTER_API_KEY` env var

---

### Task 1: Tally Form + Google Sheet Setup + Trigger

**Interfaces:**
- Produces: Tally webhook payload; empty Change Request Log sheet ready for Task 5

- [ ] **Step 1: Create Change Request Log sheet**

Create a new Google Sheet named **"Change Request Log"**. Add these headers in Row 1:

`Timestamp` | `Client Name` | `Client Email` | `Project` | `Request` | `Urgency` | `Type` | `Estimated Hours` | `Status`

Leave it empty — rows will be added by the workflow.

- [ ] **Step 2: Create Tally form**

Create a new Tally form named **"Submit a Change Request"**. Add these fields:

| Label | Type |
|---|---|
| Your name | Short answer |
| Your email | Email |
| Project name | Short answer |
| Describe the change you need | Long answer |
| How urgent is this? | Dropdown |

Dropdown options: `Low`, `Medium`, `High`, `Critical`

Publish the form.

- [ ] **Step 3: Create workflow + Tally Trigger**

Create n8n workflow named **"Demo 8: Change Request Intake"**. Add **Tally Trigger**, connect webhook to form.

- [ ] **Step 4: Verify trigger**

Submit test data:
- Your name: `Alex Chen`
- Your email: `28markcalma@gmail.com`
- Project name: `Apex Digital Website`
- Describe the change you need: `The contact form on our website is broken and leads are not coming through. This is urgent - we may have lost leads already.`
- How urgent is this?: `High`

Confirm `data.fields` in Tally Trigger output.

---

### Task 2: Normalize Fields

**Interfaces:**
- Consumes: `$input.item.json.data.fields`
- Produces: `{ clientName, clientEmail, projectName, requestDescription, urgency }` — consumed by Tasks 3, 5, 6, 7

- [ ] **Step 1: Add Code node**

Add **Code** node after Tally Trigger. Name it `Normalize Fields`.

```javascript
const fields = $input.item.json.data.fields;
const get = (label) => fields.find(f => f.label === label)?.value ?? '';

return {
  clientName: get('Your name'),
  clientEmail: get('Your email'),
  projectName: get('Project name'),
  requestDescription: get('Describe the change you need'),
  urgency: get('How urgent is this?')
};
```

- [ ] **Step 2: Pin and execute**

Pin Tally Trigger output. Execute Normalize Fields. Expected:
```json
{
  "clientName": "Alex Chen",
  "clientEmail": "28markcalma@gmail.com",
  "projectName": "Apex Digital Website",
  "requestDescription": "The contact form on our website is broken...",
  "urgency": "High"
}
```

---

### Task 3: Classify and Estimate (Claude)

**Interfaces:**
- Consumes: `{ clientName, projectName, requestDescription, urgency }` from Normalize Fields
- Produces: `{ text: "{ \"requestType\": \"...\", \"estimatedHours\": N, \"emailSubject\": \"...\", \"emailBody\": \"...\" }" }` — consumed by Task 4

- [ ] **Step 1: Add Basic LLM Chain node**

Add **Basic LLM Chain** after Normalize Fields. Name it `Classify and Estimate`. Model: `anthropic/claude-sonnet-4-6`.

System prompt:
```
You are a project manager at a digital agency.
Read the client's change request and do three things:
1. Classify the type: Bug Fix, New Feature, Design Change, or Content Update
2. Estimate effort in hours (be realistic: small 1-3h, medium 4-8h, large 8-16h)
3. Write a professional acknowledgment email that references their specific request, confirms you received it, gives a realistic response timeline based on urgency, and sets expectations without overpromising.
Return only valid JSON. No explanation. No markdown.
```

User prompt:
```
Client: {{ $json.clientName }}
Project: {{ $json.projectName }}
Request: {{ $json.requestDescription }}
Urgency: {{ $json.urgency }}

Return this exact JSON:
{
  "requestType": "Bug Fix | New Feature | Design Change | Content Update",
  "estimatedHours": 4,
  "emailSubject": "subject line",
  "emailBody": "acknowledgment email body in HTML"
}
```

- [ ] **Step 2: Execute and verify**

Expected output `text` field contains JSON with all 4 keys. `requestType` for the broken contact form test should be `Bug Fix`. `estimatedHours` should be a reasonable number (1-8 for a broken form).

---

### Task 4: Parse Classification

**Interfaces:**
- Consumes: `$input.item.json.text`
- Produces: `{ requestType, estimatedHours, emailSubject, emailBody }` — consumed by Tasks 5, 6, 7

- [ ] **Step 1: Add Code node**

Add **Code** node after Classify and Estimate. Name it `Parse Classification`.

```javascript
const raw = $input.item.json.text;
return JSON.parse(raw);
```

- [ ] **Step 2: Execute and verify**

Expected: all 4 keys present. `requestType` is one of the four valid options. `estimatedHours` is a number.

---

### Task 5: Log to Sheets

**Interfaces:**
- Consumes: `$('Normalize Fields').item.json`, `$('Parse Classification').item.json`
- Produces: new row in Change Request Log sheet

- [ ] **Step 1: Add Google Sheets node**

Add **Google Sheets** node after Parse Classification. Name it `Log to Sheets`.

- Operation: Append Row
- Spreadsheet: Change Request Log
- Sheet: Sheet1
- Column mapping (map each column header to an expression):
  - `Timestamp`: `={{ new Date().toISOString() }}`
  - `Client Name`: `={{ $('Normalize Fields').item.json.clientName }}`
  - `Client Email`: `={{ $('Normalize Fields').item.json.clientEmail }}`
  - `Project`: `={{ $('Normalize Fields').item.json.projectName }}`
  - `Request`: `={{ $('Normalize Fields').item.json.requestDescription }}`
  - `Urgency`: `={{ $('Normalize Fields').item.json.urgency }}`
  - `Type`: `={{ $('Parse Classification').item.json.requestType }}`
  - `Estimated Hours`: `={{ $('Parse Classification').item.json.estimatedHours }}`
  - `Status`: `=New`

- [ ] **Step 2: Execute and verify**

Execute Log to Sheets. Open Google Sheet — confirm new row appeared with all 9 columns filled. Status should be `New`.

---

### Task 6: Send Client Acknowledgment

**Interfaces:**
- Consumes: `$('Normalize Fields').item.json.clientEmail`, `$('Parse Classification').item.json.emailSubject`, `$('Parse Classification').item.json.emailBody`
- Produces: acknowledgment email to client

- [ ] **Step 1: Add Gmail node**

Add **Gmail** node after Log to Sheets. Name it `Send Client Acknowledgment`.

- Operation: Send
- To: `={{ $('Normalize Fields').item.json.clientEmail }}`
- Subject: `={{ $('Parse Classification').item.json.emailSubject }}`
- Message: `={{ $('Parse Classification').item.json.emailBody }}`
- Email Type: **HTML**

- [ ] **Step 2: Execute and verify**

Execute Send Client Acknowledgment. Check Gmail. Confirm email arrived referencing the specific broken form issue, not generic text. No em-dashes in subject or body.

---

### Task 7: Slack Alert + End-to-End Test + Activate + Screenshot

- [ ] **Step 1: Add Slack node**

Add **Slack** node after Send Client Acknowledgment. Name it `Slack Alert to PM`.

- Operation: Post Message
- Channel: `#project-ops`
- Message:
```
New change request logged
Client: {{ $('Normalize Fields').item.json.clientName }}
Project: {{ $('Normalize Fields').item.json.projectName }}
Type: {{ $('Parse Classification').item.json.requestType }}
Estimated: {{ $('Parse Classification').item.json.estimatedHours }}h
Urgency: {{ $('Normalize Fields').item.json.urgency }}
Client has been acknowledged automatically.
```

- [ ] **Step 2: Full end-to-end test**

Submit Tally form live. Watch all 7 nodes go green. Verify:
- Google Sheets: new row with correct classification
- Gmail (client): acknowledgment referencing their specific issue
- Slack #project-ops: PM alert with type and hours
- No em-dashes anywhere

- [ ] **Step 3: Activate and screenshot**

Set workflow **Active**. Screenshot canvas. Save as `site/public/workflows/demo-8.png`.

```bash
git add site/public/workflows/demo-8.png
git commit -m "feat: add Demo 8 workflow screenshot"
git push origin master
```
