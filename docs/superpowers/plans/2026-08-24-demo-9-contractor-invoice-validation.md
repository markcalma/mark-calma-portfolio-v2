# Demo 9 — Contractor Invoice Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an n8n workflow where a contractor submits an invoice via Tally, n8n validates hours and rate against a Google Sheets rate sheet, emails the contractor with approval or a specific flag reason, logs the result, and alerts the finance lead on Slack.

**Architecture:** 8-node pipeline. Tally → Normalize → Read Rate Sheet → Validate (Code) → Log to Invoice Sheet → Build Email → Send Email → Slack alert.

**Tech Stack:** Tally, n8n, Google Sheets (two sheets), Gmail, Slack

**Spec:** `docs/superpowers/specs/2026-08-24-demo-9-contractor-invoice-validation-design.md`

## Global Constraints

- No em-dashes in any copy
- Sheet 1: `Rate Sheet` — columns: `Contractor Name`, `Agreed Rate (USD/hr)`, `Active`
- Sheet 2: `Invoice Log` — columns: `Timestamp`, `Contractor Name`, `Contractor Email`, `Project`, `Hours`, `Rate Submitted`, `Rate Agreed`, `Total Submitted`, `Total Calculated`, `Status`, `Flag Reason`, `Invoice Period`
- Contractor name match is case-insensitive
- Approved status = `Approved`, flagged = `Flagged` (exact strings)
- Gmail node email type: HTML
- Slack channel: `#finance`

---

### Task 1: Tally Form + Google Sheets Setup + Trigger

**Interfaces:**
- Produces: Tally webhook payload; Rate Sheet with contractor data; empty Invoice Log

- [ ] **Step 1: Create Rate Sheet**

Create a Google Sheet named **"Rate Sheet"** with headers: `Contractor Name` | `Agreed Rate (USD/hr)` | `Active`

Add 3 contractor rows:

| Contractor Name | Agreed Rate (USD/hr) | Active |
|---|---|---|
| Maria Santos | 50 | Yes |
| James Reyes | 75 | Yes |
| Ana Cruz | 60 | Yes |

- [ ] **Step 2: Create Invoice Log sheet**

In the same spreadsheet (add a new tab) or a new Google Sheet named **"Invoice Log"** with headers:

`Timestamp` | `Contractor Name` | `Contractor Email` | `Project` | `Hours` | `Rate Submitted` | `Rate Agreed` | `Total Submitted` | `Total Calculated` | `Status` | `Flag Reason` | `Invoice Period`

Leave empty.

- [ ] **Step 3: Create Tally form**

Create Tally form named **"Submit Invoice"**. Fields:

| Label | Type |
|---|---|
| Your name | Short answer |
| Your email | Email |
| Project name | Short answer |
| Hours worked | Number |
| Hourly rate (USD) | Number |
| Total amount (USD) | Number |
| Invoice period | Short answer |

Add placeholder to Invoice period: `e.g. August 1-15, 2026`

Publish and connect webhook to new n8n workflow.

- [ ] **Step 4: Create workflow + verify trigger**

Create n8n workflow **"Demo 9: Contractor Invoice Validation"**. Add **Tally Trigger**.

Submit valid test data (Maria Santos, 10 hours at $50/hr = $500):
- Your name: `Maria Santos`
- Your email: `28markcalma@gmail.com`
- Project name: `Website Redesign`
- Hours worked: `10`
- Hourly rate (USD): `50`
- Total amount (USD): `500`
- Invoice period: `August 1-15, 2026`

Confirm `data.fields` in trigger output.

---

### Task 2: Normalize Fields

**Interfaces:**
- Consumes: `$input.item.json.data.fields`
- Produces: `{ contractorName, contractorEmail, projectName, hoursWorked, rateSubmitted, totalSubmitted, invoicePeriod }` — consumed by Tasks 3, 4, 5, 6

- [ ] **Step 1: Add Code node**

Add **Code** node after Tally Trigger. Name it `Normalize Fields`.

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

- [ ] **Step 2: Pin and execute**

Expected:
```json
{
  "contractorName": "Maria Santos",
  "contractorEmail": "28markcalma@gmail.com",
  "projectName": "Website Redesign",
  "hoursWorked": 10,
  "rateSubmitted": 50,
  "totalSubmitted": 500,
  "invoicePeriod": "August 1-15, 2026"
}
```

`hoursWorked`, `rateSubmitted`, `totalSubmitted` must be numbers, not strings.

---

### Task 3: Look Up Agreed Rate

**Interfaces:**
- Consumes: Schedule trigger (all rows needed for lookup)
- Produces: Array of rate sheet rows — consumed by Task 4

