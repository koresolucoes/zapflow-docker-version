import React, { useState, useMemo } from 'react';
import { MessageTemplate, TemplateCategory, TemplateStatus } from '../../types/index.js';
import type { TablesInsert } from '../../types/database.types.js';
import { getMetaTemplates } from '../../services/meta/templates.js';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { SPARKLES_ICON, SEARCH_ICON } from '../../components/icons/index.js';
import { Json } from '../../types/database.types.js';
import { useAuthStore, useMetaConfig } from '../../stores/authStore.js';
import { MetaTemplateComponent } from '../../services/meta/types.js';

const StatusBadge: React.FC<{ status: MessageTemplate['status'] }> = ({ status }) => {
    const statusStyles: Record<TemplateStatus, string> = {
        APPROVED: 'bg-success/10 text-success border-success/50',
        PENDING: 'bg-warning/10 text-warning border-warning/50',
        REJECTED: 'bg-destructive/10 text-destructive border-destructive/50',
        PAUSED: 'bg-muted/10 text-muted-foreground border-muted/50',
        LOCAL: 'bg-primary/10 text-primary border-primary/50',
    };
    const style = status ? statusStyles[status] : statusStyles.LOCAL;
    const text = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Local';
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${style}`}>{text}</span>;
};

const TemplateCard: React.FC<{ template: MessageTemplate; onUse: () => void }> = ({ template, onUse }) => {
    const isUsable = template.status === 'APPROVED';

    const header = useMemo(() => template.components.find(c => c.type === 'HEADER'), [template.components]);
    const body = useMemo(() => template.components.find(c => c.type === 'BODY'), [template.components]);
    const footer = useMemo(() => template.components.find(c => c.type === 'FOOTER'), [template.components]);

    return (
        <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-md dark:hover:shadow-sky-500/10 hover:-translate-y-0.5">
            <div className="flex-1 flex flex-col p-6">
                <div className="flex justify-between items-start gap-3 mb-4">
                    <h3 className="text-lg font-medium text-foreground line-clamp-2">
                        {template.template_name}
                    </h3>
                    <div className="flex-shrink-0">
                        <StatusBadge status={template.status} />
                    </div>
                </div>
                
                <div className="flex-1 space-y-3">
                    {header?.text && (
                        <div className="bg-muted/50 dark:bg-slate-800/50 p-3 rounded-md">
                            <p className="font-medium text-foreground line-clamp-2">{header.text}</p>
                        </div>
                    )}
                    
                    {body?.text && (
                        <div className="bg-muted/30 dark:bg-slate-800/30 p-3 rounded-md">
                            <p className="line-clamp-4 text-sm">{body.text}</p>
                        </div>
                    )}
                    
                    {footer?.text && (
                        <div className="text-xs text-muted-foreground mt-2">
                            <p className="line-clamp-1">{footer.text}</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                    <Button 
                        variant={isUsable ? "default" : "outline"}
                        size="sm" 
                        onClick={onUse} 
                        disabled={!isUsable} 
                        className="w-full"
                        title={!isUsable ? "Apenas templates APROVADOS podem ser usados" : "Usar este template"}
                    >
                        {isUsable ? 'Usar Template' : 'Indisponível'}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

const Templates: React.FC = () => {
  const { templates, setTemplates, setCurrentPage, user, activeTeam } = useAuthStore();
  const metaConfig = useMetaConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;
    const lowercasedTerm = searchTerm.toLowerCase();
    return templates.filter(template =>
        template.template_name.toLowerCase().includes(lowercasedTerm) ||
        (template.components?.some(c => c.text?.toLowerCase().includes(lowercasedTerm)) ?? false)
    );
  }, [templates, searchTerm]);
  
  const handleUseTemplate = (templateId: string) => {
    setCurrentPage('new-campaign', { templateId });
  };

  const handleSync = async () => {
    if (!metaConfig.wabaId || !metaConfig.accessToken || !user || !activeTeam) {
        setError("Por favor, configure suas credenciais da Meta na página de Configurações e verifique se uma equipa está ativa.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setSyncMessage(null);
    try {
        // 1. Obter templates da Meta
        const metaTemplates = await getMetaTemplates(metaConfig);

        // 2. Obter templates existentes do nosso BD
        const { data: dbTemplatesData, error: dbError } = await supabase
            .from('message_templates')
            .select('id, meta_id, template_name, status, category, components')
            .eq('team_id', activeTeam.id);
        
        if (dbError) throw dbError;

        const dbTemplatesMap = new Map((dbTemplatesData as any[]).map(t => [t.meta_id, t]));

        const templatesToInsert: any[] = [];
        const updatePromises: any[] = [];

        // 3. Comparar e preparar inserções/atualizações
        for (const metaTemplate of metaTemplates) {
            const existingTemplate = dbTemplatesMap.get(metaTemplate.id);
            const templatePayload = {
                meta_id: metaTemplate.id,
                team_id: activeTeam.id,
                template_name: metaTemplate.name,
                status: metaTemplate.status as TemplateStatus,
                category: metaTemplate.category as TemplateCategory,
                components: metaTemplate.components as unknown as Json,
            };

            if (existingTemplate) {
                // É uma atualização. Verificar se algo realmente mudou.
                if (
                    existingTemplate.template_name !== templatePayload.template_name ||
                    existingTemplate.status !== templatePayload.status ||
                    existingTemplate.category !== templatePayload.category ||
                    JSON.stringify(existingTemplate.components) !== JSON.stringify(templatePayload.components)
                ) {
                    const { team_id, ...updatePayload } = templatePayload;
                    const promise = supabase
                        .from('message_templates')
                        .update(updatePayload)
                        .eq('id', existingTemplate.id);
                    updatePromises.push(promise);
                }
            } else {
                // É uma inserção
                templatesToInsert.push(templatePayload);
            }
        }
        
        // 4. Executar operações no BD
        if (templatesToInsert.length > 0) {
            const { error: insertError } = await supabase.from('message_templates').insert(templatesToInsert as any);
            if (insertError) throw insertError;
        }

        if (updatePromises.length > 0) {
            const results = await Promise.all(updatePromises);
            const firstError = results.find(res => res.error);
            if (firstError) throw firstError.error;
        }

        // 5. Rebuscar todos os templates para atualizar o estado da UI
        const { data: finalDbTemplates, error: refetchError } = await supabase
            .from('message_templates')
            .select('id, meta_id, team_id, template_name, status, category, components, created_at')
            .eq('team_id', activeTeam.id)
            .order('created_at', { ascending: false });

        if (refetchError) throw refetchError;
        
        const typedTemplates = ((finalDbTemplates as any[]) || []).map(t => ({
            ...t,
            category: t.category as TemplateCategory,
            status: t.status as TemplateStatus,
            components: (t.components as unknown as MetaTemplateComponent[]) || []
        })) as MessageTemplate[];

        setTemplates(typedTemplates);
        setSyncMessage("Sincronização concluída! Os status dos templates foram atualizados.");
        setTimeout(() => setSyncMessage(null), 4000);

    } catch(err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Templates de Mensagem</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seus modelos de mensagem para campanhas e automações
          </p>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <SEARCH_ICON className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSync} 
              isLoading={isLoading}
              className="whitespace-nowrap"
            >
              Sincronizar com Meta
            </Button>
            <Button 
              variant="default" 
              onClick={() => setCurrentPage('template-editor')}
              className="whitespace-nowrap"
            >
              <SPARKLES_ICON className="w-4 h-4 mr-2" />
              Criar com IA
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-l-4 border-destructive/60">
          <div className="p-4">
            <p className="text-destructive">{error}</p>
          </div>
        </Card>
      )}
      
      {syncMessage && (
        <Card className="border-l-4 border-success/60">
          <div className="p-4">
            <p className="text-success">{syncMessage}</p>
          </div>
        </Card>
      )}
      
      {filteredTemplates.length === 0 ? (
        <Card className="text-center p-8 border-dashed">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <SPARKLES_ICON className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template criado'}
          </h2>
          <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? `Sua busca por "${searchTerm}" não retornou resultados.` 
              : 'Crie seu primeiro template para começar a usá-lo em suas campanhas e automações.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={handleSync} 
              isLoading={isLoading}
              className="whitespace-nowrap"
            >
              Sincronizar com Meta
            </Button>
            <Button 
              variant="default" 
              onClick={() => setCurrentPage('template-editor')}
              size="lg"
            >
              <SPARKLES_ICON className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard 
              key={template.id} 
              template={template} 
              onUse={() => handleUseTemplate(template.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Templates;