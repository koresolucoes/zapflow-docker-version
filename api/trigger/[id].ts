import { Request, Response } from 'express';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { executeAutomation } from '../_lib/automation/engine.js';
import { publishEvent } from '../_lib/automation/trigger-handler.js';
import { Automation, Profile, Json } from '../_lib/types.js';
import type { TablesInsert } from '../_lib/database.types.js';
import { getRawBody, parseMultipartFormData } from '../_lib/webhook/parser.js';
import { processWebhookPayloadForContact } from '../_lib/webhook/contact-mapper.js';
import { sanitizeAutomation } from '../_lib/automation/utils.js';

export async function handleWebhookTrigger(req: Request, res: Response) {
    const { id: rawId } = req.params;

    if (typeof rawId !== 'string') {
        return res.status(400).json({ error: 'Invalid trigger ID format.' });
    }

    const separator = '__';
    const separatorIndex = rawId.indexOf(separator);
    if (separatorIndex === -1) {
        return res.status(400).json({ error: `Invalid trigger ID format. Expected separator "${separator}" not found.` });
    }

    const webhookPrefix = rawId.substring(0, separatorIndex);
    const nodeId = rawId.substring(separatorIndex + separator.length);

    let profileData: Profile | null = null;
    const PROFILE_COLUMNS = 'id, company_audience, company_description, company_name, company_products, company_tone, meta_access_token, meta_phone_number_id, meta_waba_id, meta_verify_token, updated_at, webhook_path_prefix, dashboard_layout';

    // Robust Profile Lookup: First try by the custom path prefix.
    const { data: profileByPrefix, error: prefixError } = await supabaseAdmin
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('webhook_path_prefix', webhookPrefix)
        .maybeSingle();
    
    if (prefixError) console.error('[Trigger API] Error fetching profile by prefix', prefixError);

    if (profileByPrefix) {
        profileData = profileByPrefix as any as Profile;
    } else {
        // As a fallback, check if the prefix was actually a user ID.
        const { data: profileById, error: idError } = await supabaseAdmin
            .from('profiles')
            .select(PROFILE_COLUMNS)
            .eq('id', webhookPrefix)
            .maybeSingle();
        if (idError) console.error('[Trigger API] Error fetching profile by ID', idError);
        if (profileById) {
            profileData = profileById as any as Profile;
        }
    }
    
    if (!profileData) {
        return res.status(404).json({ error: `Profile not found for webhook prefix or ID: "${webhookPrefix}"` });
    }
    const profile = profileData;

    const { data: teamData, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('id')
        .eq('owner_id', profile.id)
        .single();
        
    if (teamError || !teamData) {
        return res.status(404).json({ error: `Team not found for user ${profile.id}` });
    }
    const teamId = teamData.id;

    const { data: automationsData, error: automationsError } = await supabaseAdmin
        .from('automations')
        .select('created_at, edges, id, name, nodes, status, team_id')
        .eq('team_id', teamId)
        .eq('status', 'active');
    
    if (automationsError || !automationsData) {
        return res.status(500).json({ error: 'Failed to retrieve automations.' });
    }
    
    const automations = (automationsData as any as Automation[]) || [];
    const rawAutomation = automations.find(a => (a.nodes || []).some(n => n.id === nodeId));

    if (!rawAutomation) {
        return res.status(404).json({ error: 'Automation not found for this trigger ID.' });
    }
    
    const automation = sanitizeAutomation(rawAutomation);

    const triggerNode = automation.nodes.find(n => n.id === nodeId);
    if (!triggerNode || triggerNode.data.type !== 'webhook_received') {
        return res.status(400).json({ error: 'Invalid trigger node.' });
    }

    const contentType = req.headers['content-type'] || '';
    let body: any = {};

    // Manually parse body if not JSON
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        try {
            const rawBody = await getRawBody(req);
            const rawBodyString = rawBody.toString('utf-8');

            // Log the raw request for the webhook inspector
            try {
                // Sanitize headers by removing undefined values
                const cleanHeaders: { [key: string]: string | string[] } = {};
                for (const [key, value] of Object.entries(req.headers)) {
                    if (value !== undefined) {
                        cleanHeaders[key] = value;
                    }
                }
                
                const logPayload: TablesInsert<'webhook_logs'> = {
                    team_id: teamId,
                    source: 'automation_trigger',
                    payload: { rawBody: rawBodyString, query: req.query, headers: cleanHeaders } as unknown as Json,
                    path: req.originalUrl || null,
                };
                await supabaseAdmin.from('webhook_logs').insert(logPayload as any);
            } catch (logError) {
                console.error('[Trigger] Failed to log incoming trigger webhook:', logError);
            }

            if (contentType.includes('application/json') && rawBodyString) {
                body = JSON.parse(rawBodyString);
            } else if (contentType.includes('application/x-www-form-urlencoded') && rawBodyString) {
                body = Object.fromEntries(new URLSearchParams(rawBodyString));
            } else if (contentType.includes('multipart/form-data')) {
                const boundaryMatch = contentType.match(/boundary=([^;\s]+)/);
                if (boundaryMatch) {
                    const boundary = boundaryMatch[1];
                    body = parseMultipartFormData(rawBody, boundary);
                }
            } else if (rawBodyString) {
                // Fallback for plain text or other types
                try {
                    body = JSON.parse(rawBodyString);
                } catch (e) {
                    body = { raw: rawBodyString };
                }
            }
        } catch (e: any) {
            console.error('Error parsing request body:', e.message);
            // Don't fail the request, proceed with an empty body
            body = {};
        }
    } else {
        // For GET requests or others, use the parsed body if available
        body = req.body || {};
    }

    const structuredPayload = {
        body: body,
        query: req.query || {},
        headers: req.headers || {},
    };

    const config = (triggerNode.data.config || {}) as any;

    // "Listen" mode: Capture data and broadcast to the client editor.
    if (config.is_listening === true) {
        try {
            const channel = supabaseAdmin.channel(`automation-editor-${automation.id}`);
            await channel.send({
                type: 'broadcast',
                event: 'webhook_captured',
                payload: { nodeId: nodeId, data: structuredPayload }
            });
            // We don't need to keep the channel open on the server
            await supabaseAdmin.removeChannel(channel);

            return res.status(200).json({ message: 'Webhook data captured successfully. You can now configure mapping in the editor.' });
        } catch (broadcastError: any) {
            console.error('Webhook trigger: Failed to broadcast captured data.', broadcastError);
            return res.status(500).json({ 
                error: 'Failed to broadcast captured data to the editor.', 
                details: broadcastError.message 
            });
        }
    }

    // "Production" mode: Process data and run automation
    const events = Array.isArray(structuredPayload.body) ? structuredPayload.body : [structuredPayload.body];
    const mappingRules = config.data_mapping || [];

    try {
        for (const eventBody of events) {
            try {
                const fullPayloadForEvent = { ...structuredPayload, body: eventBody };
                
                const { contact, isNewContact, newlyAddedTags } = await processWebhookPayloadForContact(
                    profile, 
                    fullPayloadForEvent, 
                    mappingRules
                );
                
                await executeAutomation(automation, contact, nodeId, fullPayloadForEvent, profile);
                
                // Process side-effect events
                const sideEffectPromises: Promise<void>[] = [];
                if (contact) {
                    if (isNewContact) {
                        sideEffectPromises.push(publishEvent('contact_created', profile.id, { contact }));
                    }
                    newlyAddedTags.forEach(tag => {
                        sideEffectPromises.push(publishEvent('tag_added', profile.id, { contact, tag }));
                    });
                }
                await Promise.all(sideEffectPromises);
            } catch (e: any) {
                console.error(`Webhook trigger: Error processing event in loop: ${e.message}`);
                // If one event in a batch fails, log it and continue to the next
            }
        }

        return res.status(200).json({ message: 'Automation executed successfully.' });
    } catch (error: any) {
        console.error('Error in webhook processing:', error);
        return res.status(500).json({ 
            error: 'Internal server error while processing webhook',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}