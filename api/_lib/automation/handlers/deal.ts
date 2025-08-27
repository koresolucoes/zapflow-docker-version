import pool from '../../db.js';
import { ActionHandler, DealInsert } from '../../types.js';
import { resolveVariables } from '../helpers.js';
import { publishEvent } from '../trigger-handler.js';

export const createDeal: ActionHandler = async ({ profile, contact, node, trigger, teamId }) => {
    if (!contact) {
        throw new Error('Ação "Criar Negócio" requer um contato.');
    }
    const config = (node.data.config || {}) as any;
    if (!config.deal_name || !config.pipeline_id || !config.stage_id) {
        throw new Error('Configuração incompleta para criar negócio: nome, funil e etapa são obrigatórios.');
    }

    const context = { contact, trigger };
    const dealName = resolveVariables(config.deal_name, context);
    const dealValue = config.deal_value ? parseFloat(resolveVariables(config.deal_value, context)) : 0;

    const dealPayload: DealInsert = {
        name: dealName,
        value: isNaN(dealValue) ? 0 : dealValue,
        pipeline_id: config.pipeline_id,
        stage_id: config.stage_id,
        contact_id: contact.id,
        team_id: teamId,
        status: 'Aberto'
    };

    const { rows } = await pool.query(
        'INSERT INTO deals (name, value, pipeline_id, stage_id, contact_id, team_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [dealPayload.name, dealPayload.value, dealPayload.pipeline_id, dealPayload.stage_id, dealPayload.contact_id, dealPayload.team_id, dealPayload.status]
    );
    const newDeal = rows[0];

    // Dispara o evento de "deal_created" para que outros gatilhos possam reagir
    await publishEvent('deal_created', profile.id, { contact, deal: newDeal });

    return { details: `Negócio "${dealName}" criado com sucesso.` };
};

export const updateDealStage: ActionHandler = async ({ profile, contact, node }) => {
    if (!contact) {
        throw new Error('Ação "Atualizar Etapa do Negócio" requer um contato.');
    }
    const config = (node.data.config || {}) as any;
    if (!config.stage_id) {
        throw new Error('Nenhuma etapa de destino foi selecionada.');
    }
    
    const dealResult = await pool.query(
        'SELECT * FROM deals WHERE contact_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
        [contact.id, 'Aberto']
    );

    if (dealResult.rows.length === 0) {
        return { details: 'Nenhum negócio aberto encontrado para este contato. Nenhuma ação executada.' };
    }
    const latestDeal = dealResult.rows[0];
    
    const stageResult = await pool.query('SELECT type FROM pipeline_stages WHERE id = $1', [config.stage_id]);
    if (stageResult.rows.length === 0) {
        throw new Error(`Pipeline stage with id ${config.stage_id} not found.`);
    }
    const targetStage = stageResult.rows[0];

    const updatePayload: any = { stage_id: config.stage_id };
    let closedAt = null;
    if (targetStage.type === 'Ganho' || targetStage.type === 'Perdido') {
        updatePayload.status = targetStage.type;
        closedAt = new Date().toISOString();
    }
    
    const { rows: updatedRows } = await pool.query(
        'UPDATE deals SET stage_id = $1, status = $2, closed_at = $3 WHERE id = $4 RETURNING *',
        [updatePayload.stage_id, updatePayload.status || latestDeal.status, closedAt, latestDeal.id]
    );

    const updatedDeal = updatedRows[0];

    // Dispara o evento de "deal_stage_changed"
    await publishEvent('deal_stage_changed', profile.id, { contact, deal: updatedDeal, new_stage_id: config.stage_id });

    return { details: `Negócio "${latestDeal.name}" movido para a nova etapa.` };
};