- [ ] **Step 1: Add Google Sheets node**

Add **Google Sheets** node after Normalize Fields. Name it `Look Up Agreed Rate`.

- Operation: Get Many Rows
- Spreadsheet: Rate Sheet
- Sheet: Sheet1 (or the tab name)
- Filters: `Active` equals `Yes`

- [ ] **Step 2: Execute and verify**

Execute Look Up Agreed Rate. Expected: array of 3 rate rows, each with `Contractor Name` and `Agreed Rate (USD/hr)` columns present.

---

### Task 4: Validate Invoice

**Interfaces:**
- Consumes: `$('Normalize Fields').item.json`, `$('Look Up Agreed Rate').all()`
- Produces: `{ ...invoiceFields, agreedRate, totalCalculated, status, flagReason }` — consumed by Tasks 5, 6, 7

- [ ] **Step 1: Add Code node**

Add **Code** node after Look Up Agreed Rate. Name it `Validate Invoice`.

```javascript
const invoice = $('Normalize Fields').item.json;
const rateRows = $('Look Up Agreed Rate').all().map(i => i.json);

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

- [ ] **Step 2: Execute and verify approval case**

For Maria Santos (10h x $50 = $500, submitted $500): Expected `status: "Approved"`, `flagReason: ""`, `agreedRate: 50`, `totalCalculated: 500`.

---

### Task 5: Log to Invoice Sheet

**Interfaces:**
- Consumes: all fields from `$input.item.json` (Validate Invoice output)
- Produces: new row in Invoice Log sheet

- [ ] **Step 1: Add Google Sheets node**

Add **Google Sheets** node after Validate Invoice. Name it `Log to Invoice Sheet`.

- Operation: Append Row
- Spreadsheet: Invoice Log sheet
- Column mapping:
  - `Timestamp`: `={{ new Date().toISOString() }}`
  - `Contractor Name`: `={{ $json.contractorName }}`
  - `Contractor Email`: `={{ $json.contractorEmail }}`
  - `Project`: `={{ $json.projectName }}`
  - `Hours`: `={{ $json.hoursWorked }}`
  - `Rate Submitted`: `={{ $json.rateSubmitted }}`
  - `Rate Agreed`: `={{ $json.agreedRate }}`
  - `Total Submitted`: `={{ $json.totalSubmitted }}`
  - `Total Calculated`: `={{ $json.totalCalculated }}`
  - `Status`: `={{ $json.status }}`
  - `Flag Reason`: `={{ $json.flagReason }}`
  - `Invoice Period`: `={{ $json.invoicePeriod }}`

- [ ] **Step 2: Execute and verify**

Open Invoice Log sheet. Confirm new row with Approved status and all columns filled.

---

### Task 6: Build Contractor Email + Send

**Interfaces:**
- Consumes: all fields from `$input.item.json`
- Produces: approval or flag email to contractor

- [ ] **Step 1: Add Code node**

Add **Code** node after Log to Invoice Sheet. Name it `Build Contractor Email`.

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

- [ ] **Step 2: Add Gmail node**

Add **Gmail** node after Build Contractor Email. Name it `Send Contractor Email`.

- To: `={{ $json.emailTo }}`
- Subject: `={{ $json.emailSubject }}`
- Message: `={{ $json.emailBody }}`
- Email Type: **HTML**

- [ ] **Step 3: Execute and verify approval email**

Check Gmail. Confirm "Invoice Approved" email arrived with correct hours, rate, and total in the table.

---

### Task 7: Slack Alert + Flag Test + Activate + Screenshot

- [ ] **Step 1: Add Slack node**

Add **Slack** node after Send Contractor Email. Name it `Slack Alert`.

- Channel: `#finance`
- Message:
```
Invoice {{ $json.status }}: {{ $json.contractorName }} - {{ $json.projectName }}
{{ $json.status === 'Approved' ? 'Approved and logged for payment.' : 'Flagged: ' + $json.flagReason }}
```

- [ ] **Step 2: Test flag path**

Submit Tally form again with wrong total:
- Your name: `Maria Santos`
- Hourly rate (USD): `50`
- Hours worked: `10`
- Total amount (USD): `600` (wrong — should be 500)

Run workflow. Verify:
- Gmail: "Invoice Flagged" email with specific discrepancy message
- Invoice Log: new row with `Flagged` status and flag reason
- Slack: flagged alert

- [ ] **Step 3: Activate and screenshot**

Set workflow **Active**. Screenshot canvas with all 8 nodes visible. Save as `site/public/workflows/demo-9.png`.

```bash
git add site/public/workflows/demo-9.png
git commit -m "feat: add Demo 9 workflow screenshot"
git push origin master
```
