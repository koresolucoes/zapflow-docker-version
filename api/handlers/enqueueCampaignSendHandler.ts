import { Request, Response } from 'express';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { TablesInsert } from '../_lib/database.types.js';
import { campaignQueue } from '../_lib/queue/campaignQueue.js';

export async function enqueueCampaignSendHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header is missing or malformed.' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      campaignName,
      templateId,
      variables,
      recipients,
      speed,
      teamId,
      scheduleDate
    } = req.body;

    if (!campaignName || !templateId || !recipients || !speed || !teamId) {
      return res.status(400).json({ error: 'Missing required campaign parameters.' });
    }

    // 1. Create campaign record
    const campaignPayload: TablesInsert<'campaigns'> = {
      name: campaignName,
      template_id: templateId,
      status: 'Scheduled',
      sent_at: scheduleDate || new Date().toISOString(),
      team_id: teamId,
      recipient_count: recipients.length
    };
    const { data: campaign, error: campaignError } = await supabaseAdmin.from('campaigns').insert(campaignPayload as any).select().single();
    if (campaignError) throw campaignError;
    
    // 2. Create message records
    const messagesToInsert: TablesInsert<'messages'>[] = recipients.map((contact: any) => ({
      team_id: teamId,
      campaign_id: campaign.id,
      contact_id: contact.id,
      content: 'Message enqueued for sending.', // Placeholder, will be updated by processor
      status: 'pending',
      type: 'outbound',
      source: 'campaign',
    }));

    const { data: messages, error: messagesError } = await supabaseAdmin.from('messages').insert(messagesToInsert as any).select('id');
    if (messagesError) throw messagesError;

    // 3. Enqueue messages with BullMQ
    const delaySeconds = speed === 'slow' ? 60 : speed === 'very_slow' ? 300 : 0;
    // Convert iterator to array to fix the ArrayIterator error
    const messagesArray = Array.isArray(messages) ? messages : [];
    for (let index = 0; index < messagesArray.length; index++) {
      const message = messagesArray[index];
      const delay = scheduleDate
        ? Math.max(0, new Date(scheduleDate).getTime() - Date.now()) + (index * delaySeconds * 1000)
        : index * delaySeconds * 1000;
      await campaignQueue.add('send-message', {
        messageId: message.id,
        userId: user.id,
        variables,
      }, {
        delay,
      });
    }
    
    res.status(202).json({ message: 'Campaign successfully enqueued.' });

  } catch (err: any) {
    console.error('Error in enqueue-campaign-send:', err);
    res.status(500).json({ error: 'Failed to enqueue campaign.', details: err.message });
  }
}