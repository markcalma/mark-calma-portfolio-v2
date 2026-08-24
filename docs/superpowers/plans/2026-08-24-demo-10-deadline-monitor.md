# Demo 10 — Deadline Monitor + PM Alert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scheduled n8n workflow that reads all active projects every morning, flags anything overdue or due within 3 days, has Claude write a prioritized alert, and delivers it via Slack and email to the PM — before the client notices.

**Architecture:** 8-node pipeline. Schedule trigger → Read Sheets → Flag at-risk (Code) → IF check → Write alert (Claude) → Parse → Send Slack → Send PM email. Workflow ends silently if nothing is at risk.

**Tech Stack:** n8n, Claude via OpenRouter, Google Sheets, Gmail, Slack

**Spec:** `docs/superpowers/specs/2026-08-24-demo-10-deadline-monitor-design.md`

## Global Constraints

- No em-dashes in any copy
- Claude model: `anthropic/claude-sonnet-4-6` via OpenRouter
- Google Sheet: `Active Projects` (reuses Demo 7 sheet — same sheet, same columns)
- Status column: `Active` (exact, case-sensitive)
- Deadline column format: `YYYY-MM-DD`
- Risk levels: `Overdue`, `Due Today`, `At Risk` (exact strings)
- Gmail node email type: HTML
- Slack channel: `#project-ops`
- OpenRouter API key: `OPENROUTER_API_KEY` env var

---

### Task 1: Google Sheet Setup + Schedule Trigger

**Interfaces:**
- Produces: Active Projects sheet with at-risk rows; schedule trigger ready

- [ ] **Step 1: Update Active Projects sheet for demo**

Open the `Active Projects` sheet from Demo 7. Update the Deadline column to make 2 projects at-risk (use actual dates relative to today):

Set one row Deadline to 2 days ago (overdue). Set another row Deadline to tomorrow (At Risk). Keep the third row Deadline 2 weeks out (safe). Example (if today is 2026-08-24):

| Client Name | Deadline | Status | ... |
|---|---|---|---|
| Apex Digital Agency | 2026-08-22 | Active | ... |
| BrightSpark Media | 2026-08-25 | Active | ... |
| Nova Agency | 2026-09-07 | Active | ... |

This ensures 2 projects trigger the alert and 1 does not.

- [ ] **Step 2: Create workflow + Schedule Trigger**

Create n8n workflow **"Demo 10: Deadline Monitor + PM Alert"**.

Add **Schedule Trigger** node. Set to: Every Day at 8:00 AM.

For demo recording: click **Execute Workflow** manually.

---

### Task 2: Read Active Projects

**Interfaces:**
- Consumes: Schedule trigger
- Produces: Array of active project rows — consumed by Task 3

- [ ] **Step 1: Add Google Sheets node**

Add **Google Sheets** node after Schedule Trigger. Name it `Read Active Projects`.

- Operation: Get Many Rows
- Spreadsheet: Active Projects
- Sheet: Active Projects
- Filters: `Status` equals `Active`

- [ ] **Step 2: Execute and verify**

Expected: 3 rows returned. Each row has `Client Name`, `Deadline`, `Percent Complete`, `PM Email` columns populated.

---

### Task 3: Flag At-Risk Projects

**Interfaces:**
- Consumes: `$input.all()` — all project rows
- Produces: `{ atRisk: [...], totalProjects: N }` — consumed by Task 4

- [ ] **Step 1: Add Code node**

Add **Code** node after Read Active Projects. Name it `Flag At-Risk Projects`. Set mode to **Run Once for All Items**.

```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

const projects = $input.all().map(item => {
  const row = item.json;
  const deadline = new Date(row['Deadline']);
  deadline.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

  let riskLevel = null;
  if (daysUntil < 0) riskLevel = 'Overdue';
  else if (daysUntil === 0) riskLevel = 'Due Today';
  else if (daysUntil <= 3) riskLevel = 'At Risk';

  return {
    clientName: row['Client Name'],
    clientEmail: row['Client Email'],
    projectName: row['Project Name'],
    deadline: row['Deadline'],
    percentComplete: row['Percent Complete'],
    pmEmail: row['PM Email'],
    daysUntil,
    riskLevel
  };
});

const atRisk = projects.filter(p => p.riskLevel !== null);

return { atRisk, totalProjects: projects.length };
```

