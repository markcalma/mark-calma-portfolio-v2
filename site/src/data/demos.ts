export interface DemoStep {
  label: string;
  description: string;
}

export interface Demo {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  pain: string;
  videoId: string;
  stack: string[];
  steps: DemoStep[];
}

export const demos: Demo[] = [
  {
    slug: 'demo-1',
    number: 1,
    title: 'Client Onboarding Automation',
    tagline: '12 manual steps. Automated in 30 seconds.',
    pain: 'Most agencies spend 2-3 hours onboarding every new client - manually. Drive folder, Slack channel, Notion workspace, welcome email. 12 steps. Every single client.',
    videoId: '',
    stack: ['n8n', 'Claude', 'Google Drive', 'Slack', 'Notion', 'Gmail'],
    steps: [
      { label: 'Webhook fires', description: 'Client signs and the trigger fires instantly - no manual action needed.' },
      { label: 'Google Drive folder created', description: 'Named and organized automatically under the Clients folder.' },
      { label: 'Slack channel opened', description: 'Channel created and the whole team invited in seconds.' },
      { label: 'Notion workspace set up', description: 'Client added to the database with status Active.' },
      { label: 'Welcome email sent', description: "Claude writes a personalized email based on the client's industry and contract value - not a template." },
    ],
  },
  {
    slug: 'demo-2',
    number: 2,
    title: 'Automated Client Reporting',
    tagline: '8 hours of Friday reporting. Done in 60 seconds.',
    pain: "Every Friday, agencies pull numbers manually and write summary emails for each client. For a 5-client agency, that's 8 hours gone before a single billable thing happens.",
    videoId: '',
    stack: ['n8n', 'Claude', 'Google Analytics', 'Gmail'],
    steps: [
      { label: 'Scheduled trigger fires', description: 'Every Friday, automatically - no manual action needed.' },
      { label: 'Metrics pulled per client', description: 'Google Analytics data fetched for each client account.' },
      { label: 'Claude writes the insight', description: 'A human-sounding paragraph per client - not a data dump.' },
      { label: 'Live report page generated', description: 'A unique URL per client, always up to date and ready to share.' },
      { label: 'Email sent to each client', description: 'One-click link to their report page, arrives automatically.' },
    ],
  },
  {
    slug: 'demo-3',
    number: 3,
    title: 'Lead Follow-Up Automation',
    tagline: '100% of leads replied to in under 60 seconds.',
    pain: "Most agencies reply to maybe half their inbound leads - not because they don't care, but because the team is already slammed. 40 leads a month. 20 never hear back.",
    videoId: '',
    stack: ['n8n', 'Claude', 'Tally', 'Google Sheets', 'Gmail', 'Slack'],
    steps: [
      { label: 'Lead submits form', description: 'Standard contact form on Tally - no change for the prospect.' },
      { label: 'Claude scores and replies', description: 'Reads their message, scores the lead, writes a personalized response.' },
      { label: 'Email sent in under 60 seconds', description: 'References what the lead actually wrote - not a template.' },
      { label: 'Lead logged to Sheets', description: 'Score, reasoning, and calculated Day 3 and Day 7 follow-up dates recorded.' },
      { label: 'Follow-up sequence fires automatically', description: 'Day 3 and Day 7 emails go out on schedule. Slack alert on Day 7 for high-score leads.' },
    ],
  },
  {
    slug: 'demo-4',
    number: 4,
    title: 'SEO Content Pipeline',
    tagline: '10 hours of content work. 2 minutes. Automated.',
    pain: 'A content agency producing one blog post per client per week spends 10+ hours on it - research, writing, repurposing for LinkedIn, Instagram, email, Twitter. Every week. For every client.',
    videoId: '',
    stack: ['n8n', 'Tally', 'Firecrawl', 'Claude', 'Gemini', 'Gmail'],
    steps: [
      { label: 'SEO manager submits a form', description: 'Keyword, target location, and audience - four fields.' },
      { label: 'Firecrawl scrapes top 3 ranking articles', description: "Reads what's currently winning for that keyword." },
      { label: 'Claude writes a better article', description: '1000-word SEO post with title, meta description, and headings.' },
      { label: 'Claude repurposes into 4 formats', description: 'LinkedIn post, Twitter thread, Instagram caption, and email newsletter - all written automatically.' },
      { label: 'Images generated and package emailed', description: 'Gemini generates a hero and square image. Everything lands in the inbox in 2 minutes.' },
    ],
  },
  {
    slug: 'demo-5',
    number: 5,
    title: 'On-Brand Social Image Generator',
    tagline: '3 on-brand social images. 5 fields. 60 seconds.',
    pain: 'Most agencies producing social content for clients spend 2-3 hours per client per week in Canva - manually sizing, recoloring, and adapting every post. For a 5-client agency, that is a full day of design work every week.',
    videoId: '',
    stack: ['n8n', 'Tally', 'Claude', 'Gemini', 'OpenRouter', 'Gmail'],
    steps: [
      { label: 'Form submitted', description: 'Agency inputs brand name, primary color, style vibe, and content topic.' },
      { label: 'Claude writes image prompts', description: 'Three tailored prompts - one per platform - built around the brand color and style.' },
      { label: 'Instagram Square generated', description: 'Gemini creates a 1:1 on-brand image ready for the feed.' },
      { label: 'Instagram Story generated', description: 'Gemini creates a 9:16 vertical image ready for stories.' },
      { label: 'LinkedIn Banner generated and emailed', description: 'Gemini creates a 16:9 wide image. All three land in one email in under 60 seconds.' },
    ],
  },
  {
    slug: 'demo-6',
    number: 6,
    title: 'Proposal Generator',
    tagline: 'Custom agency proposal. 6 inputs. 90 seconds.',
    pain: 'Agencies lose deals because proposals take 2-3 days to send. Writing a custom proposal means 2-3 hours of copy-paste and formatting - every single time. The agency that responds first almost always wins.',
    videoId: '',
    stack: ['n8n', 'Tally', 'Claude', 'Gmail'],
    steps: [
      { label: 'Form submitted after discovery call', description: 'Agency fills in prospect name, company, challenge, service, and investment range.' },
      { label: 'Claude reads the challenge', description: 'Understands the specific pain the prospect described and what solution fits.' },
      { label: 'Full proposal written', description: 'Executive summary, problem restatement, proposed solution, deliverables, timeline, and investment.' },
      { label: 'Email sent to prospect', description: 'Lands in their inbox in 90 seconds - not 3 days.' },
    ],
  },
  {
    slug: 'demo-7',
    number: 7,
    title: 'Automated Project Status Report',
    tagline: '5 client status updates. Written and sent. Zero PM time.',
    pain: 'Every Friday, agency PMs write the same emails - what we did this week, what is next, any blockers. For a 5-client agency, that is 3+ hours of non-billable writing before the weekend even starts.',
    videoId: '',
    stack: ['n8n', 'Claude', 'Google Sheets', 'Gmail', 'Slack'],
    steps: [
      { label: 'Scheduled trigger fires', description: 'Every Friday at 9AM - no manual action needed.' },
      { label: 'Active projects pulled', description: 'Reads every active client row from Google Sheets.' },
      { label: 'Claude writes each update', description: 'Professional, human-sounding paragraph per client referencing their specific progress and blockers.' },
      { label: 'Email sent to each client', description: 'Personalized, on time, every single week.' },
      { label: 'Slack summary posted', description: 'Team knows all updates went out without checking.' },
    ],
  },
  {
    slug: 'demo-8',
    number: 8,
    title: 'Change Request Intake Automation',
    tagline: 'Change request in. Task created. Client replied. 30 seconds.',
    pain: 'Client change requests arrive by email, WhatsApp, and Slack at all hours. Triaging each one - reading, classifying, responding, and creating a task - takes 20 minutes. For an agency with 5 active clients, that is 2+ hours of admin every week.',
    videoId: '',
    stack: ['n8n', 'Tally', 'Claude', 'Google Sheets', 'Gmail', 'Slack'],
    steps: [
      { label: 'Client submits request', description: 'Simple form with their name, project, description, and urgency level.' },
      { label: 'Claude reads and classifies', description: 'Bug Fix, New Feature, Design Change, or Content Update - with an effort estimate in hours.' },
      { label: 'Task logged to Sheets', description: 'Full row added to the change request tracker with type, hours, and status.' },
      { label: 'Client acknowledged', description: 'Professional email referencing their specific request, sent in seconds.' },
      { label: 'PM alerted on Slack', description: 'Full summary with type, estimated hours, and urgency lands in #project-ops.' },
    ],
  },
  {
    slug: 'demo-9',
    number: 9,
    title: 'Contractor Invoice Validation',
    tagline: 'Contractor invoice validated and logged. 60 seconds.',
    pain: 'Agency finance teams manually validate every contractor invoice - checking hours against timesheets, rates against contracts, and totals against calculations. For 10 contractors billing monthly, that is hours of reconciliation every month.',
    videoId: '',
    stack: ['n8n', 'Tally', 'Google Sheets', 'Gmail', 'Slack'],
    steps: [
      { label: 'Contractor submits invoice', description: 'Name, project, hours, rate, and total via a simple form.' },
      { label: 'Rate sheet checked', description: 'Agreed rate pulled from Google Sheets by contractor name.' },
      { label: 'Validation runs', description: 'Hours times agreed rate compared against submitted total. Both must match.' },
      { label: 'Approved or flagged instantly', description: 'Contractor emailed with result and the specific discrepancy if flagged.' },
      { label: 'Invoice logged and finance alerted', description: 'Full record added to invoice tracker. Slack alert sent to finance lead with outcome.' },
    ],
  },
  {
    slug: 'demo-10',
    number: 10,
    title: 'Deadline Monitor + PM Alert',
    tagline: 'Every deadline monitored. Every at-risk project flagged. Automatically.',
    pain: 'Missed deadlines are the fastest way to lose a client. But PMs juggling 5-10 projects cannot manually check every deadline every morning. Things slip through - not because nobody cares, but because nobody saw it coming.',
    videoId: '',
    stack: ['n8n', 'Claude', 'Google Sheets', 'Gmail', 'Slack'],
    steps: [
      { label: 'Scheduled trigger fires', description: 'Every morning at 8AM - no manual action needed.' },
      { label: 'All active projects scanned', description: 'Reads every row in the project tracker.' },
      { label: 'Deadlines calculated', description: 'Flags overdue projects, due today, and anything due within 3 days.' },
      { label: 'Claude writes the alert', description: 'Prioritized action list - overdue first, then critical, then at risk.' },
      { label: 'Slack alert and PM email sent', description: 'PM sees what needs attention before checking a single spreadsheet.' },
    ],
  },
];

export function getDemoBySlug(slug: string): Demo | undefined {
  return demos.find(d => d.slug === slug);
}
