# Demo 7 — Automated Project Status Report Design Spec

## Goal

Build a scheduled n8n workflow that reads all active client projects from a Google Sheet every Friday morning, has Claude write a professional status update email per client, and sends each one automatically - with no PM intervention.

## Target Pain

Project managers at agencies spend 30-45 minutes writing weekly status emails per client. For a 5-client agency, that is over 3 hours every Friday before a single billable task happens.

- **Tagline:** "5 client status updates. Written and sent. Zero PM time."
- **Pain:** "Every Friday, agency PMs write the same emails - what we did this week, what is next, any blockers. For a 5-client agency, that is 3+ hours of non-billable writing before the weekend even starts."

## Stack

`n8n` `Claude` `Google Sheets` `Gmail` `Slack`

## Architecture

Scheduled trigger fires every Friday at 9AM. Reads all active project rows from a Google Sheet (one row per client project). Loops over each row - Claude writes a professional update per client. Gmail sends each update. Slack posts a summary of what was sent.

## Google Sheet Structure

**Sheet name:** Active Projects

| Column | Description |
|---|---|
| Client Name | e.g. "Apex Digital Agency" |
| Client Email | e.g. "alex@apexdigital.com" |
| Project Name | e.g. "Lead Automation Build" |
| Tasks Done This Week | e.g. "Built webhook trigger, tested Gmail integration" |
| Blockers | e.g. "Waiting on API key from client" or "None" |
| Next Steps | e.g. "Final testing on Monday, delivery Thursday" |
| Percent Complete | e.g. "75" |
| Status | Active / Paused / Complete (only Active rows are processed) |

## n8n Workflow

### Node 1: Schedule Trigger
- **Type:** Schedule Trigger
- **Config:** Every Friday at 9:00 AM
- **For demo recording:** Execute manually in n8n test mode
- **Output:** Trigger fires

### Node 2: Read Active Projects
- **Type:** Google Sheets
- **Operation:** Get Many Rows
- **Sheet:** Active Projects
- **Filter:** Status = Active
- **Output:** Array of project rows

### Node 3: Loop Over Projects
- **Type:** Loop Over Items
- **Purpose:** Process each project row independently
- **Output:** One item at a time to nodes 4-6

### Node 4: Write Client Update
- **Type:** Basic LLM Chain
- **Model:** anthropic/claude-sonnet-4-6 via OpenRouter
- **Purpose:** Write a professional, human-sounding status update per client

**System prompt:**
```
You are a project manager at a digital agency writing weekly status updates to clients.
Write in a professional but warm tone - like a trusted partner, not a corporate report.
Reference specific tasks and progress. Be direct about blockers without alarming the client.
Keep it concise: 150-200 words. No bullet points - flowing paragraphs only.
Return only valid JSON. No explanation. No markdown.
```

**User prompt:**
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

### Node 5: Parse Update
- **Type:** Code (JavaScript)
- **Code:**
```javascript
const raw = $input.item.json.text;
return JSON.parse(raw);
```

### Node 6: Send Client Email
- **Type:** Gmail
- **Operation:** Send
- **To:** `{{ $('Loop Over Projects').item.json['Client Email'] }}`
- **Subject:** `{{ $json.subject }}`
- **Message:** `{{ $json.body }}`
- **Email type:** HTML

### Node 7: Aggregate Results
- **Type:** Code (JavaScript)
- **Purpose:** Collect all sent updates for Slack summary
- **Runs after loop completes**
- **Code:**
```javascript
const items = $input.all();
const count = items.length;
const names = items.map(i => i.json['Client Name'] ?? 'Unknown').join(', ');
return { count, names };
```

### Node 8: Send Slack Summary
- **Type:** Slack
- **Operation:** Post Message
- **Channel:** #project-updates
- **Message:** `{{ $json.count }} client status updates sent automatically this Friday: {{ $json.names }}`

## Data Flow Summary

```
Schedule Trigger (Friday 9AM)
  → Read Active Projects (Google Sheets)
  → Loop Over Projects
    → Write Client Update (Claude)
    → Parse Update
    → Send Client Email (Gmail)
  → Aggregate Results
  → Send Slack Summary
```

## Demo Script Summary

**Live demo flow (2.5 min):**
1. Show Google Sheet with 3-5 active project rows - point out Tasks Done, Next Steps, % Complete columns
2. Click Execute in n8n - narrate: "It is reading every active project right now"
3. Watch loop fire for each row in Executions panel
4. Open Gmail - show 3-5 separate client emails, each referencing the specific project details
5. Show Slack - summary message listing all clients updated
6. CTA: "Every Friday. Zero PM time."

## Portfolio Page

- **Slug:** `demo-7`
- **Title:** Automated Project Status Report
- **Tagline:** "5 client status updates. Written and sent. Zero PM time."
- **Pain:** "Every Friday, agency PMs write the same emails - what we did this week, what is next, any blockers. For a 5-client agency, that is 3+ hours of non-billable writing before the weekend even starts."
- **Stack:** `n8n` `Claude` `Google Sheets` `Gmail` `Slack`
- **Steps:**
  1. **Scheduled trigger fires** - every Friday at 9AM, no manual action needed
  2. **Active projects pulled** - reads every active client row from Google Sheets
  3. **Claude writes each update** - professional, human-sounding paragraph per client referencing their specific progress
  4. **Email sent to each client** - personalized, on time, every week
  5. **Slack summary posted** - team knows all updates went out without checking

## What Mark Provides Before Recording

1. Google Sheet (Active Projects) with 3-5 realistic project rows filled in
2. Google Sheets connected in n8n with correct sheet ID
3. Gmail connected in n8n
4. Slack connected in n8n with #project-updates channel
5. n8n workflow Active
6. Gmail inbox open showing received client emails
7. Slack #project-updates open in another tab
8. n8n Executions panel open
