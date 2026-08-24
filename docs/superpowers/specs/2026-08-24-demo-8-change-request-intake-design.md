# Demo 8 — Change Request Intake Design Spec

## Goal

Build a form-triggered n8n workflow where a client submits a change request, Claude reads it, classifies the type and estimates effort, creates a task in Google Sheets, sends an acknowledgment to the client, and alerts the PM on Slack - all in under 30 seconds.

## Target Pain

Client change requests arrive by email at all hours. Triaging, responding, and creating tasks takes 20+ minutes per request. For an active agency, that is hours every week spent on admin instead of delivery.

- **Tagline:** "Change request in. Task created. Client replied. 30 seconds."
- **Pain:** "Client change requests arrive by email, WhatsApp, and Slack at all hours. Triaging each one - reading, classifying, responding, and creating a task - takes 20 minutes. For an agency with 5 active clients, that is 2+ hours of admin every week."

## Stack

`n8n` `Tally` `Claude` `Google Sheets` `Gmail` `Slack`

## Architecture

Client submits Tally form with their change request. Claude reads the request, classifies the type (bug fix, new feature, design change, content update), estimates effort in hours, and writes a professional acknowledgment email. n8n creates a row in a Google Sheets task tracker. Gmail sends the acknowledgment to the client. Slack alerts the PM.

## Tally Form

**Form name:** Submit a Change Request

| Field | Type | Required |
|---|---|---|
| Your name | Short text | Yes |
| Your email | Email | Yes |
| Project name | Short text | Yes |
| Describe the change you need | Long text | Yes |
| How urgent is this? | Dropdown: Low / Medium / High / Critical | Yes |

No em-dashes in any field labels or descriptions.

## Google Sheet Structure

**Sheet name:** Change Request Log

| Column | Description |
|---|---|
| Timestamp | Auto-filled by workflow |
| Client Name | From form |
| Client Email | From form |
| Project | From form |
| Request | From form |
| Urgency | From form |
| Type | Claude classification |
| Estimated Hours | Claude estimate |
| Status | New (default) |

## n8n Workflow

### Node 1: Tally Trigger
- **Type:** Tally Trigger
- **Config:** Webhook
- **Output:** Raw Tally payload

### Node 2: Normalize Fields
- **Type:** Code (JavaScript)
- **Code:**
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

### Node 3: Classify and Estimate
- **Type:** Basic LLM Chain
- **Model:** anthropic/claude-sonnet-4-6 via OpenRouter
- **Purpose:** Classify request type, estimate effort, write acknowledgment email

**System prompt:**
```
You are a project manager at a digital agency.
Read the client's change request and do three things:
1. Classify the type: Bug Fix, New Feature, Design Change, or Content Update
2. Estimate effort in hours (be realistic: small 1-3h, medium 4-8h, large 8-16h)
3. Write a professional acknowledgment email that references their specific request, confirms you received it, gives a realistic response timeline based on urgency, and sets expectations without overpromising.
Return only valid JSON. No explanation. No markdown.
```

**User prompt:**
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

### Node 4: Parse Classification
- **Type:** Code (JavaScript)
- **Code:**
```javascript
const raw = $input.item.json.text;
return JSON.parse(raw);
```

### Node 5: Log to Sheets
- **Type:** Google Sheets
- **Operation:** Append Row
- **Sheet:** Change Request Log
- **Values:**
  - Timestamp: `{{ new Date().toISOString() }}`
  - Client Name: `{{ $('Normalize Fields').item.json.clientName }}`
  - Client Email: `{{ $('Normalize Fields').item.json.clientEmail }}`
  - Project: `{{ $('Normalize Fields').item.json.projectName }}`
  - Request: `{{ $('Normalize Fields').item.json.requestDescription }}`
  - Urgency: `{{ $('Normalize Fields').item.json.urgency }}`
  - Type: `{{ $('Parse Classification').item.json.requestType }}`
  - Estimated Hours: `{{ $('Parse Classification').item.json.estimatedHours }}`
  - Status: `New`

### Node 6: Send Client Acknowledgment
- **Type:** Gmail
- **Operation:** Send
- **To:** `{{ $('Normalize Fields').item.json.clientEmail }}`
- **Subject:** `{{ $('Parse Classification').item.json.emailSubject }}`
- **Message:** `{{ $('Parse Classification').item.json.emailBody }}`
- **Email type:** HTML

### Node 7: Slack Alert to PM
- **Type:** Slack
- **Operation:** Post Message
- **Channel:** #project-ops
- **Message:**
```
New change request logged
Client: {{ $('Normalize Fields').item.json.clientName }}
Project: {{ $('Normalize Fields').item.json.projectName }}
Type: {{ $('Parse Classification').item.json.requestType }}
Estimated: {{ $('Parse Classification').item.json.estimatedHours }}h
Urgency: {{ $('Normalize Fields').item.json.urgency }}
Client has been acknowledged automatically.
```

## Data Flow Summary

```
Tally Trigger
  → Normalize Fields
  → Classify and Estimate (Claude)
  → Parse Classification
  → Log to Sheets (Google Sheets)
  → Send Client Acknowledgment (Gmail)
  → Slack Alert to PM
```

## Demo Script Summary

**Live demo flow (2.5 min):**
1. Show Tally form - fill as a client submitting a request ("The contact form on our website is broken, leads are not coming through, this is urgent")
2. Submit → switch to n8n Executions panel → narrate Claude classifying the request
3. Show Google Sheets - new row logged with type "Bug Fix" and estimated hours
4. Show Gmail - professional acknowledgment sent to client referencing their specific issue
5. Show Slack - PM alert with full summary
6. CTA: "Every request acknowledged in 30 seconds. Nothing falls through."

## Portfolio Page

- **Slug:** `demo-8`
- **Title:** Change Request Intake Automation
- **Tagline:** "Change request in. Task created. Client replied. 30 seconds."
- **Pain:** "Client change requests arrive by email, WhatsApp, and Slack at all hours. Triaging each one - reading, classifying, responding, and creating a task - takes 20 minutes. For an agency with 5 active clients, that is 2+ hours of admin every week."
- **Stack:** `n8n` `Tally` `Claude` `Google Sheets` `Gmail` `Slack`
- **Steps:**
  1. **Client submits request** - simple form with their name, project, and what they need
  2. **Claude reads and classifies** - Bug Fix, New Feature, Design Change, or Content Update with effort estimate
  3. **Task logged to Sheets** - full row added to the change request tracker automatically
  4. **Client acknowledged** - professional email referencing their specific request, sent in seconds
  5. **PM alerted on Slack** - full summary with type, hours, and urgency lands in #project-ops

## What Mark Provides Before Recording

1. Tally form published and webhook connected to n8n
2. Google Sheet (Change Request Log) with correct columns set up
3. Google Sheets connected in n8n
4. Gmail connected in n8n
5. Slack connected in n8n with #project-ops channel
6. n8n workflow Active
7. Google Sheet open to show new row after submission
8. Gmail inbox open (client perspective) to show acknowledgment
9. Slack #project-ops open to show PM alert
10. n8n Executions panel open
