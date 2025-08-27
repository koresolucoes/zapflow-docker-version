import pool from '../db.js';
import { executeAutomation } from './engine.js';
import { Automation, Contact, Json, Profile, Deal, AutomationNode, TriggerInfo } from '../types.js';
import { sanitizeAutomation } from './utils.js';

const dispatchAutomations = async (userId: string, triggers: TriggerInfo[], contact: Contact | null, triggerPayload: Json | null) => {
    if (triggers.length === 0) return;

    console.log(`[DISPATCHER] Found ${triggers.length} potential automations to dispatch for user ${userId}.`);

    let profile: Profile;
    try {
        const profileResult = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);
        if (profileResult.rows.length === 0) {
            console.error(`[DISPATCHER] ERRO: Perfil não encontrado para o usuário ${userId}.`);
            return;
        }
        profile = profileResult.rows[0];
    } catch (profileError) {
        console.error(`[DISPATCHER] ERRO: Falha ao buscar perfil para o usuário ${userId}.`, profileError);
        return;
    }

    const uniqueAutomationIds = [...new Set(triggers.map(t => t.automation_id))];
    if (uniqueAutomationIds.length === 0) {
        return;
    }

    let automations: Automation[];
    try {
        const automationsResult = await pool.query(
            'SELECT created_at, edges, id, name, nodes, status, team_id FROM automations WHERE id = ANY($1::uuid[])',
            [uniqueAutomationIds]
        );
        automations = automationsResult.rows;
    } catch (error) {
        console.error(`[DISPATCHER] ERRO: Falha ao buscar automações.`, error);
        return;
    }
    
    const automationsMap = new Map((automations as any as Automation[]).map(a => [a.id, a]));

    const executionPromises = triggers.map(trigger => {
        const rawAutomation = automationsMap.get(trigger.automation_id);
        if (rawAutomation) {
            if (rawAutomation.status !== 'active') {
                console.log(`[DISPATCHER] Ignorando automação '${rawAutomation.name}' (ID: ${rawAutomation.id}) pois está com status '${rawAutomation.status}'.`);
                return Promise.resolve();
            }
            const automation = sanitizeAutomation(rawAutomation);
            console.log(`[DISPATCHER] Despachando automação '${automation.name}' (ID: ${automation.id}) a partir do nó ${trigger.node_id}`);
            return executeAutomation(automation, contact, trigger.node_id, triggerPayload, profile);
        }
        return Promise.resolve();
    });

    await Promise.all(executionPromises);
};

const handleMetaMessageEvent = async (userId: string, contact: Contact, message: any) => {
    // 1. Extract relevant data from the message payload
    const messageType = message.type;
    const messageBody = messageType === 'text' ? (message.text?.body || '').toLowerCase() : '';
    
    let buttonPayload: string | undefined;
    if (messageType === 'interactive' && message.interactive?.type === 'button_reply') {
        buttonPayload = message.interactive.button_reply.id;
    } else if (messageType === 'button') {
        buttonPayload = message.button?.payload;
    }
    
    console.log(`[HANDLER] Processing Meta message event for contact ${contact.id}. Type: ${messageType}, Body: "${messageBody}", Button Payload: "${buttonPayload}"`);

    try {
        // 2. Get Team ID
        const teamResult = await pool.query('SELECT id FROM teams WHERE owner_id = $1', [userId]);
        if (teamResult.rows.length === 0) {
            console.error(`[HANDLER] Could not find team for user ${userId} in MetaMessageEvent. Aborting.`);
            return;
        }
        const teamId = teamResult.rows[0].id;

        const matchingTriggers: TriggerInfo[] = [];

        // 3. Check for Button Click Triggers
        if (buttonPayload) {
            const buttonTriggersResult = await pool.query(
                'SELECT automation_id, node_id FROM automation_triggers WHERE team_id = $1 AND trigger_type = $2 AND trigger_key = $3',
                [teamId, 'button_clicked', buttonPayload]
            );
            if (buttonTriggersResult.rows.length > 0) {
                console.log(`[HANDLER] Found ${buttonTriggersResult.rows.length} matching button triggers for payload "${buttonPayload}".`);
                matchingTriggers.push(...buttonTriggersResult.rows);
            }
        }

        // 4. Check for Keyword Triggers (ONLY for text messages)
        if (messageType === 'text' && messageBody) {
            const keywordTriggersResult = await pool.query(
                'SELECT automation_id, node_id, trigger_key FROM automation_triggers WHERE team_id = $1 AND trigger_type = $2',
                [teamId, 'message_received_with_keyword']
            );

            if (keywordTriggersResult.rows.length > 0) {
                console.log(`[HANDLER] Checking ${keywordTriggersResult.rows.length} keyword triggers for message: "${messageBody}"`);
                for (const trigger of keywordTriggersResult.rows) {
                    const keyword = trigger.trigger_key;
                    if (keyword && typeof keyword === 'string' && messageBody.includes(keyword.toLowerCase())) {
                        console.log(`[HANDLER] Match found! Keyword: "${keyword}". Dispatching automation ${trigger.automation_id}`);
                        matchingTriggers.push({ automation_id: trigger.automation_id, node_id: trigger.node_id });
                    }
                }
            }
        }

        // 5. Dispatch if matches found
        if (matchingTriggers.length > 0) {
           // Using a Set to ensure unique automations are dispatched if multiple keywords/buttons match
           const uniqueTriggers = Array.from(new Map(matchingTriggers.map(item => [item.node_id, item])).values());
           console.log(`[HANDLER] Dispatching ${uniqueTriggers.length} unique automations.`);
           const triggerData = { type: 'meta_message', payload: message };
           await dispatchAutomations(userId, uniqueTriggers, contact, triggerData);
        } else {
            console.log('[HANDLER] No matching automation triggers found for this message.');
        }
    } catch (error) {
        console.error('[HANDLER] A general error occurred in handleMetaMessageEvent:', error);
    }
};

