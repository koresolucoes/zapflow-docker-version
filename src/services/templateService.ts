import { apiGet, apiPost } from '../lib/apiClient.js';
import { MessageTemplate, MessageTemplateInsert, MetaConfig } from '../types/index.js';
import { createMetaTemplate } from './meta/templates.js';

export const fetchTemplates = async (): Promise<MessageTemplate[]> => {
    return await apiGet<MessageTemplate[]>('/templates');
};

const addTemplateToDb = async (template: MessageTemplateInsert): Promise<MessageTemplate> => {
    return await apiPost<MessageTemplate>('/templates', template);
};

export const createTemplateOnMetaAndDb = async (
    metaConfig: MetaConfig,
    templateData: Omit<MessageTemplateInsert, 'id' | 'team_id' | 'created_at' | 'status' | 'meta_id'>,
    teamId: string
): Promise<MessageTemplate> => {
    // TODO: This logic should ideally live on the backend.
    // The frontend should not be responsible for two separate API calls (one to Meta, one to our backend)
    // and should not have access to the Meta access token.
    // A better architecture would be a single POST /api/templates endpoint that handles both.

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
        status: 'PENDING',
        content: templateData.content || '', // Ensure content is not undefined
        components: templateData.components || [],
    };
    
    // 3. Insert into our DB via our API
    return addTemplateToDb(templateForDb);
};
