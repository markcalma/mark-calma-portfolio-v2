# Demo 3 Loom Script — Lead Follow-Up Automation
**Target:** 2 min 30 sec | **Hard cap:** 3 min 00 sec

## Pre-recording checklist
- [ ] Workflow 1 (Lead Intake) is Active in n8n
- [ ] Workflow 2 (Follow-Up Scheduler) is Active in n8n
- [ ] Leads tab in Google Sheets is empty (headers only)
- [ ] Tally form is published and webhook is connected
- [ ] Gmail inbox open
- [ ] n8n Executions panel open in another tab
- [ ] Slack #leads channel open

---

## [0:00 – 0:10] The Pain

"Most agencies I talk to reply to maybe half their inbound leads. Not because they don't care — because the team is already slammed with active clients.

40 leads a month. 20 of them never hear back. That's revenue walking out the door every week.

I built an automation that makes sure 100% of leads get a reply in under 60 seconds — no manual work."

---

## [0:10 – 0:30] Fill the Tally Form

Switch to the Tally form in browser.

"Here's what a lead sees. Standard contact form."

Fill it out live:
- Name: Alex Chen
- Email: your email
- Company: Apex Digital Agency
- Bottleneck: "We get around 40 leads a month but honestly maybe half never hear back from us. The team is just slammed with current clients."
- Revenue: $10K–$50K/month

Hit Submit.

---

## [0:30 – 1:00] Watch Workflow 1 Fire

Switch to n8n Executions panel.

"Watch it go. Workflow 1 is running right now."

Walk through each node as it lights up:

"It's reading the form data... Claude is scoring Alex's lead and writing a personalized reply... parsing the output... sending the email... logging to Sheets."

---

## [1:00 – 1:20] Show Gmail Reply

Switch to Gmail.

"Already there. Under 60 seconds."

Open the email. Read one line from the body — the part that references Alex's specific pain about leads going ignored.

"It's not a template. Claude read what Alex wrote and responded to it directly."

---

## [1:20 – 1:35] Show Google Sheets

Switch to Google Sheets Leads tab.

"Lead is logged. Score, Claude's reasoning, reply tone — all here. And look at these two columns — Day3Date and Day7Date. Already calculated from the moment the form was submitted."

---

## [1:35 – 2:00] Show Workflow 2 and Explain the Sequence

Switch to n8n, open Workflow 2.

"This is the Follow-Up Scheduler. It runs every morning at 9AM automatically."

Point to the Loop Over Leads section:

"It checks every lead in the sheet. If Day 3 is due today, this email goes out."

Point to the Day 3 Gmail node. Show the subject field:

`={{ "Following up, " + $json.Name }}`

"Personalized. Uses Alex's name from the row."

"If Day 7 is due, the final email fires and I get a Slack alert so I know to reach out personally if the score was high."

Switch to Slack #leads briefly:

"That alert lands here."

---

## [2:00 – 2:15] The Numbers + CTA

"60% of leads ignored — that's what I hear from agencies consistently.

This gets every lead touched in under 60 seconds, automatically, with a sequence that runs for a week without anyone lifting a finger.

If your agency is leaving leads on the table, link's below."

---

## Post-recording checklist
- [ ] Upload to Loom as Unlisted
- [ ] Copy Loom URL
- [ ] Paste in Build Library sheet — column E, row 4
- [ ] Replace [LOOM_URL] in docs/outreach/demo-3-templates.md
- [ ] Replace [LOOM_URL] in docs/content/demo-3-linkedin-posts.md
