import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { triggerWebhook } from '@/lib/n8n';
import { supabase } from '@/lib/supabase';

async function updateCampaignInSupabase(campaignId: string) {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name, client_name, spend, roas, conversions, clicks, impressions, platform')
    .eq('id', campaignId)
    .single();

  if (!campaign) return;

  const ctr =
    campaign.clicks > 0 && campaign.impressions > 0
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
      : '0';

  const isStrong = (campaign.roas as number) >= 3;

  const summary = `${campaign.name} (${campaign.platform}) delivered a ${campaign.roas}x ROAS on $${(campaign.spend as number).toLocaleString()} spend for ${campaign.client_name}. The campaign generated ${campaign.conversions} conversions with a ${ctr}% CTR across ${(campaign.impressions as number).toLocaleString()} impressions. Performance is ${isStrong ? 'above' : 'below'} the 3x ROAS benchmark.`;

  const recommendations: string[] = isStrong
    ? [
        `Increase monthly budget by 20% to scale the current ${campaign.roas}x ROAS while performance holds.`,
        `A/B test 2 new ad creatives to find a variant that improves CTR beyond ${ctr}%.`,
      ]
    : [
        `Pause the lowest-performing ad sets and reallocate budget to the top 20% of creatives.`,
        `Review audience targeting — a ${ctr}% CTR suggests the offer may not be resonating with the current segment.`,
      ];

  await supabase
    .from('campaigns')
    .update({
      status: 'reported',
      report_generated: true,
      last_report_at: new Date().toISOString(),
      ai_summary: summary,
      ai_recommendations: recommendations,
    })
    .eq('id', campaignId);

  await supabase.from('activity_feed').insert({
    id: `act-${Date.now()}`,
    campaign_id: campaignId,
    message: `AI analyzed ${campaign.name} for ${campaign.client_name} — ${campaign.roas}x ROAS, ${recommendations.length} recommendations generated`,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json();
  if (!campaignId) return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });

  const n8nUrl = process.env.N8N_BASE_URL ?? '';
  const hasRealN8n = n8nUrl.length > 0 && !n8nUrl.includes('your-n8n');

  if (hasRealN8n) {
    try {
      const result = await triggerWebhook('campaigns/report', { campaignId });
      return NextResponse.json({ ok: true, result });
    } catch {
      // fall through to demo mode
    }
  }

  await new Promise(r => setTimeout(r, 2500));
  setTimeout(() => { void updateCampaignInSupabase(campaignId); }, 2000);

  return NextResponse.json({ ok: true, demo: true });
}
