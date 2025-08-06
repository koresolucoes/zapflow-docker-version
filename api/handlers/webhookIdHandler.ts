import { Request, Response } from 'express';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { MetricsService } from '../_lib/services/metrics.service.js';

interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
          document?: {
            id: string;
            filename: string;
            mime_type: string;
            sha256: string;
          };
          audio?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
          video?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
          button?: {
            text: string;
            payload: string;
          };
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
            list_reply?: {
              id: string;
              title: string;
              description: string;
            };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            origin: {
              type: string;
            };
          };
          pricing?: {
            pricing_model: string;
            category: string;
            billable: boolean;
            per_unit_price: {
              amount: number;
              currency: string;
            };
          };
          errors?: Array<{
            code: number;
            title: string;
            message: string;
            error_data?: {
              details: string;
            };
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

export async function webhookIdHandler(req: Request, res: Response) {
  const { id } = req.params;
  
  // Verifica se é uma requisição de verificação do webhook
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    if (mode === 'subscribe' && token) {
      // Busca o token de verificação do perfil
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('meta_verify_token')
        .eq('id', id)
        .single();

      if (profileError || !profile) {
        console.error('Profile not found for webhook verification:', id);
        return res.status(404).json({ error: 'Profile not found' });
      }

      if (token === profile.meta_verify_token) {
        console.log('Webhook verified for profile:', id);
        return res.status(200).send(challenge);
      } else {
        console.error('Invalid verify token for profile:', id);
        return res.status(403).json({ error: 'Invalid verify token' });
      }
    }

    return res.status(400).json({ error: 'Invalid webhook verification request' });
  }

  // Processa notificações do webhook
  if (req.method === 'POST') {
    try {
      const payload: WebhookPayload = req.body;
      
      // Verifica se é um webhook do WhatsApp
      if (payload.object !== 'whatsapp_business_account') {
        return res.status(400).json({ error: 'Invalid webhook object' });
      }

      // Processa cada entrada do webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await processMessages(change.value, id);
          } else if (change.field === 'message_status') {
            await processStatuses(change.value, id);
          } else if (change.field === 'flows') {
            await processFlowEvents(change.value, id);
          }
        }
      }

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function processMessages(value: any, profileId: string) {
  if (!value.messages || value.messages.length === 0) return;

  for (const message of value.messages) {
    try {
      // Determina o tipo de mensagem
      let messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'button' | 'list' | 'template' = 'text';
      
      if (message.image) messageType = 'image';
      else if (message.document) messageType = 'document';
      else if (message.audio) messageType = 'audio';
      else if (message.video) messageType = 'video';
      else if (message.button) messageType = 'button';
      else if (message.interactive) messageType = 'list';
      else if (message.text) messageType = 'text';

      // Busca ou cria o contato
      const contactId = await getOrCreateContact(message.from, profileId);

      // Registra a métrica da mensagem
      await MetricsService.logMessage({
        profileId,
        messageId: message.id,
        contactId,
        direction: 'inbound',
        status: 'sent',
        messageType,
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        templateName: message.template?.name || null,
      });

      console.log(`Processed inbound message: ${message.id}`);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }
}

async function processStatuses(value: any, profileId: string) {
  if (!value.statuses || value.statuses.length === 0) return;

  for (const status of value.statuses) {
    try {
      // Atualiza o status da mensagem
      await MetricsService.updateMessageStatus({
        profileId,
        messageId: status.id,
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000),
        errorCode: status.errors?.[0]?.code?.toString() || null,
      });

      console.log(`Updated message status: ${status.id} -> ${status.status}`);
    } catch (error) {
      console.error('Error processing status:', error);
    }
  }
}

async function processFlowEvents(value: any, profileId: string) {
  try {
    const { event, flow_id, old_status, new_status } = value;

    // Registra eventos de Flow
    await supabaseAdmin
      .from('webhook_logs')
      .insert({
        team_id: profileId, // Assumindo que profileId é o team_id
        source: 'whatsapp_flows',
        payload: {
          event,
          flow_id,
          old_status,
          new_status,
          timestamp: new Date().toISOString(),
        },
        path: `/webhook/${profileId}`,
      });

    console.log(`Processed Flow event: ${event} for flow ${flow_id}`);
  } catch (error) {
    console.error('Error processing Flow event:', error);
  }
}

async function getOrCreateContact(phoneNumber: string, profileId: string): Promise<string> {
  try {
    // Busca o contato existente
    const { data: existingContact, error: searchError } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('phone', phoneNumber)
      .eq('team_id', profileId) // Assumindo que profileId é o team_id
      .single();

    if (existingContact) {
      return existingContact.id;
    }

    // Cria um novo contato
    const { data: newContact, error: insertError } = await supabaseAdmin
      .from('contacts')
      .insert({
        name: `Contato ${phoneNumber}`,
        phone: phoneNumber,
        team_id: profileId, // Assumindo que profileId é o team_id
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    return newContact.id;
  } catch (error) {
    console.error('Error getting or creating contact:', error);
    throw error;
  }
}