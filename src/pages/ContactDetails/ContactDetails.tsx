import React, { useEffect, useState } from 'react';
import { Contact, DealInsert, Json, TimelineEvent, CustomFieldDefinition, DealWithContact, Pipeline, PipelineStage } from '../../types/index.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { 
  ARROW_LEFT_ICON, 
  PLUS_ICON, 
  EDIT_ICON, 
  TAG_ICON as TAG_ICON_IMPORT 
} from '../../components/icons/index.js';
import Activities from './Activities.js';
import { useAuthStore } from '../../stores/authStore.js';
import { fetchContactTimeline } from '../../services/contactService.js';
import { useUiStore } from '../../stores/uiStore.js';
import Modal from '../../components/common/Modal.js';
import DealFormModal from '../../components/common/DealFormModal.js';
import ContactCard from '../../components/common/ContactCard.js';
import { cn } from '../../lib/utils.js';

// Alias para o ícone de tag para evitar conflito de nomes
const TAG_ICON = TAG_ICON_IMPORT;

const ContactDetails: React.FC = () => {
    const { 
        pageParams, 
        setCurrentPage,
        contactDetails, 
        fetchContactDetails, 
        updateContact,
        definitions: customFieldDefs,
        deals, 
        addDeal, 
        pipelines, 
        stages,
        user,
        activeTeam
    } = useAuthStore();
    const addToast = useUiStore((state: any) => state.addToast);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [localContact, setLocalContact] = useState<Contact | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
    const [isTimelineLoading, setIsTimelineLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const loadData = async () => {
        if (pageParams.contactId && activeTeam) {
            setIsTimelineLoading(true);
            try {
                const timelineData = await fetchContactTimeline(activeTeam.id, pageParams.contactId);
                setTimelineEvents(timelineData);
            } catch (error: any) {
                console.error("Failed to load timeline:", error);
            } finally {
                setIsTimelineLoading(false);
            }
        }
    };
    
    useEffect(() => {
        const loadDetails = async () => {
            if (pageParams.contactId) {
                setIsLoading(true);
                try {
                    await fetchContactDetails(pageParams.contactId);
                    await loadData(); // Load timeline and activities
                } catch (error: any) {
                    console.error("Failed to load contact details:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadDetails();
    }, [pageParams.contactId, fetchContactDetails, activeTeam]);

    useEffect(() => {
        if (contactDetails) {
            setLocalContact(contactDetails);
        }
    }, [contactDetails]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalContact((prev: Contact | null) => prev ? { ...prev, [name]: value } : null);
    };

    const handleCustomFieldChange = (key: string, value: string | number) => {
        setLocalContact((prev: Contact | null) => {
            if (!prev) return null;
            const newCustomFields: Json = {
                ...(prev.custom_fields as object || {}),
                [key]: value
            };
            return { ...prev, custom_fields: newCustomFields };
        });
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && localContact) {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (newTag && !localContact.tags?.includes(newTag)) {
                setLocalContact({ ...localContact, tags: [...(localContact.tags || []), newTag].sort() });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        if (localContact) {
            setLocalContact({ ...localContact, tags: localContact.tags?.filter((t: string) => t !== tagToRemove) || [] });
        }
    };

    const handleSave = async () => {
        if (!localContact) return;
        setIsSaving(true);
        try {
            await updateContact(localContact);
            addToast('Contato salvo com sucesso!', 'success');
        } catch (err: any) {
            addToast(`Erro ao salvar: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDeal = async (dealData: { id?: string; name: string; value: number; stage_id: string; pipeline_id: string; }) => {
        if (!user || !pageParams.contactId || !activeTeam) return;
        try {
            await addDeal({ 
                ...dealData,
                contact_id: pageParams.contactId,
                pipeline_id: dealData.pipeline_id,
                stage_id: dealData.stage_id
            });
            setIsDealModalOpen(false);
            addToast('Negócio criado com sucesso!', 'success');
        } catch (err: any) {
            addToast(`Erro ao criar negócio: ${err.message}`, 'error');
        }
    };

    const handleEditContact = () => {
        setIsEditing(true);
    };

    const handleSaveContact = async () => {
        if (!localContact) return;
        setIsSaving(true);
        try {
            await updateContact(localContact);
            addToast('Contato atualizado com sucesso!', 'success');
            setIsEditing(false);
        } catch (err: any) {
            addToast(`Erro ao salvar: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="text-center text-foreground p-8">Carregando detalhes do contato...</div>;
    if (!contactDetails || !localContact) return <div className="text-center text-foreground p-8">Contato não encontrado.</div>;

    const contactDeals = deals.filter(d => d.contact_id === contactDetails.id);
    const defaultPipeline = pipelines[0];

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setCurrentPage('contacts')}
                        className="h-9 w-9"
                    >
                        <ARROW_LEFT_ICON className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Detalhes do Contato</h1>
                        <p className="text-sm text-muted-foreground">Visualize e gerencie as informações deste contato</p>
                    </div>
                </div>
                {!isEditing ? (
                    <Button 
                        variant="outline" 
                        onClick={handleEditContact}
                        className="gap-1.5"
                    >
                        <EDIT_ICON className="w-4 h-4" />
                        Editar Contato
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setLocalContact(contactDetails);
                                setIsEditing(false);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSaveContact} 
                            isLoading={isSaving}
                            className="gap-1.5"
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna da esquerda - Informações do Contato */}
                <div className="lg:col-span-1 space-y-4">
                    {isEditing ? (
                        <Card className="space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Editar Contato</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">Nome</label>
                                    <input 
                                        id="name" 
                                        name="name" 
                                        value={localContact.name} 
                                        onChange={(e) => setLocalContact({...localContact, name: e.target.value})} 
                                        className="w-full bg-background p-2 rounded-md text-foreground border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">Telefone</label>
                                    <input 
                                        id="phone" 
                                        name="phone" 
                                        value={localContact.phone} 
                                        onChange={(e) => setLocalContact({...localContact, phone: e.target.value})} 
                                        className="w-full bg-background p-2 rounded-md text-foreground border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">E-mail</label>
                                    <input 
                                        id="email" 
                                        name="email" 
                                        type="email"
                                        value={localContact.email || ''} 
                                        onChange={(e) => setLocalContact({...localContact, email: e.target.value})} 
                                        className="w-full bg-background p-2 rounded-md text-foreground border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="company" className="block text-sm font-medium text-muted-foreground mb-1">Empresa</label>
                                    <input 
                                        id="company" 
                                        name="company" 
                                        value={localContact.company || ''} 
                                        onChange={(e) => setLocalContact({...localContact, company: e.target.value})} 
                                        className="w-full bg-background p-2 rounded-md text-foreground border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Tags</label>
                                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[42px]">
                                        {localContact.tags?.map((tag) => (
                                            <div key={tag} className="inline-flex items-center bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                                                {tag}
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const newTags = localContact.tags?.filter(t => t !== tag) || [];
                                                        setLocalContact({...localContact, tags: newTags});
                                                    }}
                                                    className="ml-1.5 text-primary/70 hover:text-primary"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                                                    e.preventDefault();
                                                    const newTag = tagInput.trim().toLowerCase();
                                                    if (!localContact.tags?.includes(newTag)) {
                                                        const updatedTags = [...(localContact.tags || []), newTag];
                                                        setLocalContact({...localContact, tags: updatedTags});
                                                    }
                                                    setTagInput('');
                                                }
                                            }}
                                            placeholder="Adicionar tag..."
                                            className="flex-1 min-w-[100px] bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <ContactCard 
                            contact={localContact} 
                            onEdit={handleEditContact}
                            className="sticky top-4"
                        />
                    )}

                    {/* Seção de Campos Personalizados */}
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Informações Adicionais</h2>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsCustomFieldModalOpen(true)}
                                className="gap-1.5"
                            >
                                <PLUS_ICON className="w-3.5 h-3.5" />
                                Novo Campo
                            </Button>
                        </div>
                        {customFieldDefs.length > 0 ? (
                            <div className="space-y-4">
                                {customFieldDefs.map((def: CustomFieldDefinition) => {
                                    const customFields = (localContact.custom_fields || {}) as { [key: string]: any };
                                    const value = customFields[def.key] ?? '';
                                    
                                    return (
                                        <div key={def.id} className="space-y-1">
                                            <label className="block text-sm font-medium text-muted-foreground">
                                                {def.name}
                                            </label>
                                            <div className="text-sm text-foreground p-2 bg-muted/30 rounded-md">
                                                {value || <span className="text-muted-foreground/70">Não informado</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <TAG_ICON className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                                <p className="text-sm">Nenhum campo personalizado criado</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Adicione campos personalizados nas configurações</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Coluna da direita - Atividades e Negócios */}
                <div className="lg:col-span-2 space-y-6">
                    <Activities contactId={pageParams.contactId} onDataChange={loadData} />
                    
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Negócios</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsDealModalOpen(true)}
                                disabled={!defaultPipeline}
                                title={!defaultPipeline ? "Crie um funil de vendas na página 'Funil' para poder adicionar negócios." : "Adicionar Novo Negócio"}
                                className="gap-1.5"
                            >
                                <PLUS_ICON className="w-3.5 h-3.5" />
                                Novo Negócio
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {contactDeals.length > 0 ? (
                                contactDeals.map((deal: DealWithContact) => {
                                    const stage = stages.find((s: PipelineStage) => s.id === deal.stage_id);
                                    return (
                                        <div 
                                            key={deal.id} 
                                            className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                                            onClick={() => setCurrentPage('funnel', { dealId: deal.id })}
                                        >
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-medium text-foreground">{deal.name}</h3>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                    stage?.type === 'Ganho' ? 'bg-success/10 text-success' :
                                                    stage?.type === 'Perdido' ? 'bg-destructive/10 text-destructive' :
                                                    'bg-primary/10 text-primary'
                                                }`}>
                                                    {stage?.name || 'Sem estágio'}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex justify-between items-center">
                                                <span className="font-mono font-medium text-foreground">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value || 0)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Atualizado em {new Date(deal.updated_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                                        <TAG_ICON className="w-5 h-5 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-sm font-medium text-foreground">Nenhum negócio encontrado</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {defaultPipeline 
                                            ? "Adicione um novo negócio para começar"
                                            : "Crie um funil de vendas para adicionar negócios"}
                                    </p>
                                    {defaultPipeline && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="mt-4 gap-1.5"
                                            onClick={() => setIsDealModalOpen(true)}
                                        >
                                            <PLUS_ICON className="w-3.5 h-3.5" />
                                            Adicionar Negócio
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modais */}
            <Modal
                isOpen={isCustomFieldModalOpen}
                onClose={() => setIsCustomFieldModalOpen(false)}
                title="Adicionar Campo Personalizado"
            >
                <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        Crie um novo campo personalizado para este contato.
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        A funcionalidade de campos personalizados está disponível na página de configurações.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCustomFieldModalOpen(false)}>
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

            {defaultPipeline && (
                <DealFormModal
                    isOpen={isDealModalOpen}
                    onClose={() => setIsDealModalOpen(false)}
                    onSave={handleSaveDeal}
                    pipeline={defaultPipeline}
                    stages={stages.filter((s: PipelineStage) => s.pipeline_id === defaultPipeline.id)}
                    contactName={localContact.name}
                />
            )}
        </div>
    );
};

export default ContactDetails;