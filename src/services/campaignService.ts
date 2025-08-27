import { apiGet, apiPost, apiDelete } from '../lib/apiClient.js';
import { Campaign, MessageInsert, CampaignWithDetails, CampaignWithMetrics } from '../types/index.js';

export const fetchCampaigns = async (): Promise<CampaignWithMetrics[]> => {
    // TODO: The backend needs to be updated to calculate and return metrics with this call.
    const campaigns = await apiGet<Campaign[]>('/campaigns');
    return campaigns.map(c => ({
        ...c,
        recipient_count: c.recipient_count || 0,
        metrics: { sent: 0, delivered: 0, read: 0, failed: 0 } // Placeholder metrics
    }));
};

export const fetchCampaignDetailsFromDb = async (campaignId: string): Promise<CampaignWithDetails> => {
    return await apiGet<CampaignWithDetails>(`/campaigns/${campaignId}`);
};

export const addCampaignToDb = async (
    campaign: Omit<Campaign, 'id' | 'team_id' | 'created_at' | 'recipient_count'>, 
    messages: Omit<MessageInsert, 'campaign_id' | 'team_id'>[]
): Promise<Campaign> => {
    const payload = { ...campaign, messages };
    return await apiPost<Campaign>('/campaigns', payload);
};

export const deleteCampaignFromDb = async (campaignId: string): Promise<void> => {
    await apiDelete(`/campaigns/${campaignId}`);
};