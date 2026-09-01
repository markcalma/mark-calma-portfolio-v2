'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CampaignTable } from '@/components/campaigns/CampaignTable';
import { ActivityFeed } from '@/components/layout/ActivityFeed';
import { Campaign } from '@/types/campaigns';
import { ActivityEntry } from '@/types/recruitment';

interface Props {
  initialCampaigns: Campaign[];
  initialActivity: ActivityEntry[];
}

export function CampaignContent({ initialCampaigns, initialActivity }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [activity, setActivity] = useState<ActivityEntry[]>(initialActivity);

  useEffect(() => {
    const channel = supabase
      .channel('campaigns-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'campaigns' },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          const updated: Campaign = {
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
          setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          if (!r.campaign_id) return;
          const entry: ActivityEntry = {
            id: r.id as string,
            message: r.message as string,
            timestamp: r.timestamp as string,
          };
          setActivity(prev => [entry, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const avgRoas = campaigns.length > 0
    ? (campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length).toFixed(1)
    : '0';
  const reportsGenerated = campaigns.filter(c => c.reportGenerated).length;

  const metrics = [
    { label: 'Active Campaigns', value: activeCampaigns.length,            change: 'Running now'          },
    { label: 'Total Ad Spend',   value: `$${totalSpend.toLocaleString()}`,  change: 'This period'          },
    { label: 'Avg ROAS',         value: `${avgRoas}x`,                      change: 'Across all campaigns' },
    { label: 'Reports Generated',value: reportsGenerated,                   change: 'This month'           },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 24 }}>
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-card shadow-sm" style={{ padding: 32 }}>
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{m.label}</p>
            <p className="text-3xl font-semibold text-foreground" style={{ marginTop: 12 }}>{m.value}</p>
            <p className="text-xs text-muted-foreground" style={{ marginTop: 8 }}>{m.change}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
        <div className="rounded-xl bg-card shadow-sm" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div
            className="flex items-center justify-between"
            style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}
          >
            <p className="text-sm font-semibold text-foreground">Campaign Pipeline</p>
            <p className="text-xs text-muted-foreground">{campaigns.length} campaigns</p>
          </div>
          <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
            <CampaignTable campaigns={campaigns} />
          </div>
        </div>

        <div className="rounded-xl bg-card shadow-sm overflow-hidden" style={{ width: 280, flexShrink: 0 }}>
          <ActivityFeed entries={activity} />
        </div>
      </div>
    </>
  );
}
