import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Contact, DealInsert, Json, TimelineEvent, CustomFieldDefinition, DealWithContact, Pipeline, PipelineStage } from '../../types/index.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { 
  ARROW_LEFT_ICON, 
  PLUS_ICON, 
  EDIT_ICON,
  TAG_ICON
} from '../../components/icons/index.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import Activities from './Activities.js';
import Modal from '../../components/common/Modal.js';
import DealFormModal from '../../components/common/DealFormModal.js';
import ContactCard from '../../components/common/ContactCard.js';
import { fetchContactTimeline } from '../../services/contactService.js';
import { fetchPipelines, fetchStages, fetchContactDeals } from '../../services/funnelService.js';
import { getCustomFieldDefinitions } from '../../services/customFieldService.js';

// Função auxiliar para formatar moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função auxiliar para obter o nome do estágio
const getStageName = (stageId: string, stages: PipelineStage[]): string => {
  const stage = stages.find(s => s.id === stageId);
  return stage?.name || 'Sem estágio';
};

const ContactDetails: React.FC = () => {
    const { 
        activeTeam, 
        setCurrentPage, 
        fetchContactDetails, 
        updateContact, 
        addDeal,
        contactDetails: storeContactDetails,
        deals,
        pipelines,
        stages,
        user,
        definitions: customFieldDefs,
        setPipelines,
        setStages,
        setDefinitions,
        setDeals,
        pageParams  // Get pageParams from auth store
    } = useAuthStore();
    const { addToast } = useUiStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get contactId from pageParams
    const contactId = pageParams?.contactId;
    
    const [localContact, setLocalContact] = useState<Contact | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
    const [isTimelineLoading, setIsTimelineLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'activities' | 'deals'>('activities');

    // Referência para a seção de atividades
    const activitiesSectionRef = React.useRef<HTMLDivElement>(null);
    
    // Função para rolar até a seção de atividades
    const scrollToActivities = () => {
        activitiesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Reset loading state when contactId changes
    useEffect(() => {
        if (contactId && activeTeam) {
            setIsLoading(true);
            setError(null);
            console.log('Contact ID found:', contactId);
        } else {
            console.error('Contact ID is missing or no active team');
            setError(contactId ? 'Nenhum time ativo selecionado' : 'ID do contato não encontrado');
            setIsLoading(false);
        }
    }, [contactId, activeTeam]);

    // Carregar detalhes do contato
    useEffect(() => {
        let isMounted = true;
        
        const loadContactDetails = async () => {
            if (!contactId || !activeTeam) {
                if (!contactId) {
                    console.error('Contact ID is missing');
                    setError('ID do contato não encontrado');
                }
                if (!activeTeam) {
                    console.error('No active team');
                    setError('Nenhum time ativo selecionado');
                }
                if (isMounted) {
                    setIsLoading(false);
                }
                return;
            }
            
            console.log('ContactDetails: Starting to load contact details for', contactId);
            
            try {
                // Fetch contact details first
                console.log('ContactDetails: Fetching contact details');
                await fetchContactDetails(contactId);
                
                // Then fetch other data in parallel
                console.log('ContactDetails: Fetching additional data in parallel');
                const [pipelinesData, stagesData, customFields, contactDeals] = await Promise.all([
                    fetchPipelines(activeTeam.id).catch(e => {
                        console.error('Error fetching pipelines:', e);
                        return null;
                    }),
                    fetchStages().catch(e => {
                        console.error('Error fetching stages:', e);
                        return null;
                    }),
                    getCustomFieldDefinitions(activeTeam.id).catch(e => {
                        console.error('Error fetching custom fields:', e);
                        return null;
                    }),
                    fetchContactDeals(contactId).catch(e => {
                        console.error('Error fetching contact deals:', e);
                        return [];
                    })
                ]);

                if (!isMounted) return;

                console.log('ContactDetails: Data fetched', { 
                    pipelinesData: !!pipelinesData, 
                    stagesData: !!stagesData, 
                    customFields: !!customFields,
                    contactDeals: !!contactDeals
                });

                // Update state with fetched data
                if (pipelinesData) {
                    console.log('ContactDetails: Setting pipelines');
                    setPipelines(pipelinesData);
                }
                if (stagesData) {
                    console.log('ContactDetails: Setting stages');
                    setStages(stagesData);
                }
                if (customFields) {
                    console.log('ContactDetails: Setting custom fields');
                    setDefinitions(customFields);
                }
                if (contactDeals) {
                    console.log('ContactDetails: Setting contact deals');
                    setDeals(contactDeals);
                }

                // Finally, fetch the timeline
                console.log('ContactDetails: Fetching timeline');
                const timeline = await fetchContactTimeline(activeTeam.id, contactId).catch(e => {
                    console.error('Error fetching timeline:', e);
                    return [];
                });
                
                if (isMounted) {
                    console.log('ContactDetails: Timeline fetched', { timelineLength: timeline.length });
                    setTimelineEvents(timeline);
                }
                
            } catch (error) {
                console.error('ContactDetails: Error loading contact details:', error);
                if (isMounted) {
                    setError('Erro ao carregar detalhes do contato');
                    addToast('Erro ao carregar detalhes do contato', 'error');
                }
            } finally {
                if (isMounted) {
                    console.log('ContactDetails: Finished loading, setting loading to false');
                    setIsLoading(false);
                    setIsTimelineLoading(false);
                }
            }
        };

        loadContactDetails();
        
        return () => {
            isMounted = false;
        };
    }, [contactId, activeTeam, fetchContactDetails, addToast, setPipelines, setStages, setDefinitions, setDeals]);

    // Sincronizar localContact com storeContactDetails
    useEffect(() => {
        if (storeContactDetails) {
            setLocalContact(storeContactDetails);
        }
    }, [storeContactDetails]);

    // Função para lidar com mudanças nos campos personalizados
    const handleCustomFieldChange = (fieldKey: string, value: string | number) => {
        if (!localContact) return;
        
        setLocalContact({
            ...localContact,
            custom_fields: {
                ...(localContact.custom_fields || {}),
                [fieldKey]: value
            } as Json
        });
    };

    // Função para lidar com o salvamento do contato
    const handleSaveContact = async () => {
        if (!localContact) return;
        
        setIsSaving(true);
        try {
            await updateContact(localContact);
            addToast('Contato atualizado com sucesso!', 'success');
            setIsEditing(false);
        } catch (error) {
            console.error('Erro ao salvar contato:', error);
            addToast('Erro ao salvar contato', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Função para lidar com a adição de tags
    const handleAddTag = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim() && localContact) {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            const currentTags = localContact.tags || [];
            
            if (!currentTags.includes(newTag)) {
                const updatedTags = [...currentTags, newTag];
                const updatedContact = {
                    ...localContact,
                    tags: updatedTags
                };
                
                setLocalContact(updatedContact);
                
                // Se não estiver no modo de edição, salva automaticamente
                if (!isEditing) {
                    try {
                        await updateContact(updatedContact);
                        addToast('Tag adicionada com sucesso!', 'success');
                    } catch (error) {
                        console.error('Erro ao adicionar tag:', error);
                        addToast('Erro ao adicionar tag', 'error');
                        // Reverte a alteração em caso de erro
                        setLocalContact(localContact);
                    }
                }
            }
            
            setTagInput('');
        }
    };

    // Função para lidar com a remoção de tags
    const handleRemoveTag = async (tagToRemove: string) => {
        if (!localContact) return;
        
        const currentTags = localContact.tags || [];
        const newTags = currentTags.filter(tag => tag !== tagToRemove);
        const updatedContact = {
            ...localContact,
            tags: newTags
        };
        
        setLocalContact(updatedContact);
        
        // Se não estiver no modo de edição, salva automaticamente
        if (!isEditing) {
            try {
                await updateContact(updatedContact);
                addToast('Tag removida com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao remover tag:', error);
                addToast('Erro ao remover tag', 'error');
                // Reverte a alteração em caso de erro
                setLocalContact(localContact);
            }
        }
    };

    // Renderização dos campos personalizados
    const renderCustomFieldsSection = () => {
        if (!customFieldDefs || customFieldDefs.length === 0 || !localContact) {
            return (
                <div className="text-center py-4 text-muted-foreground">
                    <p>Nenhum campo personalizado configurado.</p>
                    <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => setCurrentPage('settings', { tab: 'custom-fields' })}
                    >
                        Configurar campos personalizados
                    </Button>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {customFieldDefs.map((field) => {
                    const fieldValue = localContact.custom_fields?.[field.key];
                    const isNumberField = field.type === 'NUMERO';
                    
                    return (
                        <div key={field.id} className="space-y-1.5">
                            <label className="block text-sm font-medium text-muted-foreground">
                                {field.name}
                            </label>
                            {isNumberField ? (
                                <input
                                    type="number"
                                    value={typeof fieldValue === 'number' ? fieldValue : ''}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        handleCustomFieldChange(field.key, value);
                                    }}
                                    className="w-full bg-background p-2 rounded-md text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    placeholder={`Digite ${field.name.toLowerCase()}`}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={fieldValue?.toString() || ''}
                                    onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                                    className="w-full bg-background p-2 rounded-md text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    placeholder={`Digite ${field.name.toLowerCase()}`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Renderização do conteúdo da aba de atividades
    const renderActivitiesTab = () => {
        if (!contactId || !activeTeam) return null;
        
        return (
            <div className="space-y-4" ref={activitiesSectionRef}>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">Atividades</h2>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                            // Rola para a seção de atividades e destaca o formulário
                            scrollToActivities();
                            // Se estiver em uma visualização móvel, pode ser necessário um pequeno atraso
                            setTimeout(() => {
                                const noteInput = document.getElementById('note-content');
                                if (noteInput) {
                                    noteInput.focus();
                                }
                            }, 500);
                        }}
                    >
                        <PLUS_ICON className="w-4 h-4 mr-2" />
                        Nova Interação
                    </Button>
                </div>
                
                <Activities 
                    contactId={contactId} 
                    onDataChange={async () => {
                        try {
                            const updatedTimeline = await fetchContactTimeline(activeTeam.id, contactId);
                            setTimelineEvents(updatedTimeline);
                        } catch (error) {
                            console.error('Erro ao atualizar timeline:', error);
                            addToast('Erro ao atualizar atividades', 'error');
                        }
                    }} 
                />
            </div>
        );
    };

    // Renderização do conteúdo da aba de negócios
    const renderDealsTab = () => {
        if (!deals || deals.length === 0) {
            return (
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">Nenhum negócio encontrado para este contato</p>
                    <Button 
                        variant="outline" 
                        className="mt-4 mx-auto gap-1.5"
                        onClick={() => setIsDealModalOpen(true)}
                    >
                        <PLUS_ICON className="w-3.5 h-3.5" />
                        Criar Primeiro Negócio
                    </Button>
                </Card>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deals.map((deal) => (
                    <Card 
                        key={deal.id} 
                        className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => setCurrentPage('funnel', { dealId: deal.id })}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="font-medium text-foreground">{deal.name}</h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {getStageName(deal.stage_id, stages)}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Valor: {formatCurrency(deal.value || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Atualizado em {format(new Date(deal.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                    </Card>
                ))}
            </div>
        );
    };

    // Handle save deal
    const handleSaveDeal = async (dealData: any) => {
        if (!contactId) return;
        
        try {
            await addDeal({
                ...dealData,
                contact_id: contactId,
                pipeline_id: dealData.pipeline_id,
                stage_id: dealData.stage_id
            });
            
            // Atualizar a lista de negócios após adicionar um novo
            const updatedDeals = await fetchContactDeals(contactId);
            setDeals(updatedDeals);
            
            setIsDealModalOpen(false);
            addToast('Negócio criado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao criar negócio:', error);
            addToast('Erro ao criar negócio', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <span className="text-gray-600">Carregando detalhes do contato...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <div className="text-red-500 mb-4">{error}</div>
                <Button 
                    onClick={() => setCurrentPage('contacts')}
                    className="mt-4"
                >
                    Voltar para contatos
                </Button>
            </div>
        );
    }

    if (!localContact) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600 mb-4">Nenhum contato encontrado.</p>
                <Button 
                    onClick={() => setCurrentPage('contacts')}
                    className="mt-4"
                >
                    Voltar para contatos
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-6xl">
            <div className="flex flex-col space-y-6">
                {/* Cabeçalho e botões de ação */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(-1)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <ARROW_LEFT_ICON className="h-5 w-5" />
                            <span className="sr-only">Voltar</span>
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {isEditing ? 'Editar Contato' : 'Detalhes do Contato'}
                        </h1>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {isEditing ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setLocalContact(storeContactDetails);
                                    }}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleSaveContact}
                                    disabled={isSaving}
                                    isLoading={isSaving}
                                >
                                    Salvar Alterações
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsEditing(true)}
                                >
                                    <EDIT_ICON className="w-4 h-4 mr-2" />
                                    Editar
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => setIsDealModalOpen(true)}
                                >
                                    <PLUS_ICON className="w-4 h-4 mr-2" />
                                    Novo Negócio
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Conteúdo principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna da esquerda - Informações do contato */}
                    <div className="space-y-6 lg:col-span-1">
                        <ContactCard 
                            contact={localContact} 
                            onEdit={isEditing ? undefined : () => setIsEditing(true)}
                            className={isEditing ? 'border-2 border-primary' : ''}
                        />
                        
                        {/* Tags */}
                        <Card className="p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-medium text-foreground">Tags</h3>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {localContact?.tags?.map((tag) => (
                                        <span 
                                            key={tag} 
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                        >
                                            {tag}
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary hover:bg-primary/30 focus:outline-none"
                                            >
                                                <span className="sr-only">Remover tag</span>
                                                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                                                    <path fillRule="evenodd" d="M4 3.293l2.146-2.147a.5.5 0 01.708.708L4.707 4l2.147 2.146a.5.5 0 01-.708.708L4 4.707l-2.146 2.147a.5.5 0 01-.708-.708L3.293 4 1.146 1.854a.5.5 0 01.708-.708L4 3.293z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))}
                                    {(!localContact?.tags || localContact.tags.length === 0) && (
                                        <p className="text-sm text-muted-foreground">Nenhuma tag adicionada</p>
                                    )}
                                </div>
                                
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder="Adicione tags..."
                                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    />
                                    <span className="absolute right-2 top-2 text-xs text-muted-foreground">
                                        Pressione Enter ou vírgula
                                    </span>
                                </div>
                            </div>
                        </Card>
                        
                        {/* Campos personalizados */}
                        <Card className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium text-foreground">Campos Personalizados</h3>
                                {isEditing && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setIsCustomFieldModalOpen(true)}
                                    >
                                        <PLUS_ICON className="w-4 h-4 mr-1" />
                                        Adicionar
                                    </Button>
                                )}
                            </div>
                            {renderCustomFieldsSection()}
                        </Card>
                    </div>
                    
                    {/* Coluna da direita - Abas de atividades e negócios */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Abas */}
                        <div className="border-b">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('activities')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'activities'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                                    }`}
                                >
                                    Atividades
                                </button>
                                <button
                                    onClick={() => setActiveTab('deals')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'deals'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                                    }`}
                                >
                                    Negócios
                                </button>
                            </nav>
                        </div>
                        
                        {/* Conteúdo das abas */}
                        <div className="pt-2">
                            {activeTab === 'activities' ? renderActivitiesTab() : renderDealsTab()}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Modais */}
            <Modal 
                isOpen={isCustomFieldModalOpen} 
                onClose={() => setIsCustomFieldModalOpen(false)}
                title="Adicionar Campo Personalizado"
            >
                <div className="p-6">
                    <p className="text-muted-foreground mb-4">
                        Os campos personalizados podem ser configurados nas configurações do sistema.
                    </p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsCustomFieldModalOpen(false)}
                        >
                            Fechar
                        </Button>
                        <Button 
                            onClick={() => {
                                setIsCustomFieldModalOpen(false);
                                setCurrentPage('settings', { tab: 'custom-fields' });
                            }}
                        >
                            Ir para Configurações
                        </Button>
                    </div>
                </div>
            </Modal>
            
            <DealFormModal
                isOpen={isDealModalOpen}
                onClose={() => setIsDealModalOpen(false)}
                onSave={handleSaveDeal}
                pipeline={pipelines[0]}
                stages={stages.filter(s => s.pipeline_id === pipelines[0]?.id)}
                contactName={localContact?.name || 'Novo Contato'}
            />
        </div>
    );
};

export default ContactDetails;