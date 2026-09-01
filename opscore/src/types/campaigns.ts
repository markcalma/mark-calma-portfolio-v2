export type CampaignStatus = 'active' | 'paused' | 'reported';
export type CampaignPlatform = 'Google' | 'Meta' | 'LinkedIn';

export interface Campaign {
  id: string;
  name: string;
  clientName: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  lastReportAt: string | null;
  aiSummary: string | null;
  aiRecommendations: string[] | null;
  reportGenerated: boolean;
  createdAt: string;
}
