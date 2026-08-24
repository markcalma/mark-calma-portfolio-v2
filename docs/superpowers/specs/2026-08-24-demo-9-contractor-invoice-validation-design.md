# Demo 9 — Contractor Invoice Validation Design Spec

## Goal

Build a form-triggered n8n workflow where a contractor submits their invoice via Tally, n8n validates the hours and rate against a Google Sheets rate sheet, and automatically approves or flags the invoice - with confirmation to the contractor and a Slack alert to the finance lead.

## Target Pain

Agency finance teams manually validate every contractor invoice against rate sheets and project trackers. For 10 contractors billing monthly, that is hours of reconciliation and back-and-forth emails every month.

- **Tagline:** "Contractor invoice validated and logged. 60 seconds."
- **Pain:** "Agency finance teams manually validate every contractor invoice - checking hours against timesheets, rates against contracts, and totals against calculations. For 10 contractors billing monthly, that is hours of reconciliation and back-and-forth every single month."

## Stack

`n8n` `Tally` `Google Sheets` `Gmail` `Slack`

## Architecture

Contractor submits Tally form with invoice details. n8n reads their agreed rate from a Google Sheets rate sheet by contractor name. A Code node validates: (1) does hours x rate = total? (2) does submitted rate match agreed rate? If both pass, invoice is approved automatically and logged. If either fails, invoice is flagged with specific reason. Gmail sends result to contractor. Slack alerts finance lead.

## Tally Form

**Form name:** Submit Invoice

| Field | Type | Required |
|---|---|---|
| Your name | Short text | Yes |
| Your email | Email | Yes |
| Project name | Short text | Yes |
| Hours worked | Number | Yes |
| Hourly rate (USD) | Number | Yes |
| Total amount (USD) | Number | Yes |
| Invoice period | Short text (e.g. "August 1-15, 2026") | Yes |

No em-dashes in any field labels or descriptions.

## Google Sheet Structure

**Sheet: Rate Sheet**

| Column | Description |
|---|---|
| Contractor Name | Must match form name exactly (case-insensitive) |
| Agreed Rate (USD/hr) | Numeric rate from contract |
| Active | Yes / No |

**Sheet: Invoice Log**

| Column | Description |
|---|---|
| Timestamp | Auto-filled |
| Contractor Name | From form |
| Contractor Email | From form |
| Project | From form |
| Hours | From form |
| Rate Submitted | From form |
| Rate Agreed | From rate sheet |
| Total Submitted | From form |
| Total Calculated | hours x agreed rate |
| Status | Approved / Flagged |
| Flag Reason | Empty if approved |
| Invoice Period | From form |

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
  contractorName: get('Your name'),
  contractorEmail: get('Your email'),
  projectName: get('Project name'),
  hoursWorked: parseFloat(get('Hours worked')) || 0,
  rateSubmitted: parseFloat(get('Hourly rate (USD)')) || 0,
  totalSubmitted: parseFloat(get('Total amount (USD)')) || 0,
  invoicePeriod: get('Invoice period')
};
```

### Node 3: Look Up Agreed Rate
- **Type:** Google Sheets
- **Operation:** Get Many Rows
- **Sheet:** Rate Sheet
- **Filter:** Active = Yes
- **Purpose:** Get all active contractor rates to match against

### Node 4: Validate Invoice
- **Type:** Code (JavaScript)
- **Purpose:** Match contractor, compare rate, verify calculation
- **Code:**
```javascript
const invoice = $('Normalize Fields').item.json;
const rateRows = $('Look Up Agreed Rate').all().map(i => i.json);

// Find contractor row (case-insensitive match)
const contractorRow = rateRows.find(
  r => r['Contractor Name']?.toLowerCase() === invoice.contractorName.toLowerCase()
);

if (!contractorRow) {
  return {
    ...invoice,
    agreedRate: null,
    totalCalculated: null,
    status: 'Flagged',
    flagReason: `Contractor "${invoice.contractorName}" not found in rate sheet. Please verify the name matches exactly.`
  };
}

const agreedRate = parseFloat(contractorRow['Agreed Rate (USD/hr)']) || 0;
const totalCalculated = Math.round(invoice.hoursWorked * agreedRate * 100) / 100;
const rateMatches = Math.abs(invoice.rateSubmitted - agreedRate) < 0.01;
const totalMatches = Math.abs(invoice.totalSubmitted - totalCalculated) < 0.01;

let status = 'Approved';
let flagReason = '';

if (!rateMatches && !totalMatches) {
  status = 'Flagged';
  flagReason = `Rate mismatch: submitted $${invoice.rateSubmitted}/hr vs agreed $${agreedRate}/hr. Total mismatch: submitted $${invoice.totalSubmitted} vs calculated $${totalCalculated}.`;
} else if (!rateMatches) {
  status = 'Flagged';
  flagReason = `Rate mismatch: submitted $${invoice.rateSubmitted}/hr vs agreed $${agreedRate}/hr. Expected total: $${totalCalculated}.`;
} else if (!totalMatches) {
  status = 'Flagged';
  flagReason = `Total mismatch: submitted $${invoice.totalSubmitted} but ${invoice.hoursWorked}h x $${agreedRate}/hr = $${totalCalculated}.`;
}

