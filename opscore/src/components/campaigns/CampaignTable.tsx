'use client';

import Link from 'next/link';
import { Campaign, CampaignStatus, CampaignPlatform } from '@/types/campaigns';
import { GenerateReportButton } from './GenerateReportButton';

const STATUS_STYLES: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: '#15803d',                 bg: 'rgba(34,197,94,0.12)'  },
  paused:   { label: 'Paused',   color: 'var(--muted-foreground)', bg: 'var(--muted)'           },
  reported: { label: 'Reported', color: '#4f46e5',                 bg: 'rgba(99,102,241,0.1)'  },
};

const PLATFORM_COLORS: Record<CampaignPlatform, string> = {
  Google:   '#ea4335',
  Meta:     '#1877f2',
  LinkedIn: '#0a66c2',
};

interface CampaignTableProps {
  campaigns: Campaign[];
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/40">
            {['Campaign', 'Client', 'Platform', 'Spend', 'ROAS', 'Conversions', 'Status', 'Action'].map(h => (
              <th
                key={h}
                className="text-left text-xs font-medium text-muted-foreground tracking-wide uppercase"
                style={{ padding: '14px 24px' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.map(campaign => {
            const s = STATUS_STYLES[campaign.status];
            return (
              <tr
                key={campaign.id}
                className="hover:bg-muted/20 transition-colors"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <td className="font-medium text-foreground" style={{ padding: '16px 24px' }}>
                  {campaign.name}
                </td>
                <td className="text-muted-foreground" style={{ padding: '16px 24px' }}>
                  {campaign.clientName}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span className="text-xs font-semibold" style={{ color: PLATFORM_COLORS[campaign.platform] }}>
                    {campaign.platform}
                  </span>
                </td>
                <td className="tabular-nums text-foreground" style={{ padding: '16px 24px' }}>
                  ${campaign.spend.toLocaleString()}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span
                    className="tabular-nums font-semibold text-sm"
                    style={{
                      color: campaign.roas >= 3 ? '#15803d' : campaign.roas >= 2 ? '#b45309' : '#dc2626',
                    }}
                  >
                    {campaign.roas}x
                  </span>
                </td>
                <td className="tabular-nums text-foreground" style={{ padding: '16px 24px' }}>
                  {campaign.conversions}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span
                    className="text-xs font-medium rounded-full"
                    style={{ color: s.color, background: s.bg, padding: '5px 12px', whiteSpace: 'nowrap' }}
                  >
                    {s.label}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {campaign.status === 'reported' ? (
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="text-xs font-medium no-underline"
                      style={{ color: '#4f46e5' }}
                    >
                      View report →
                    </Link>
                  ) : (
                    <GenerateReportButton campaignId={campaign.id} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
