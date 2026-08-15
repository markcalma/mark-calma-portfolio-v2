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
    title: 'Client Onboarding',
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
];

export function getDemoBySlug(slug: string): Demo | undefined {
  return demos.find(d => d.slug === slug);
}
