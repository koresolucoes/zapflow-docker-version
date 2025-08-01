import React, { useState, useEffect } from 'react';
import { Contact, DealInsert } from '../../types/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Button } from '../../components/common/Button.js';
import DealFormModal from '../../components/common/DealFormModal.js';
import AddCustomFieldModal from '../../components/common/AddCustomFieldModal.js';
import { PLUS_ICON, X_ICON } from '../../components/icons/index.js';
import ActivityItem from '../ContactDetails/ActivityItem.js';
import { cn } from '../../lib/utils.js';

const InfoRow: React.FC<{ label: string, value: string | null | undefined }> = ({ label, value }) => (
    <div>
        <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</h4>
        <p className="text-sm text-foreground truncate">{value || '-'}</p>
    </div>
);

const Tag: React.FC<{ children: React.ReactNode, onRemove: () => void }> = ({ children, onRemove }) => (
    <span className="flex items-center mr-2 mb-2 px-2 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary-foreground">
        {children}
        <button 
            type="button" 
            onClick={onRemove} 
            className="ml-1.5 p-0.5 rounded-full text-primary-foreground/70 hover:bg-foreground/10"
            aria-label="Remover tag"
        >
            <X_ICON className="w-3 h-3" />
        </button>
    </span>
);

const ContactPanel: React.FC<{ contactId: string }> = ({ contactId }) => {
    const { 
        contacts, 
        updateContact,
        deals, 
        addDeal, 
        pipelines, 
        stages,
        definitions,
        setCurrentPage,
        activitiesForContact, 
        fetchActivitiesForContact, 
        activityLoading,
        user,
        activeTeam,
        conversations,
        allTeamMembers,
        assignConversation
    } = useAuthStore();

    const [localContact, setLocalContact] = useState<Contact | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);

    const contact = contacts.find(c => c.id === contactId);
    const conversation = conversations.find(c => c.contact.id === contactId);
    
    useEffect(() => {
        setLocalContact(contact || null);
    }, [contact]);
    
    useEffect(() => {
        if (contactId) {
            fetchActivitiesForContact(contactId);
        }
    }, [contactId, fetchActivitiesForContact]);


    const contactDeals = deals.filter(d => d.contact_id === contactId);
    const defaultPipeline = pipelines[0];

    if (!contact || !localContact) {
        return <aside className="w-96 flex-shrink-0 bg-card border-l border-border" />;
    }

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
            setLocalContact({ ...localContact, tags: localContact.tags?.filter(t => t !== tagToRemove) || [] });
        }
    };

    const handleSaveChanges = async () => {
        if (!localContact) return;
        setIsSaving(true);
        try {
            await updateContact(localContact);
        } catch (error: any) {
            alert(`Falha ao salvar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDeal = async (dealData: { id?: string; name: string; value: number; stage_id: string; pipeline_id: string; }) => {
        if (!user || !activeTeam) return;
        try {
            await addDeal({
                ...dealData,
                contact_id: contactId,
                pipeline_id: dealData.pipeline_id,
                stage_id: dealData.stage_id
            });
            setIsDealModalOpen(false);
        } catch(err: any) {
            alert(`Erro ao criar negócio: ${err.message}`);
        }
    };

    const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const assigneeId = e.target.value === 'null' ? null : e.target.value;
        try {
            await assignConversation(contactId, assigneeId);
        } catch (error) {
            alert(`Falha ao atribuir a conversa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    };

    const hasChanges = JSON.stringify(contact) !== JSON.stringify(localContact);
    
    const handleActivityDataChange = () => {
        fetchActivitiesForContact(contactId);
    };

    return (
        <>
            <aside className="w-96 flex-shrink-0 bg-card border-l border-border flex flex-col p-4 overflow-y-auto">
                <div className="text-center mb-4">
                    <img
                        className="h-20 w-20 rounded-full object-cover mx-auto border border-border"
                        src={`https://api.dicebear.com/8.x/initials/svg?seed=${contact.name}`}
                        alt="Avatar"
                    />
                    <h3 className="text-xl font-bold text-foreground mt-2">{contact.name}</h3>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-1" 
                        onClick={() => setCurrentPage('contact-details', { contactId })}
                    >
                        Ver Perfil Completo
                    </Button>
                </div>

                <div className="space-y-4">
                    <InfoRow label="Telefone" value={contact.phone} />
                    <InfoRow label="Email" value={contact.email} />
                    <div>
                        <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Atribuído a</h4>
                        <select
                            value={conversation?.assignee_id || 'null'}
                            onChange={handleAssigneeChange}
                            className="w-full bg-background border border-input rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="null">Não atribuído</option>
                            {allTeamMembers.map(member => (
                                <option key={member.user_id} value={member.user_id}>
                                    {member.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Tags</h4>
                        <div className="flex flex-wrap">
                            {localContact.tags?.map(tag => (
                                <Tag key={tag} onRemove={() => removeTag(tag)}>{tag}</Tag>
                            ))}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagInputKeyDown}
                                    placeholder="Adicionar tag..."
                                    className="bg-background border border-input rounded-full text-sm px-3 py-1 pr-8 w-32 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                />
                                {tagInput && (
                                    <button
                                        type="button"
                                        onClick={() => setTagInput('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X_ICON className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Negócios</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsDealModalOpen(true)}
                                className="h-6 text-xs"
                            >
                                <PLUS_ICON className="w-3 h-3 mr-1" /> Novo
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {contactDeals.length > 0 ? (
                                contactDeals.map(deal => (
                                    <div key={deal.id} className="p-2 rounded-md bg-muted/50 text-sm">
                                        <div className="font-medium">{deal.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {pipelines.find(p => p.id === deal.pipeline_id)?.name} • {stages.find(s => s.id === deal.stage_id)?.name}
                                        </div>
                                        <div className="text-xs font-semibold mt-1">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value || 0)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Nenhum negócio encontrado</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Atividades Recentes</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentPage('contact-details', { contactId, tab: 'activities' })}
                                className="h-6 text-xs"
                            >
                                Ver todas
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {activityLoading ? (
                                <p className="text-sm text-muted-foreground">Carregando atividades...</p>
                            ) : activitiesForContact.length > 0 ? (
                                activitiesForContact.slice(0, 3).map(activity => (
                                    <ActivityItem 
                                        key={activity.id} 
                                        activity={activity} 
                                        onDataChange={handleActivityDataChange} 
                                        isCompact 
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Nenhuma atividade recente</p>
                            )}
                        </div>
                    </div>
                </div>

                {hasChanges && (
                    <div className="mt-auto pt-4 border-t border-border">
                        <Button 
                            onClick={handleSaveChanges} 
                            className="w-full"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Salvando...' : 'Salvar alterações'}
                        </Button>
                    </div>
                )}
            </aside>

            <DealFormModal
                isOpen={isDealModalOpen}
                onClose={() => setIsDealModalOpen(false)}
                onSave={handleSaveDeal}
                pipeline={defaultPipeline}
                stages={stages.filter(s => s.pipeline_id === defaultPipeline?.id)}
                contactName={contact.name}
            />

            <AddCustomFieldModal
                isOpen={isCustomFieldModalOpen}
                onClose={() => setIsCustomFieldModalOpen(false)}
            />
        </>
    );
};

export default ContactPanel;
