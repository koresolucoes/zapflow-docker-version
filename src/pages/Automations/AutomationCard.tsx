import React, { useMemo } from 'react';
import { Automation } from '../../types/index.js';
import { Card } from '../../components/common/Card.js';
import Switch from '../../components/common/Switch.js';
import { Button } from '../../components/common/Button.js';
import { TRASH_ICON, EDIT_ICON } from '../../components/icons/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';

interface AutomationCardProps {
    automation: Automation;
}

const AutomationCard: React.FC<AutomationCardProps> = ({ automation }) => {
    const { updateAutomation, deleteAutomation, setCurrentPage } = useAuthStore();
    const { showConfirmation, addToast } = useUiStore();

    const handleStatusChange = async (checked: boolean) => {
        await updateAutomation({ ...automation, status: checked ? 'active' : 'paused' });
    };

    const handleDelete = async () => {
        showConfirmation(
            'Excluir Automação',
            `Tem certeza que deseja excluir a automação "${automation.name}"?`,
            async () => {
                try {
                    await deleteAutomation(automation.id);
                    addToast('Automação excluída com sucesso.', 'success');
                } catch (err: any) {
                    addToast(`Erro ao excluir automação: ${err.message}`, 'error');
                }
            }
        );
    };
    
    const handleEdit = () => {
        setCurrentPage('automation-editor', { automationId: automation.id });
    };

    const description = useMemo(() => {
        const nodes = Array.isArray(automation.nodes) ? automation.nodes : [];
        const triggerNode = nodes.find(n => n.data.nodeType === 'trigger');
        
        if (!triggerNode) return "Automação sem gatilho.";

        return `Inicia com "${triggerNode.data.label}" e tem ${nodes.length} etapa(s).`;
    }, [automation]);

    return (
        <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-md dark:hover:shadow-sky-500/10 hover:-translate-y-0.5">
            <div className="flex-1 flex flex-col p-6">
                <div className="flex justify-between items-start gap-3 mb-4">
                    <h3 className="text-lg font-medium text-foreground line-clamp-2">
                        {automation.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {automation.status === 'active' ? 'Ativo' : 'Pausado'}
                        </span>
                        <Switch 
                            checked={automation.status === 'active'} 
                            onChange={handleStatusChange} 
                        />
                    </div>
                </div>
                
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">{description}</p>
                    
                    <div className="bg-muted/30 dark:bg-slate-800/30 p-3 rounded-md text-sm">
                        <p className="font-medium text-foreground">Detalhes da Automação</p>
                        <div className="mt-2 space-y-1 text-muted-foreground">
                            <p>• {new Date(automation.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDelete} 
                        className="text-destructive hover:bg-destructive/10"
                    >
                        <TRASH_ICON className="w-4 h-4 mr-2" />
                        Excluir
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleEdit}
                        className="ml-auto"
                    >
                        <EDIT_ICON className="w-4 h-4 mr-2" />
                        Editar
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default AutomationCard;