- [ ] **Step 2: Execute and verify**

Expected: `atRisk` array contains 2 projects (Apex Digital as Overdue, BrightSpark as At Risk). `totalProjects: 3`. Nova Agency is NOT in `atRisk`.

---

### Task 4: IF Check — Any At Risk?

**Interfaces:**
- Consumes: `$json.atRisk.length`
- Produces: routes to alert path (true) or ends silently (false)

- [ ] **Step 1: Add IF node**

Add **IF** node after Flag At-Risk Projects. Name it `Any At Risk?`.

Condition: `{{ $json.atRisk.length }}` **greater than** `0`

- True branch → connect to Write Alert Summary (Task 5)
- False branch → connect to a **No Operation** node (or leave disconnected) — workflow ends silently

- [ ] **Step 2: Verify routing**

Execute with the current sheet data. The IF node should route to True because 2 projects are at risk. Confirm by checking which branch lights up green.

---

### Task 5: Write Alert Summary (Claude)

**Interfaces:**
- Consumes: `$json.atRisk` array, `$json.totalProjects` from Flag At-Risk Projects
- Produces: `{ text: "{ \"slackMessage\": \"...\", \"emailSubject\": \"...\", \"emailBody\": \"...\" }" }` — consumed by Task 6

- [ ] **Step 1: Add Basic LLM Chain node**

Add **Basic LLM Chain** on the True branch of the IF node. Name it `Write Alert Summary`. Model: `anthropic/claude-sonnet-4-6`.

System prompt:
```
You are a project operations system writing a daily deadline alert for an agency PM.
Be direct and actionable. List projects by priority: Overdue first, then Due Today, then At Risk.
For each project, state what action the PM needs to take today.
Keep the tone calm but urgent. No fluff.
Return only valid JSON. No explanation. No markdown.
```

User prompt:
```
Today's date: {{ new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
Total active projects: {{ $json.totalProjects }}

At-risk projects:
{{ JSON.stringify($json.atRisk, null, 2) }}

Return this exact JSON:
{
  "slackMessage": "concise Slack message with project list and actions (use line breaks with \n for readability)",
  "emailSubject": "email subject line",
  "emailBody": "full HTML email body with prioritized project list and action items"
}
```

- [ ] **Step 2: Execute and verify**

Expected: `text` field contains JSON with all 3 keys. `slackMessage` should list Apex Digital first (Overdue), then BrightSpark (At Risk). Email body should have color-coded or priority-labeled sections.

---

### Task 6: Parse Alert + Send Slack + Send PM Email + Activate + Screenshot

**Interfaces:**
- Consumes: `$input.item.json.text` from Write Alert Summary; `$json.atRisk[0].pmEmail`
- Produces: Slack message + PM email delivered

- [ ] **Step 1: Add Code node to parse**

Add **Code** node after Write Alert Summary. Name it `Parse Alert`.

```javascript
const raw = $input.item.json.text;
return JSON.parse(raw);
```

- [ ] **Step 2: Add Slack node**

Add **Slack** node after Parse Alert. Name it `Send Slack Alert`.

- Channel: `#project-ops`
- Message: `={{ $json.slackMessage }}`

- [ ] **Step 3: Add Gmail node**

Add **Gmail** node after Send Slack Alert. Name it `Send PM Email`.

- To: `={{ $('Flag At-Risk Projects').item.json.atRisk[0].pmEmail }}`
- Subject: `={{ $json.emailSubject }}`
- Message: `={{ $json.emailBody }}`
- Email Type: **HTML**

- [ ] **Step 4: Full end-to-end test**

Execute full workflow manually. Check:
- Slack #project-ops: alert with Overdue project listed first, then At Risk
- Gmail (PM): HTML email with deadline summary and action items
- No em-dashes in Slack message, email subject, or email body

- [ ] **Step 5: Test the silent path**

Update all project deadlines in the sheet to be 2+ weeks out. Run workflow again. Confirm the IF node routes to False and no Slack/email is sent.

Restore the at-risk dates for the demo recording.

- [ ] **Step 6: Activate and screenshot**

Set workflow **Active**. Screenshot canvas with all 8 nodes visible (including the False/silent branch). Save as `site/public/workflows/demo-10.png`.

```bash
git add site/public/workflows/demo-10.png
git commit -m "feat: add Demo 10 workflow screenshot"
git push origin master
```
