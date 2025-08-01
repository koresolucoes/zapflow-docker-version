import { supabase } from '../lib/supabaseClient.js';
import { CustomFieldDefinition, CustomFieldDefinitionInsert } from '../types/index.js';

export const getCustomFieldDefinitions = async (teamId: string): Promise<CustomFieldDefinition[]> => {
    const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('team_id', teamId);
    
    if (error) {
        console.error('Error fetching custom field definitions:', error);
        throw error;
    }
    
    return data as unknown as CustomFieldDefinition[];
};

export const addCustomFieldDefinition = async (teamId: string, definition: Omit<CustomFieldDefinitionInsert, 'team_id' | 'id' | 'created_at'>): Promise<CustomFieldDefinition> => {
    const { data, error } = await supabase
        .from('custom_field_definitions')
        .insert({ ...definition, team_id: teamId } as any)
        .select()
        .single();
    if (error) {
        if (error.code === '23505') { // unique_violation
            throw new Error('A chave do campo já existe. Por favor, escolha uma chave única.');
        }
        throw error;
    };
    return data as unknown as CustomFieldDefinition;
};

export const deleteCustomFieldDefinition = async (id: string, teamId: string): Promise<void> => {
    const { error } = await supabase
        .from('custom_field_definitions')
        .delete()
        .eq('id', id)
        .eq('team_id', teamId);
    if (error) throw error;
};