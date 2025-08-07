import { Request, Response } from 'express';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { publishEvent } from '../_lib/automation/trigger-handler.js';
import { Contact } from '../_lib/types.js';

export async function runTriggerHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { eventType, userId, contactId, data } = req.body;
  if (!eventType || !userId) {
    return res.status(400).json({ error: 'Missing required fields: eventType, userId' });
  }

  let contact: Contact | null = null;
  if (contactId) {
    const { data: teamData, error: teamError } = await supabaseAdmin.from('teams').select('id').eq('owner_id', userId).single();
    if (teamError || !teamData) {
      return res.status(404).json({ error: `Team not found for user ${userId}` });
    }
    const teamId = (teamData as any).id;
    const { data: contactData, error } = await supabaseAdmin.from('contacts').select('*').eq('id', contactId).eq('team_id', teamId).single();
    if (error || !contactData) {
      return res.status(404).json({ error: 'Contact not found or access denied.' });
    }
    contact = contactData as unknown as Contact;
  }

  try {
    switch (eventType) {
      case 'contact_created':
        if (!contact) return res.status(400).json({ error: 'contactId is required for this event' });
        await publishEvent('contact_created', userId, { contact });
        if (contact.tags && contact.tags.length > 0) {
          await Promise.all(
            contact.tags.map((tag: string) => publishEvent('tag_added', userId, { contact, tag }))
          );
        }
        break;
      case 'tags_added':
        if (!contact) return res.status(400).json({ error: 'contactId is required for this event' });
        // Handle both added_tags (snake_case) and addedTags (camelCase) for backward compatibility
        const tagsToAdd = data?.added_tags || data?.addedTags;
        if (!tagsToAdd || !Array.isArray(tagsToAdd)) {
          return res.status(400).json({ error: 'Missing data.added_tags or data.addedTags array for this event type' });
        }
        await Promise.all(
          tagsToAdd.map((tag: string) => publishEvent('tag_added', userId, { contact, tag }))
        );
        break;
      case 'deal_created':
        if (!contact) return res.status(400).json({ error: 'contactId is required for this event' });
        if (!data || !data.deal) {
          return res.status(400).json({ error: 'Missing data.deal for this event type' });
        }
        await publishEvent('deal_created', userId, { contact, deal: data.deal });
        break;
      case 'deal_stage_changed':
        if (!contact) return res.status(400).json({ error: 'contactId is required for this event' });
        if (!data || !data.deal || !data.new_stage_id) {
          return res.status(400).json({ error: 'Missing data.deal or data.new_stage_id for this event type' });
        }
        await publishEvent('deal_stage_changed', userId, { contact, deal: data.deal, new_stage_id: data.new_stage_id });
        break;
      default:
        return res.status(400).json({ error: `Unsupported eventType: ${eventType}` });
    }
    return res.status(200).json({ message: 'Triggers executed successfully.' });
  } catch(err: any) {
    console.error('Error in run-trigger handler:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}