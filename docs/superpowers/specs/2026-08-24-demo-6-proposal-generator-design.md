# Demo 6 — Proposal Generator Design Spec

## Goal

Build a form-triggered n8n workflow where an agency fills in a prospect's details after a discovery call, and Claude writes a full custom proposal that gets emailed directly to the prospect in under 90 seconds.

## Target Pain

Agencies lose deals because proposals take 2-3 days to send. Writing a custom proposal takes 2-3 hours of copy-paste, formatting, and revisions. This workflow turns a discovery call into a sent proposal in 90 seconds.

- **Tagline:** "Custom agency proposal. 6 inputs. 90 seconds."
- **Pain:** "Agencies lose deals because proposals take 2-3 days to send. Writing a custom proposal means 2-3 hours of copy-paste, rewording, and formatting - every single time. The agency that responds first almost always wins."

## Stack

`n8n` `Tally` `Claude` `Gmail`

## Architecture

Simple 6-node pipeline. Agency fills Tally form after a discovery call. Claude writes a full proposal email (executive summary, problem statement, proposed solution, deliverables, timeline, investment). Gmail sends it directly to the prospect.

## Tally Form

**Form name:** Proposal Generator

| Field | Type | Required |
|---|---|---|
| Prospect name | Short text | Yes |
| Prospect email | Email | Yes |
| Company name | Short text | Yes |
| Main challenge (what they told you on the call) | Long text | Yes |
| Service you are proposing | Short text (e.g. "lead follow-up automation") | Yes |
| Investment range | Short text (e.g. "$2,000-$5,000/month") | Yes |

No em-dashes in any field labels or descriptions.

## n8n Workflow

### Node 1: Tally Trigger
- **Type:** Tally Trigger
- **Config:** Webhook
- **Output:** Raw Tally payload

### Node 2: Normalize Fields
- **Type:** Code (JavaScript)
- **Purpose:** Extract 6 fields from Tally payload by label
- **Code:**
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
- **Output:** Flat object with 6 fields

### Node 3: Write Proposal
- **Type:** Basic LLM Chain
- **Model:** anthropic/claude-sonnet-4-6 via OpenRouter
- **Purpose:** Write a full custom proposal

**System prompt:**
```
You are a senior agency consultant writing custom proposals for automation services.
Write a professional, persuasive proposal email that reads as if personally written - not templated.
Reference the prospect's specific challenge directly. Use plain English. No jargon.
Structure: opening hook, problem restatement, proposed solution, what they get (3-4 bullet deliverables), timeline, investment, clear next step.
Return only valid JSON. No explanation. No markdown.
```

**User prompt:**
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

### Node 4: Parse Proposal
- **Type:** Code (JavaScript)
- **Code:**
```javascript
const raw = $input.item.json.text;
const proposal = JSON.parse(raw);
return proposal;
```
- **Output:** `{ subject: "...", body: "..." }`

### Node 5: Build Email Body
- **Type:** Code (JavaScript)
- **Purpose:** Wrap proposal body in styled HTML container
- **Code:**
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

### Node 6: Send Email
- **Type:** Gmail
- **Operation:** Send
- **To:** `{{ $json.emailTo }}`
- **Subject:** `{{ $json.emailSubject }}`
- **Message:** `{{ $json.emailBody }}`
- **Email type:** HTML

## Data Flow Summary

```
Tally Trigger
  → Normalize Fields
  → Write Proposal (Claude)
  → Parse Proposal
  → Build Email Body
  → Send Email (Gmail to prospect)
```

## Demo Script Summary

**Live demo flow (2.5 min):**
1. Show Tally form - fill 6 fields live (use a realistic prospect: "Alex Chen", "Apex Digital Agency", challenge about manual reporting)
2. Submit → switch to n8n Executions panel → narrate Claude writing the proposal
3. Open Gmail (prospect inbox) → show full proposal email with their specific challenge referenced
4. CTA: "The agency that responds first almost always wins. This responds in 90 seconds."

## Portfolio Page

- **Slug:** `demo-6`
- **Title:** Proposal Generator
- **Tagline:** "Custom agency proposal. 6 inputs. 90 seconds."
- **Pain:** "Agencies lose deals because proposals take 2-3 days to send. Writing a custom proposal means 2-3 hours of copy-paste and formatting - every single time. The agency that responds first almost always wins."
- **Stack:** `n8n` `Tally` `Claude` `Gmail`
- **Steps:**
  1. **Form submitted** - agency fills in prospect details after the discovery call
  2. **Claude reads the challenge** - understands what the prospect said and what service fits
  3. **Full proposal written** - executive summary, solution, deliverables, timeline, and investment
  4. **Email sent to prospect** - lands in their inbox in 90 seconds, not 3 days

## What Mark Provides Before Recording

1. Tally form published and webhook connected to n8n
2. Gmail connected in n8n
3. n8n workflow Active
4. A realistic prospect scenario prepared (name, company, challenge, service, investment)
5. Prospect email inbox open to show the received proposal
6. n8n Executions panel open in another tab