const handleNewContactEvent = async (userId: string, contact: Contact) => {
    console.log(`[HANDLER] Processing new_contact event for contact ${contact.id}`);

    const { data: teamData, error: teamError } = await supabaseAdmin.from('teams').select('id').eq('owner_id', userId).single();
    if (teamError || !teamData) {
        console.error(`[HANDLER] Could not find team for user ${userId} in NewContactEvent. Aborting.`);
        return;
    }
    const teamId = teamData.id;

    const { data: triggers, error } = await supabaseAdmin
        .from('automation_triggers')
        .select('automation_id, node_id')
        .eq('team_id', teamId)
        .eq('trigger_type', 'new_contact');
        
    if (error) {
        console.error(`[HANDLER] Erro em NewContactEvent:`, error);
        return;
    }

    if (triggers && triggers.length > 0) {
        const triggerData = { type: 'new_contact', payload: { contact } };
        await dispatchAutomations(userId, triggers as unknown as TriggerInfo[], contact, triggerData);
    }

    // 5. Dispatch if matches found
    if (matchingTriggers.length > 0) {
       // Using a Set to ensure unique automations are dispatched if multiple keywords/buttons match
       const uniqueTriggers = Array.from(new Map(matchingTriggers.map(item => [item.node_id, item])).values());
       console.log(`[HANDLER] Dispatching ${uniqueTriggers.length} unique automations.`);
       const triggerData = { type: 'meta_message', payload: message };
       await dispatchAutomations(userId, uniqueTriggers, contact, triggerData);
    } else {
        console.log('[HANDLER] No matching automation triggers found for this message.');
    }
};

const handleNewContactEvent = async (userId: string, contact: Contact) => {
    console.log(`[HANDLER] Processing new_contact event for contact ${contact.id}`);
    try {
        const teamResult = await pool.query('SELECT id FROM teams WHERE owner_id = $1', [userId]);
        if (teamResult.rows.length === 0) {
            console.error(`[HANDLER] Could not find team for user ${userId} in NewContactEvent. Aborting.`);
            return;
        }
        const teamId = teamResult.rows[0].id;

        const triggersResult = await pool.query(
            'SELECT automation_id, node_id FROM automation_triggers WHERE team_id = $1 AND trigger_type = $2',
            [teamId, 'new_contact']
        );

        if (triggersResult.rows.length > 0) {
            const triggerData = { type: 'new_contact', payload: { contact } };
            await dispatchAutomations(userId, triggersResult.rows, contact, triggerData);
        }
    } catch (error) {
        console.error(`[HANDLER] Error in NewContactEvent:`, error);
    }
};

export const handleTagAddedEvent = async (userId: string, contact: Contact, addedTag: string) => {
    console.log(`[HANDLER] Processing tag_added event for contact ${contact.id}. Tag: "${addedTag}"`);
    try {
        const teamResult = await pool.query('SELECT id FROM teams WHERE owner_id = $1', [userId]);
        if (teamResult.rows.length === 0) {
            console.error(`[HANDLER] Could not find team for user ${userId} in TagAddedEvent. Aborting.`);
            return;
        }
        const teamId = teamResult.rows[0].id;

        const triggersResult = await pool.query(
            'SELECT automation_id, node_id FROM automation_triggers WHERE team_id = $1 AND trigger_type = $2 AND trigger_key ILIKE $3',
            [teamId, 'new_contact_with_tag', addedTag]
        );
        
        if (triggersResult.rows.length > 0) {
            const triggerData = { type: 'tag_added', payload: { contact, addedTag } };
            await dispatchAutomations(userId, triggersResult.rows, contact, triggerData);
        }
    } catch (error) {
        console.error(`[HANDLER] Error in TagAddedEvent:`, error);
    }
};

