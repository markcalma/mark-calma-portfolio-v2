import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Campaign } from '@/types/campaigns';

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

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabase.from('campaigns').select('*').eq('id', id).single();
  if (!data) notFound();

  const campaign = mapCampaign(data as Record<string, unknown>);
  const ctr =
    campaign.clicks > 0 && campaign.impressions > 0
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
      : '0';

  return (
    <div className="flex flex-1 flex-col bg-muted/30" style={{ gap: 32, padding: 48 }}>
      <Link
        href="/campaigns"
        className="text-xs text-muted-foreground no-underline hover:text-foreground"
        style={{ alignSelf: 'flex-start' }}
      >
        ← Campaign Pipeline
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-foreground">{campaign.name}</h1>
        <p className="text-sm text-muted-foreground" style={{ marginTop: 8 }}>
          {campaign.clientName} · {campaign.platform}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 24 }}>
        {[
          { label: 'Ad Spend',    value: `$${campaign.spend.toLocaleString()}` },
          { label: 'ROAS',        value: `${campaign.roas}x`                   },
          { label: 'Conversions', value: campaign.conversions                   },
          { label: 'CTR',         value: `${ctr}%`                             },
        ].map(m => (
          <div key={m.label} className="rounded-xl bg-card shadow-sm" style={{ padding: 32 }}>
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{m.label}</p>
            <p className="text-3xl font-semibold text-foreground" style={{ marginTop: 12 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {campaign.reportGenerated && campaign.aiSummary ? (
        <div className="rounded-xl bg-card shadow-sm" style={{ padding: 40 }}>
          <p
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            style={{ marginBottom: 20 }}
          >
            AI Analysis
          </p>
          <p className="text-sm text-foreground leading-relaxed" style={{ marginBottom: 32 }}>
            {campaign.aiSummary}
          </p>
          {campaign.aiRecommendations && campaign.aiRecommendations.length > 0 && (
            <>
              <p
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                style={{ marginBottom: 16 }}
              >
                Recommendations
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {campaign.aiRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: '#4f46e5', minWidth: 20, paddingTop: 2 }}
                    >
                      {i + 1}.
                    </span>
                    <p className="text-sm text-foreground">{rec}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <div
          className="rounded-xl bg-card shadow-sm flex items-center justify-center"
          style={{ padding: 60 }}
        >
          <p className="text-sm text-muted-foreground">
            No report generated yet. Run AI Report from the campaign pipeline.
          </p>
        </div>
      )}
    </div>
  );
}
