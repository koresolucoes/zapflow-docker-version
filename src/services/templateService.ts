import { supabase } from '../lib/supabaseClient.js';
import { MessageTemplate, MessageTemplateInsert, MetaConfig, TemplateCategory, TemplateStatus } from '../types/index.js';
import { TablesInsert, Json } from '@/src/types/database.types.js';
import { createMetaTemplate } from './meta/templates.js';
import { MetaTemplateComponent } from './meta/types.js';

const addTemplateToDb = async (template: MessageTemplateInsert): Promise<MessageTemplate> => {
    const dbTemplate: TablesInsert<'message_templates'> = {
        ...template,
        components: template.components as unknown as Json,
    };
    
    const { data, error } = await supabase
      .from('message_templates')
      .insert(dbTemplate as any)
      .select()
      .single();

    if (error) throw error;
    
    const newTemplateData = data as any;
    return {
        ...newTemplateData,
        category: newTemplateData.category as TemplateCategory,
        status: newTemplateData.status as TemplateStatus,
        components: (newTemplateData.components as unknown as MetaTemplateComponent[]) || []
    };
};

export const createTemplateOnMetaAndDb = async (
    metaConfig: MetaConfig,
    templateData: Omit<MessageTemplateInsert, 'id' | 'team_id' | 'created_at' | 'status' | 'meta_id'>,
    teamId: string
): Promise<MessageTemplate> => {
    // 1. Create on Meta platform
    const metaResult = await createMetaTemplate(metaConfig, {
        templateName: templateData.template_name,
        category: templateData.category,
        components: templateData.components
    });

    // 2. Prepare for our DB
    const templateForDb: MessageTemplateInsert = {
        ...templateData,
        team_id: teamId,
        meta_id: metaResult.id,
        status: 'PENDING'
    };
    
    // 3. Insert into our DB
    return addTemplateToDb(templateForDb);
};
