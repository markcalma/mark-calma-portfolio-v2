import { supabase } from '@/lib/supabase';
import { CampaignContent } from '@/components/campaigns/CampaignContent';
import { Campaign } from '@/types/campaigns';
import { ActivityEntry } from '@/types/recruitment';

function mapCampaign(r: Record<string, unknown>): Campaign {
  return {
    id: r.id as string,
    name: r.name as string,
    clientName: r.client_name as string,
    platform: r.platform as Campaign['platform'],
    status: r.status as Campaign['status'],
    budget: r.budget as number,
    spend: r.spend as number,
    impressions: r.impressions as number,
    clicks: r.clicks as number,
    conversions: r.conversions as number,
    roas: Number(r.roas),
    lastReportAt: r.last_report_at as string | null,
    aiSummary: r.ai_summary as string | null,
    aiRecommendations: r.ai_recommendations as string[] | null,
    reportGenerated: r.report_generated as boolean,
    createdAt: r.created_at as string,
  };
}

export default async function CampaignsPage() {
  const [{ data: campaignsRaw }, { data: activityRaw }] = await Promise.all([
    supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
    supabase
      .from('activity_feed')
      .select('id, message, timestamp')
      .not('campaign_id', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(10),
  ]);

  const campaigns = (campaignsRaw || []).map(mapCampaign);
  const activity: ActivityEntry[] = (activityRaw || []).map(a => ({
    id: a.id as string,
    message: a.message as string,
    timestamp: a.timestamp as string,
  }));

  return (
    <div className="flex flex-1 flex-col bg-muted/30" style={{ gap: 32, padding: 48 }}>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Campaign Operations</h1>
        <p className="text-sm text-muted-foreground" style={{ marginTop: 8 }}>
          Peak Media Agency — AI-powered campaign analysis
        </p>
      </div>
      <CampaignContent initialCampaigns={campaigns} initialActivity={activity} />
    </div>
  );
}
