import { supabaseAdmin } from '../supabaseAdmin.js';
import { getMetaConfig, resolveVariables } from '../automation/helpers.js';
import { sendTemplatedMessage } from '../meta/messages.js';
import { getMetaTemplateById } from '../meta/templates.js';
import { MessageTemplate } from '../types.js';
import { MetricsService } from '../services/metrics.service.js';

interface ProcessMessageParams {
    messageId: string;
    userId: string;
    variables: Record<string, any>;
}

export async function executeCampaignMessage({ messageId, userId, variables }: ProcessMessageParams) {
    try {
        const { data: message, error: msgError } = await supabaseAdmin
            .from('messages')
            .select('*, contacts(*), campaigns!inner(*, message_templates!inner(*))')
            .eq('id', messageId)
            .single();

        if (msgError || !message) {
            throw new Error(`Message or related data not found for ID ${messageId}: ${msgError?.message}`);
        }

        if (message.status !== 'pending') {
            console.warn(`Skipping message ${messageId} as its status is '${message.status}', not 'pending'.`);
            return { success: true, message: 'Skipped, already processed.' };
        }

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) throw new Error(`Profile not found for user ${userId}`);

        const metaConfig = getMetaConfig(profile as any);
        const contact = message.contacts as any;
        const campaignWithTemplate = message.campaigns as any;

        if (!campaignWithTemplate) {
            throw new Error(`Campaign data not found for message ${messageId}`);
        }

        const template = campaignWithTemplate.message_templates as MessageTemplate;

        if (!contact || !template || !template.meta_id) {
            throw new Error(`Contact or template invalid for message ${messageId}`);
        }

        const metaTemplateDetails = await getMetaTemplateById(metaConfig, template.meta_id);
        const context = { contact, trigger: null };

        const resolvePlaceholder = (p: string) =>
            resolveVariables(p === '{{1}}' ? '{{contact.name}}' : variables[p] || '', context);

        const finalComponents: any[] = [];
        const header = template.components.find((c: any) => c.type === 'HEADER');
        if (header?.text) {
            const placeholders = header.text.match(/\{\{\d+\}\}/g) || [];
            if (placeholders.length > 0)
                finalComponents.push({
                    type: 'header',
                    parameters: placeholders.map((p: string) => ({ type: 'text', text: resolvePlaceholder(p) })),
                });
        }

        const body = template.components.find((c: any) => c.type === 'BODY');
        if (body?.text) {
            const placeholders = body.text.match(/\{\{\d+\}\}/g) || [];
            if (placeholders.length > 0)
                finalComponents.push({
                    type: 'body',
                    parameters: placeholders.map((p: string) => ({ type: 'text', text: resolvePlaceholder(p) })),
                });
        }

        const buttons = template.components.find((c: any) => c.type === 'BUTTONS');
        if (buttons?.buttons) {
            buttons.buttons.forEach((btn: any, index: number) => {
                if (btn.type === 'URL' && btn.url) {
                    const placeholders = btn.url.match(/\{\{\d+\}\}/g) || [];
                    if (placeholders.length > 0)
                        finalComponents.push({
                            type: 'button',
                            sub_type: 'url',
                            index: String(index),
                            parameters: placeholders.map((p: string) => ({ type: 'text', text: resolvePlaceholder(p) })),
                        });
                }
            });
        }

        let resolvedContent = body?.text || '';
        (resolvedContent.match(/\{\{\d+\}\}/g) || []).forEach((p: string) => {
            resolvedContent = resolvedContent.replace(p, resolvePlaceholder(p));
        });

        const response = await sendTemplatedMessage(
            metaConfig,
            contact.phone,
            metaTemplateDetails.name,
            metaTemplateDetails.language,
            finalComponents.length > 0 ? finalComponents : undefined
        );

        const messageUpdate = {
            status: 'sent',
            meta_message_id: response.messages[0].id,
            sent_at: new Date().toISOString(),
            content: resolvedContent,
        };

        // Atualizar a mensagem no banco de dados
        const { error: updateError } = await supabaseAdmin
            .from('messages')
            .update(messageUpdate)
            .eq('id', messageId);

        if (updateError) {
            console.error(`[Process Campaign] Failed to update message status for ${messageId}:`, updateError);
        }

        // Registrar métrica para a mensagem de campanha
        try {
            await MetricsService.logMessage({
                profileId: userId,
                messageId: response.messages[0].id,
                contactId: contact.id,
                direction: 'outbound',
                status: 'sent',
                messageType: 'template',
                timestamp: new Date(),
                campaignId: campaignWithTemplate.id,
                templateName: template.template_name // Corrigido: usando templateName
            });
            console.log(`[Metrics] Logged campaign message ${response.messages[0].id} for contact ${contact.id}`);
        } catch (metricsError) {
            console.error(`[Metrics] Failed to log campaign message ${response.messages[0].id}:`, metricsError);
            // Não interrompemos o fluxo se houver erro nas métricas
        }

        if (campaignWithTemplate) {
            const { count, error: countError } = await supabaseAdmin
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', campaignWithTemplate.id)
                .eq('status', 'pending');

            if (countError) {
                console.error(`[Process Campaign] Error checking remaining messages for campaign ${campaignWithTemplate.id}:`, countError);
            } else if (count === 0) {
                console.log(`[Process Campaign] Last message for campaign ${campaignWithTemplate.id} processed. Updating campaign status to 'Sent'.`);
                await supabaseAdmin.from('campaigns').update({ status: 'Sent' }).eq('id', campaignWithTemplate.id);
            }
        }

        return { success: true };

    } catch (err: any) {
        console.error(`Error processing message ${messageId}:`, err);
        
        // Registrar falha nas métricas
        try {
            const { data: failedMessage } = await supabaseAdmin
                .from('messages')
                .select('contact_id, campaign_id') // Buscando apenas os campos necessários
                .eq('id', messageId)
                .single();
                
                if (failedMessage) {
                    await MetricsService.logMessage({
                        profileId: userId,
                        messageId: `failed_${messageId}_${Date.now()}`,
                        contactId: failedMessage.contact_id, // Acessando diretamente o campo
                        direction: 'outbound',
                        status: 'failed',
                        messageType: 'template',
                        timestamp: new Date(),
                        campaignId: failedMessage.campaign_id, // Acessando diretamente o campo
                        errorCode: err.message?.substring(0, 100) // Corrigido: usando errorCode
                    });
                
            }
        } catch (metricsError) {
            console.error(`[Metrics] Failed to log failed campaign message ${messageId}:`, metricsError);
        }
        
        // Atualizar status da mensagem para falha
        await supabaseAdmin
            .from('messages')
            .update({ 
                status: 'failed', 
                error_message: err.message?.substring(0, 500) 
            })
            .eq('id', messageId);
            
        // Re-throw the error so the caller (worker or API) knows it failed.
        throw err;
    }
}
