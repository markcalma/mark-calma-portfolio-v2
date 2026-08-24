# Demo 7 — Automated Project Status Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scheduled n8n workflow that reads active projects from Google Sheets every Friday, has Claude write a status update per client, and emails each one automatically with a Slack summary.

**Architecture:** Schedule trigger → Read Google Sheets → Loop over rows → Claude writes update per client → Gmail sends per client → Aggregate → Slack summary. 8 nodes total.

**Tech Stack:** n8n, Claude via OpenRouter (Basic LLM Chain), Google Sheets, Gmail, Slack

**Spec:** `docs/superpowers/specs/2026-08-24-demo-7-project-status-report-design.md`

## Global Constraints

- No em-dashes in any copy
- Claude model: `anthropic/claude-sonnet-4-6` via OpenRouter
- Google Sheet name: `Active Projects` (exact)
- Status column value for active rows: `Active` (exact)
- Gmail node email type: HTML
- OpenRouter API key: `OPENROUTER_API_KEY` env var in n8n

---

### Task 1: Google Sheet Setup + Schedule Trigger

**Interfaces:**
- Produces: Sheet ready for Task 2 to read; trigger fires on schedule

- [ ] **Step 1: Create the Google Sheet**

Create a new Google Sheet named **"Active Projects"**. Add these column headers in Row 1 exactly:

`Client Name` | `Client Email` | `Project Name` | `Tasks Done This Week` | `Blockers` | `Next Steps` | `Percent Complete` | `Status` | `PM Email`

Add 3 sample rows with Status = `Active`:

| Client Name | Client Email | Project Name | Tasks Done This Week | Blockers | Next Steps | Percent Complete | Status | PM Email |
|---|---|---|---|---|---|---|---|---|
| Apex Digital Agency | 28markcalma@gmail.com | Lead Automation Build | Built webhook trigger, tested Gmail integration | Waiting on API key from client | Final testing Monday, delivery Thursday | 75 | Active | 28markcalma@gmail.com |
| BrightSpark Media | 28markcalma@gmail.com | SEO Content Pipeline | Firecrawl integrated, Claude writing blog posts | None | Client review session Friday | 50 | Active | 28markcalma@gmail.com |
| Nova Agency | 28markcalma@gmail.com | Client Onboarding | All triggers live, tested with 2 test clients | None | Record Loom demo, send to client | 90 | Active | 28markcalma@gmail.com |

- [ ] **Step 2: Create workflow and add Schedule Trigger**

Create a new n8n workflow named **"Demo 7: Automated Project Status Report"**.

Add a **Schedule Trigger** node. Set to: **Every Week** → **Friday** → **09:00 AM**.

For demo recording: you will click **Execute Workflow** manually instead of waiting for Friday.

---

### Task 2: Read Active Projects

**Interfaces:**
- Consumes: Schedule trigger
- Produces: Array of project rows with Status = Active — consumed by Task 3

- [ ] **Step 1: Add Google Sheets node**

Add a **Google Sheets** node after Schedule Trigger. Name it `Read Active Projects`.

Configure:
- Operation: Get Many Rows (or "Get Rows" depending on n8n version)
- Credential: your Google Sheets OAuth2 credential
- Spreadsheet: select your Active Projects sheet
- Sheet Name: `Active Projects`
- Filters: add filter → Column `Status` equals `Active`

- [ ] **Step 2: Execute and verify**

Execute Read Active Projects. Expected: array of 3 items, each with all 9 column keys. If you get 0 rows, check the Status column value matches `Active` exactly (case-sensitive).

---

### Task 3: Loop Over Projects + Write Client Update

**Interfaces:**
- Consumes: Array of project rows from Read Active Projects
- Produces: Per-row output with `{ subject, body }` — consumed by Task 4

- [ ] **Step 1: Add Loop Over Items node**

Add a **Loop Over Items** node after Read Active Projects. Name it `Loop Over Projects`. No configuration needed — it automatically iterates over the input array.

- [ ] **Step 2: Add Basic LLM Chain node inside loop**

