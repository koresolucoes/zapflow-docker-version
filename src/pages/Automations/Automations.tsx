import React, { useState, useMemo } from 'react';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { PLUS_ICON, AUTOMATION_ICON, SEARCH_ICON } from '../../components/icons/index.js';
import AutomationCard from './AutomationCard.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const Automations: React.FC = () => {
    const { automations, createAndNavigateToAutomation } = useAuthStore();
    const addToast = useUiStore(state => state.addToast);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAutomations = useMemo(() => {
        if (!searchTerm) return automations;
        const lowercasedTerm = searchTerm.toLowerCase();
        return automations.filter(automation =>
            automation.name.toLowerCase().includes(lowercasedTerm)
        );
    }, [automations, searchTerm]);

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            await createAndNavigateToAutomation();
        } catch (error: any) {
            console.error("Falha ao criar automação:", error);
            addToast(`Não foi possível criar a automação: ${error.message}`, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Automações</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie seus fluxos de automação e automatize tarefas repetitivas
                    </p>
                </div>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-64">
                        <SEARCH_ICON className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar automações..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm"
                        />
                    </div>
                    <Button 
                        variant="default" 
                        onClick={handleCreate} 
                        isLoading={isCreating}
                        className="whitespace-nowrap"
                    >
                        <PLUS_ICON className="w-4 h-4 mr-2" />
                        Nova Automação
                    </Button>
                </div>
            </div>
      
            {filteredAutomations.length === 0 ? (
                <Card className="text-center p-8 border-dashed">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <AUTOMATION_ICON className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-foreground">
                        {searchTerm ? 'Nenhuma automação encontrada' : 'Nenhuma automação criada'}
                    </h2>
                    <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
                        {searchTerm 
                            ? `Sua busca por "${searchTerm}" não retornou resultados.` 
                            : 'Comece criando uma nova automação para automatizar seus fluxos de trabalho.'}
                    </p>
                    <Button 
                        variant="default" 
                        onClick={handleCreate} 
                        isLoading={isCreating}
                        size="lg"
                    >
                        <PLUS_ICON className="w-4 h-4 mr-2" />
                        Criar Primeira Automação
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAutomations.map(automation => (
                        <AutomationCard
                            key={automation.id}
                            automation={automation}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Automations;