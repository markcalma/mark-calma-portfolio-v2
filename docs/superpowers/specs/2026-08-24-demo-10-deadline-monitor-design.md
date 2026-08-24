# Demo 10 — Deadline Monitor + PM Alert Design Spec

## Goal

Build a scheduled n8n workflow that runs every morning, reads all active client projects from Google Sheets, flags anything due within 3 days or already overdue, and sends a prioritized alert to the PM via Slack and email - before the client notices anything is at risk.

## Target Pain

Project deadlines get missed because PMs are juggling too many clients at once. Nobody checks the spreadsheet every morning. One missed deadline can cost a client relationship worth thousands a month.

- **Tagline:** "Every deadline monitored. Every at-risk project flagged. Automatically."
- **Pain:** "Missed deadlines are the fastest way to lose a client. But PMs juggling 5-10 projects cannot manually check every deadline every morning. Things slip through - not because nobody cares, but because nobody saw it coming."

## Stack

`n8n` `Claude` `Google Sheets` `Gmail` `Slack`

## Architecture

Scheduled trigger fires every morning at 8AM. Reads all active projects from Google Sheets. Code node calculates days until deadline for each project. Filters to at-risk projects (due in 3 days or less) and overdue projects. If any exist, Claude writes a prioritized alert summary. Slack posts the alert. Gmail sends a full report to the PM. If nothing is at risk, workflow ends silently.

## Google Sheet Structure

**Sheet name:** Active Projects (same sheet as Demo 7 — reuses existing data)

| Column | Description |
|---|---|
| Client Name | e.g. "Apex Digital Agency" |
| Client Email | e.g. "alex@apexdigital.com" |
| Project Name | e.g. "Lead Automation Build" |
| Deadline | Date format YYYY-MM-DD |
| Status | Active / Paused / Complete |
| PM Email | Project manager's email |
| Percent Complete | Numeric 0-100 |

## n8n Workflow

### Node 1: Schedule Trigger
- **Type:** Schedule Trigger
- **Config:** Every day at 8:00 AM
- **For demo recording:** Execute manually in n8n test mode
- **Output:** Trigger fires

### Node 2: Read Active Projects
- **Type:** Google Sheets
- **Operation:** Get Many Rows
- **Sheet:** Active Projects
- **Filter:** Status = Active

### Node 3: Flag At-Risk Projects
- **Type:** Code (JavaScript)
- **Purpose:** Calculate days to deadline, classify as overdue / critical / at-risk
- **Code:**
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

### Node 4: Check If Any At Risk
- **Type:** IF
- **Condition:** `{{ $json.atRisk.length > 0 }}`
- **True branch:** Continue to alert nodes
- **False branch:** End workflow silently (no alert needed)

### Node 5: Write Alert Summary
- **Type:** Basic LLM Chain
- **Model:** anthropic/claude-sonnet-4-6 via OpenRouter
- **Purpose:** Write a clear, prioritized PM alert

**System prompt:**
```
You are a project operations system writing a daily deadline alert for an agency PM.
Be direct and actionable. List projects by priority: Overdue first, then Due Today, then At Risk.
For each project, state what action the PM needs to take today.
Keep the tone calm but urgent. No fluff.
Return only valid JSON. No explanation. No markdown.
```

**User prompt:**
```
Today's date: {{ new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
Total active projects: {{ $json.totalProjects }}

At-risk projects:
{{ JSON.stringify($json.atRisk, null, 2) }}

Return this exact JSON:
{
  "slackMessage": "concise Slack message with project list and actions (use line breaks for readability)",
  "emailSubject": "email subject line",
  "emailBody": "full HTML email body with prioritized project list and action items"
}
```

### Node 6: Parse Alert
- **Type:** Code (JavaScript)
- **Code:**
```javascript
const raw = $input.item.json.text;
return JSON.parse(raw);
```

### Node 7: Send Slack Alert
- **Type:** Slack
- **Operation:** Post Message
- **Channel:** #project-ops
- **Message:** `{{ $json.slackMessage }}`

### Node 8: Send PM Email
- **Type:** Gmail
- **Operation:** Send
- **To:** PM email (use first project's PM email or a fixed PM email address)
- **To expression:** `{{ $('Flag At-Risk Projects').item.json.atRisk[0].pmEmail }}`
- **Subject:** `{{ $json.emailSubject }}`
- **Message:** `{{ $json.emailBody }}`
- **Email type:** HTML

## Data Flow Summary

```
Schedule Trigger (8AM daily)
  → Read Active Projects (Google Sheets)
  → Flag At-Risk Projects (Code - calculate days, classify)
  → Check If Any At Risk (IF node)
    → [True] Write Alert Summary (Claude)
    → Parse Alert
    → Send Slack Alert
    → Send PM Email (Gmail)
    → [False] End (silent - no alerts needed)
```

## Demo Script Summary

**Live demo flow (2.5 min):**
1. Show Google Sheet - 5 projects with various deadlines. Point out 2 that are overdue or due within 3 days.
2. Click Execute in n8n - narrate: "Every morning at 8AM, it scans every project automatically"
3. Show IF node passing the at-risk check - "Two projects flagged"
4. Show Slack alert - prioritized list with overdue first, clear action items
5. Show Gmail (PM inbox) - full HTML report with color-coded risk levels
6. CTA: "The PM sees what needs attention before the client does."

## Portfolio Page

- **Slug:** `demo-10`
- **Title:** Deadline Monitor + PM Alert
- **Tagline:** "Every deadline monitored. Every at-risk project flagged. Automatically."
- **Pain:** "Missed deadlines are the fastest way to lose a client. But PMs juggling 5-10 projects cannot manually check every deadline every morning. Things slip through - not because nobody cares, but because nobody saw it coming."
- **Stack:** `n8n` `Claude` `Google Sheets` `Gmail` `Slack`
- **Steps:**
  1. **Scheduled trigger fires** - every morning at 8AM, no manual action needed
  2. **All active projects scanned** - reads every row in the project tracker
  3. **Deadlines calculated** - flags overdue, due today, and due within 3 days
  4. **Claude writes the alert** - prioritized action list with what needs attention first
  5. **Slack alert posted** - PM sees the list before checking a single spreadsheet
  6. **Email report sent** - full breakdown with color-coded risk levels in the PM's inbox

## What Mark Provides Before Recording

1. Google Sheet (Active Projects) with 5+ projects, 2 of which are at risk or overdue
2. Google Sheets connected in n8n
3. Gmail connected in n8n with PM email set
4. Slack connected in n8n with #project-ops channel
5. n8n workflow Active
6. Slack #project-ops open to show alert
7. Gmail inbox (PM) open to show email report
8. n8n Executions panel open