Add a **Basic LLM Chain** node as the first node inside the loop. Name it `Write Client Update`. Model: `anthropic/claude-sonnet-4-6`.

System prompt:
```
You are a project manager at a digital agency writing weekly status updates to clients.
Write in a professional but warm tone - like a trusted partner, not a corporate report.
Reference specific tasks and progress. Be direct about blockers without alarming the client.
Keep it concise: 150-200 words. No bullet points - flowing paragraphs only.
Return only valid JSON. No explanation. No markdown.
```

User prompt:
```
Client: {{ $json['Client Name'] }}
Project: {{ $json['Project Name'] }}
Tasks completed this week: {{ $json['Tasks Done This Week'] }}
Blockers: {{ $json['Blockers'] }}
Next steps: {{ $json['Next Steps'] }}
Percent complete: {{ $json['Percent Complete'] }}%

Return this exact JSON:
{
  "subject": "email subject line",
  "body": "full status update email body in HTML"
}
```

- [ ] **Step 3: Execute loop first iteration and verify**

Execute the loop for the first row. The Write Client Update node should return `{ text: "{ \"subject\": \"...\", \"body\": \"...\" }" }`. Confirm body references the specific client and project (not generic text).

---

### Task 4: Parse Update + Send Client Email

**Interfaces:**
- Consumes: `$input.item.json.text` from Write Client Update; `$('Loop Over Projects').item.json['Client Email']`
- Produces: Email sent to each client

- [ ] **Step 1: Add Code node to parse**

Add a **Code** node after Write Client Update. Name it `Parse Update`.

```javascript
const raw = $input.item.json.text;
return JSON.parse(raw);
```

- [ ] **Step 2: Add Gmail Send node**

Add a **Gmail** node after Parse Update. Name it `Send Client Email`.

- Operation: Send
- To: `={{ $('Loop Over Projects').item.json['Client Email'] }}`
- Subject: `={{ $json.subject }}`
- Message: `={{ $json.body }}`
- Email Type: **HTML**

- [ ] **Step 3: Execute loop fully**

Run the full loop. All 3 clients should receive emails. Check Gmail — confirm 3 separate emails arrived, each referencing their specific project details.

---

### Task 5: Aggregate Results + Slack Summary

**Interfaces:**
- Consumes: All loop output items
- Produces: Slack message summarizing updates sent

- [ ] **Step 1: Add Code node for aggregation**

After the loop closes (outside the loop), add a **Code** node. Name it `Aggregate Results`.

```javascript
const items = $input.all();
const count = items.length;
const names = items.map(i => i.json['Client Name'] ?? 'Unknown').join(', ');
return { count, names };
```

Note: `$input.all()` here reads all loop outputs. If your n8n version uses a different aggregation approach (e.g., an explicit Merge node), add a Merge node before this Code node with mode "Combine All Items".

- [ ] **Step 2: Add Slack node**

Add a **Slack** node after Aggregate Results. Name it `Send Slack Summary`.

- Operation: Post Message
- Channel: `#project-updates` (create this channel in Slack if it doesn't exist)
- Message: `={{ $json.count }} client status updates sent automatically this Friday: {{ $json.names }}`

- [ ] **Step 3: Execute and verify Slack message**

Run the full workflow. Check #project-updates in Slack. Expected: "3 client status updates sent automatically this Friday: Apex Digital Agency, BrightSpark Media, Nova Agency"

---

### Task 6: End-to-End Test + Activate + Screenshot

- [ ] **Step 1: Full end-to-end run**

Click **Execute Workflow** (not Execute node). All nodes must go green. Check:
- Gmail: 3 separate status emails received, each client-specific
- Slack: summary message in #project-updates
- No em-dashes in any email subject or body

- [ ] **Step 2: Activate workflow**

Set workflow to **Active**. It will fire every Friday at 9AM automatically.

- [ ] **Step 3: Screenshot and commit**

Screenshot n8n canvas with all nodes visible. Save as `site/public/workflows/demo-7.png`.

```bash
git add site/public/workflows/demo-7.png
git commit -m "feat: add Demo 7 workflow screenshot"
git push origin master
```