return {
  ...invoice,
  agreedRate,
  totalCalculated,
  status,
  flagReason
};
```

### Node 5: Log to Invoice Sheet
- **Type:** Google Sheets
- **Operation:** Append Row
- **Sheet:** Invoice Log
- **Values:**
  - Timestamp: `{{ new Date().toISOString() }}`
  - Contractor Name: `{{ $json.contractorName }}`
  - Contractor Email: `{{ $json.contractorEmail }}`
  - Project: `{{ $json.projectName }}`
  - Hours: `{{ $json.hoursWorked }}`
  - Rate Submitted: `{{ $json.rateSubmitted }}`
  - Rate Agreed: `{{ $json.agreedRate }}`
  - Total Submitted: `{{ $json.totalSubmitted }}`
  - Total Calculated: `{{ $json.totalCalculated }}`
  - Status: `{{ $json.status }}`
  - Flag Reason: `{{ $json.flagReason }}`
  - Invoice Period: `{{ $json.invoicePeriod }}`

### Node 6: Build Contractor Email
- **Type:** Code (JavaScript)
- **Code:**
```javascript
const data = $input.item.json;
const isApproved = data.status === 'Approved';

const subject = isApproved
  ? `Invoice Approved: ${data.projectName} - ${data.invoicePeriod}`
  : `Invoice Flagged: ${data.projectName} - ${data.invoicePeriod}`;

const body = isApproved
  ? `
<div style="font-family: Arial, sans-serif; max-width: 600px; color: #111;">
  <h2 style="color: #16a34a;">Invoice Approved</h2>
  <p>Hi ${data.contractorName},</p>
  <p>Your invoice for <strong>${data.projectName}</strong> (${data.invoicePeriod}) has been approved and logged for payment.</p>
  <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
    <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Hours</strong></td><td style="padding: 8px; border: 1px solid #eee;">${data.hoursWorked}h</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Rate</strong></td><td style="padding: 8px; border: 1px solid #eee;">$${data.agreedRate}/hr</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #eee;"><strong>$${data.totalSubmitted}</strong></td></tr>
  </table>
  <p style="color: #555;">Payment will be processed on the next billing cycle.</p>
</div>
`
  : `
<div style="font-family: Arial, sans-serif; max-width: 600px; color: #111;">
  <h2 style="color: #dc2626;">Invoice Flagged for Review</h2>
  <p>Hi ${data.contractorName},</p>
  <p>Your invoice for <strong>${data.projectName}</strong> (${data.invoicePeriod}) has been flagged and requires correction before it can be approved.</p>
  <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <strong>Issue:</strong> ${data.flagReason}
  </div>
  <p>Please resubmit with the corrected details. Reply to this email if you have questions.</p>
</div>
`;

return {
  emailTo: data.contractorEmail,
  emailSubject: subject,
  emailBody: body,
  status: data.status,
  contractorName: data.contractorName,
  projectName: data.projectName,
  flagReason: data.flagReason
};
```

### Node 7: Send Contractor Email
- **Type:** Gmail
- **Operation:** Send
- **To:** `{{ $json.emailTo }}`
- **Subject:** `{{ $json.emailSubject }}`
- **Message:** `{{ $json.emailBody }}`
- **Email type:** HTML

### Node 8: Slack Alert to Finance Lead
- **Type:** Slack
- **Operation:** Post Message
- **Channel:** #finance
- **Message:**
```
Invoice {{ $json.status }}: {{ $json.contractorName }} - {{ $json.projectName }}
{{ $json.status === 'Approved' ? 'Approved and logged for payment.' : 'Flagged: ' + $json.flagReason }}
```

## Data Flow Summary

```
Tally Trigger
  → Normalize Fields
  → Look Up Agreed Rate (Google Sheets)
  → Validate Invoice (Code - rate + total check)
  → Log to Invoice Sheet (Google Sheets)
  → Build Contractor Email (Code)
  → Send Contractor Email (Gmail)
  → Slack Alert to Finance Lead
```

## Demo Script Summary

**Live demo flow (2.5 min):**

**First pass (approval):**
1. Show Tally form - submit a valid invoice (hours x rate = total, rate matches sheet)
2. Show n8n Executions - watch validation pass
3. Show Gmail (contractor inbox) - "Invoice Approved" with breakdown table
4. Show Google Sheets Invoice Log - row added with Approved status
5. Show Slack #finance - approved alert

**Second pass (flag):**
1. Submit same form with wrong total (e.g. submit $600 when 5h x $100 = $500)
2. Show "Invoice Flagged" email with specific discrepancy called out
3. CTA: "Every invoice validated automatically. No spreadsheet gymnastics."

## Portfolio Page

- **Slug:** `demo-9`
- **Title:** Contractor Invoice Validation
- **Tagline:** "Contractor invoice validated and logged. 60 seconds."
- **Pain:** "Agency finance teams manually validate every contractor invoice - checking hours against timesheets, rates against contracts, and totals against calculations. For 10 contractors billing monthly, that is hours of reconciliation every month."
- **Stack:** `n8n` `Tally` `Google Sheets` `Gmail` `Slack`
- **Steps:**
  1. **Contractor submits invoice** - name, project, hours, rate, and total via simple form
  2. **Rate sheet checked** - agreed rate pulled from Google Sheets by contractor name
  3. **Validation runs** - hours x agreed rate compared against submitted total
  4. **Approved or flagged instantly** - contractor emailed with result and specific reason if flagged
  5. **Invoice logged to Sheets** - full record with status added to invoice tracker
  6. **Finance lead alerted on Slack** - immediate notification with outcome

## What Mark Provides Before Recording

1. Tally form published and webhook connected to n8n
2. Google Sheet (Rate Sheet) with at least 2-3 contractor rows
3. Google Sheet (Invoice Log) with correct columns
4. Google Sheets connected in n8n
5. Gmail connected in n8n
6. Slack connected in n8n with #finance channel
7. n8n workflow Active
8. Prepare two demo submissions: one valid, one with wrong total
9. Gmail inbox (contractor perspective) open
10. Slack #finance open
11. n8n Executions panel open
