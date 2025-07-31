import { Request, Response } from 'express';
import { executeCampaignMessage } from '../_lib/campaigns/messageProcessor.js';

export async function processCampaignMessageHandler(req: Request, res: Response) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messageId, userId, variables } = req.body;
        if (!messageId || !userId || !variables) {
            return res.status(400).json({ error: 'Missing required parameters in body.' });
        }

        const result = await executeCampaignMessage({ messageId, userId, variables });
        res.status(200).json(result);

    } catch (err: any) {
        console.error(`API Error processing message ${req.body?.messageId}:`, err);
        res.status(500).json({ error: 'Failed to process campaign message.', details: err.message });
    }
}