const handleDealCreatedEvent = async (userId: string, contact: Contact, deal: Deal) => {
    console.log(`[HANDLER] Processing deal_created event for deal ${deal.id}`);
    try {
        const teamResult = await pool.query('SELECT id FROM teams WHERE owner_id = $1', [userId]);
        if (teamResult.rows.length === 0) {
            console.error(`[HANDLER] Could not find team for user ${userId} in DealCreatedEvent. Aborting.`);
            return;
        }
        const teamId = teamResult.rows[0].id;

        const triggersResult = await pool.query(
            'SELECT automation_id, node_id FROM automation_triggers WHERE team_id = $1 AND trigger_type = $2',
            [teamId, 'deal_created']
        );

        if (triggersResult.rows.length > 0) {
            const triggerData = { type: 'deal_created', payload: { deal } };
            await dispatchAutomations(userId, triggersResult.rows, contact, triggerData);
        }
    } catch (error) {
        console.error(`[HANDLER] Error in DealCreatedEvent:`, error);
    }
};

const handleDealStageChangedEvent = async (userId: string, contact: Contact, deal: Deal, new_stage_id: string) => {
    console.log(`[HANDLER] Processing deal_stage_changed event for deal ${deal.id} to stage ${new_stage_id}`);
    try {
        const teamResult = await pool.query('SELECT id FROM teams WHERE owner_id = $1', [userId]);
        if (teamResult.rows.length === 0) {
            console.error(`[HANDLER] Could not find team for user ${userId}. Aborting.`);
            return;
        }
        const teamId = teamResult.rows[0].id;

        const stageResult = await pool.query('SELECT pipeline_id FROM pipeline_stages WHERE id = $1', [new_stage_id]);
        if (stageResult.rows.length === 0) {
            console.error(`[HANDLER] Could not find pipeline for stage ${new_stage_id}. Aborting.`);
            return;
        }
        const pipelineIdOfNewStage = stageResult.rows[0].pipeline_id;

        const allTriggersResult = await pool.query(
            'SELECT automation_id, node_id, trigger_key FROM automation_triggers WHERE team_id = $1 AND trigger_type = $2',
            [teamId, 'deal_stage_changed']
        );

        if (allTriggersResult.rows.length === 0) {
            console.log('[HANDLER] No deal_stage_changed triggers found for this team.');
            return;
        }

        const allTriggers = allTriggersResult.rows;
        const matchingTriggers: TriggerInfo[] = [];

        const specificStageTriggers = allTriggers.filter(t => t.trigger_key === new_stage_id);
        matchingTriggers.push(...specificStageTriggers);

        const anyStageTriggers = allTriggers.filter(t => t.trigger_key === null);
        const automationIdsToFetch = [...new Set(anyStageTriggers.map(t => t.automation_id))];

        if (automationIdsToFetch.length > 0) {
            const automationsResult = await pool.query(
                'SELECT id, nodes FROM automations WHERE id = ANY($1::uuid[])',
                [automationIdsToFetch]
            );

            const automationsMap = new Map(automationsResult.rows.map(a => [a.id, a.nodes]));
            for (const trigger of anyStageTriggers) {
                const nodes = automationsMap.get(trigger.automation_id);
                if (nodes) {
                    const node = (nodes as AutomationNode[]).find(n => n.id === trigger.node_id);
                    if (node && node.data.type === 'deal_stage_changed') {
                        const config = node.data.config as any;
                        if (!config.pipeline_id || config.pipeline_id === pipelineIdOfNewStage) {
                            matchingTriggers.push({ automation_id: trigger.automation_id, node_id: trigger.node_id });
                        }
                    }
                }
            }
        }

        if (matchingTriggers.length > 0) {
            const uniqueTriggers = Array.from(new Map(matchingTriggers.map(item => [`${item.automation_id}-${item.node_id}`, item])).values());
            console.log(`[HANDLER] Found ${uniqueTriggers.length} matching triggers for stage change.`);
            const triggerData = { type: 'deal_stage_changed', payload: { deal, new_stage_id } };
            await dispatchAutomations(userId, uniqueTriggers, contact, triggerData);
        } else {
            console.log(`[HANDLER] No matching triggers found for stage change to ${new_stage_id}.`);
        }
    } catch (error) {
        console.error(`[HANDLER] Error fetching deal_stage_changed triggers:`, error);
    }
};

export const publishEvent = async (eventType: string, userId: string, data: any) => {
    console.log(`[EVENT BUS] Publicando evento: ${eventType} para o usuário ${userId}`);
    try {
        switch (eventType) {
            case 'message_received':
                await handleMetaMessageEvent(userId, data.contact, data.message);
                break;
            case 'contact_created':
                await handleNewContactEvent(userId, data.contact);
                break;
            case 'tag_added':
                await handleTagAddedEvent(userId, data.contact, data.tag);
                break;
            case 'deal_created':
                await handleDealCreatedEvent(userId, data.contact, data.deal);
                break;
            case 'deal_stage_changed':
                await handleDealStageChangedEvent(userId, data.contact, data.deal, data.new_stage_id);
                break;
            default:
                console.warn(`[EVENT BUS] Tipo de evento desconhecido: ${eventType}`);
        }
    } catch (error) {
        console.error(`[EVENT BUS] Erro ao processar o evento ${eventType}:`, error);
    }
};