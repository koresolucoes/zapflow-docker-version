import { supabase } from '../lib/supabaseClient.js';
import { Pipeline, PipelineStage, DealInsert, DealWithContact, StageType, Deal } from '../types/index.js';
import { TablesInsert, TablesUpdate } from '@/src/types/database.types.js';

export const addDealToDb = async (dealData: DealInsert): Promise<DealWithContact> => {
    const { data, error } = await supabase.from('deals').insert(dealData as any).select('*, contacts(id, name)').single();
    if (error) throw error;
    return data as unknown as DealWithContact;
};

export const updateDealInDb = async (dealId: string, teamId: string, updates: TablesUpdate<'deals'>): Promise<DealWithContact> => {
    const { data, error } = await supabase.from('deals').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', dealId).eq('team_id', teamId).select('*, contacts(id, name)').single();
    if (error) throw error;
    return data as unknown as DealWithContact;
};

export const deleteDealFromDb = async (dealId: string, teamId: string): Promise<void> => {
    const { error } = await supabase.from('deals').delete().eq('id', dealId).eq('team_id', teamId);
    if (error) throw error;
};

export const createDefaultPipelineInDb = async (teamId: string): Promise<{ pipeline: Pipeline, stages: PipelineStage[] }> => {
    const { data: pipelineData, error: pipelineError } = await supabase.from('pipelines').insert({ team_id: teamId, name: 'Funil de Vendas Padrão' } as any).select('*').single();
    if (pipelineError || !pipelineData) throw pipelineError || new Error("Falha ao criar funil.");
    
    const pipeline = pipelineData as unknown as Pipeline;
    const defaultStages: { name: string; sort_order: number; type: StageType }[] = [ 
        { name: 'Novo Lead', sort_order: 0, type: 'Intermediária' }, 
        { name: 'Contato Feito', sort_order: 1, type: 'Intermediária' }, 
        { name: 'Proposta Enviada', sort_order: 2, type: 'Intermediária' }, 
        { name: 'Negociação', sort_order: 3, type: 'Intermediária' }, 
        { name: 'Ganhos', sort_order: 4, type: 'Ganho' }, 
        { name: 'Perdidos', sort_order: 5, type: 'Perdido' } 
    ];
    const stagesToInsert: TablesInsert<'pipeline_stages'>[] = defaultStages.map(stage => ({ ...stage, pipeline_id: pipeline.id }));
    const { data: stagesData, error: stagesError } = await supabase.from('pipeline_stages').insert(stagesToInsert as any).select('*');

    if (stagesError || !stagesData) {
        await supabase.from('pipelines').delete().eq('id', pipeline.id);
        throw stagesError || new Error("Falha ao criar etapas.");
    }
    
    return { pipeline, stages: stagesData as unknown as PipelineStage[] };
};

export const addPipelineToDb = async (teamId: string, name: string): Promise<{ pipeline: Pipeline, stage: PipelineStage }> => {
    const { data: pipelineData, error } = await supabase.from('pipelines').insert({ team_id: teamId, name } as any).select('*').single();
    if (error || !pipelineData) throw error || new Error("Falha ao criar funil.");

    const pipeline = pipelineData as unknown as Pipeline;
    const stagePayload: TablesInsert<'pipeline_stages'> = { name: 'Nova Etapa', sort_order: 0, pipeline_id: pipeline.id, type: 'Intermediária' };
    const { data: stageData, error: stageError } = await supabase.from('pipeline_stages').insert(stagePayload as any).select('*').single();
    if (stageError || !stageData) throw stageError || new Error("Falha ao criar etapa inicial.");

    return { pipeline, stage: stageData as unknown as PipelineStage };
};

export const updatePipelineInDb = async (id: string, teamId: string, name: string): Promise<Pipeline> => {
    const { data, error } = await supabase.from('pipelines').update({ name } as any).eq('id', id).eq('team_id', teamId).select('*').single();
    if (error || !data) throw error || new Error("Falha ao renomear funil.");
    return data as unknown as Pipeline;
};

export const deletePipelineFromDb = async (id: string, teamId: string): Promise<void> => {
    const { error } = await supabase.from('pipelines').delete().eq('id', id).eq('team_id', teamId);
    if (error) throw error;
};

export const addStageToDb = async (pipelineId: string, sortOrder: number): Promise<PipelineStage> => {
    const newStagePayload: TablesInsert<'pipeline_stages'> = {
        pipeline_id: pipelineId,
        name: 'Nova Etapa',
        sort_order: sortOrder,
        type: 'Intermediária'
    };
    const { data, error } = await supabase.from('pipeline_stages').insert(newStagePayload as any).select('*').single();
    if (error || !data) throw error || new Error("Falha ao adicionar etapa.");
    return data as unknown as PipelineStage;
};

export const updateStageInDb = async (id: string, updates: TablesUpdate<'pipeline_stages'>): Promise<PipelineStage> => {
    const { data, error } = await supabase.from('pipeline_stages').update(updates as any).eq('id', id).select('*').single();
    if (error || !data) throw error || new Error("Falha ao atualizar etapa.");
    return data as unknown as PipelineStage;
};

export const deleteStageFromDb = async (id: string): Promise<void> => {
    const { error } = await supabase.from('pipeline_stages').delete().eq('id', id);
    if (error) throw error;
};

export const fetchPipelines = async (teamId: string): Promise<Pipeline[]> => {
    const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Error fetching pipelines:', error);
        throw error;
    }
    
    return data as unknown as Pipeline[];
};

export const fetchStages = async (pipelineId?: string): Promise<PipelineStage[]> => {
    let query = supabase
        .from('pipeline_stages')
        .select('*')
        .order('sort_order', { ascending: true });
    
    if (pipelineId) {
        query = query.eq('pipeline_id', pipelineId);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error fetching stages:', error);
        throw error;
    }
    
    return data as unknown as PipelineStage[];
};

export const fetchContactDeals = async (contactId: string): Promise<DealWithContact[]> => {
    const { data, error } = await supabase
        .from('deals')
        .select('*, contacts(*), pipeline_stages(*), pipelines(*)')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching contact deals:', error);
        throw error;
    }
    
    return data as unknown as DealWithContact[];
};