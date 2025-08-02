import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { Button } from '../../components/common/Button.js';
import { 
    SettingsPage, 
    SettingsSection,
    SettingsTable, 
    SettingsTableRow, 
    SettingsTableCell, 
    SettingsActionCell,
    SettingsEmptyState,
    SettingsForm,
    SettingsFormField,
    SettingsFormActions
} from '../../components/settings/SettingsPage.js';
import { 
    PLUS_ICON, 
    TRASH_ICON, 
    BOLT_ICON,
    EDIT_ICON as PENCIL_ICON
} from '../../components/icons/index.js';
import { CannedResponse, CannedResponseInsert } from '../../types/index.js';
import { useUiStore } from '../../stores/uiStore.js';
import Modal from '../../components/common/Modal.js';

type TablesUpdate<T extends string> = {
    [key: string]: any;
};

const CannedResponseForm: React.FC<{
    response?: CannedResponse;
    onSave: (data: Omit<CannedResponseInsert, 'user_id' | 'id' | 'created_at'> | TablesUpdate<'canned_responses'>) => Promise<void>;
    onCancel: () => void;
}> = ({ response, onSave, onCancel }) => {
    const [shortcut, setShortcut] = useState(response?.shortcut || '');
    const [content, setContent] = useState(response?.content || '');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shortcut.trim() || !content.trim()) return;
        
        setIsLoading(true);
        try {
            await onSave({ 
                shortcut: shortcut.trim(), 
                content: content.trim() 
            });
            onCancel();
        } catch (err: any) {
            console.error('Erro ao salvar resposta:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsForm onSubmit={handleSubmit}>
            <SettingsFormField
                label="Atalho"
                id="shortcut"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="/agradecimento"
                required
            />
            
            <SettingsFormField
                label="Conteúdo da Mensagem"
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Obrigado pelo seu contato! Como posso ajudar?"
                required
                multiline
                rows={4}
            />
            
            <SettingsFormActions>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancelar
                </Button>
                <Button 
                    type="submit" 
                    isLoading={isLoading}
                >
                    {response ? 'Atualizar' : 'Criar'} Resposta
                </Button>
            </SettingsFormActions>
        </SettingsForm>
    );
};

const CannedResponsesSettings: React.FC = () => {
    const { responses, addResponse, updateResponse, deleteResponse } = useAuthStore();
    const { showConfirmation, addToast } = useUiStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);

    const handleOpenModal = (response?: CannedResponse) => {
        setEditingResponse(response || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingResponse(null);
    };

    const handleSave = async (data: Omit<CannedResponseInsert, 'user_id' | 'id' | 'created_at'> | TablesUpdate<'canned_responses'>) => {
        try {
            if (editingResponse) {
                await updateResponse(editingResponse.id, data);
                addToast('Resposta atualizada com sucesso!', 'success');
            } else {
                await addResponse(data as Omit<CannedResponseInsert, 'user_id' | 'id' | 'created_at'>);
                addToast('Resposta criada com sucesso!', 'success');
            }
        } catch (err: any) {
            addToast(`Erro ao salvar: ${err.message}`, 'error');
            throw err;
        }
    };

    const handleDelete = async (response: CannedResponse) => {
        showConfirmation(
            'Excluir Resposta Rápida',
            `Tem certeza que deseja excluir a resposta "${response.shortcut}"?`,
            async () => {
                try {
                    await deleteResponse(response.id);
                    addToast('Resposta excluída com sucesso!', 'success');
                } catch (err: any) {
                    addToast(`Erro ao excluir: ${err.message}`, 'error');
                }
            }
        );
    };

    return (
        <SettingsPage
            title="Respostas Rápidas"
            description="Crie e gerencie respostas pré-definidas para agilizar o atendimento."
            headerAction={
                <Button 
                    variant="default" 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2"
                >
                    <PLUS_ICON className="w-5 h-5" />
                    Nova Resposta
                </Button>
            }
        >
            {responses.length > 0 ? (
                <SettingsSection>
                    <div className="overflow-hidden rounded-lg border border-border shadow-sm">
                        <SettingsTable 
                            headers={['Atalho', 'Conteúdo', 'Ações']}
                        >
                            {responses.map(response => (
                                <SettingsTableRow key={response.id}>
                                    <SettingsTableCell className="font-medium text-foreground">
                                        <span className="font-mono text-primary">{response.shortcut}</span>
                                    </SettingsTableCell>
                                    <SettingsTableCell className="text-sm text-muted-foreground line-clamp-2">
                                        {response.content}
                                    </SettingsTableCell>
                                    <SettingsActionCell>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(response)}
                                                className="text-primary hover:text-primary/80 transition-colors"
                                                title="Editar"
                                            >
                                                <PENCIL_ICON className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(response)}
                                                className="text-destructive hover:text-destructive/80 transition-colors"
                                                title="Excluir"
                                            >
                                                <TRASH_ICON className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </SettingsActionCell>
                                </SettingsTableRow>
                            ))}
                        </SettingsTable>
                    </div>
                </SettingsSection>
            ) : (
                <SettingsEmptyState
                    icon={<BOLT_ICON className="mx-auto h-12 w-12 text-muted-foreground" />}
                    title="Nenhuma resposta rápida"
                    description="Comece criando sua primeira resposta rápida para agilizar o atendimento."
                    action={
                        <Button
                            type="button"
                            variant="default"
                            onClick={() => handleOpenModal()}
                            className="mt-4"
                        >
                            <PLUS_ICON className="w-5 h-5 mr-2" />
                            Criar Resposta Rápida
                        </Button>
                    }
                />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingResponse ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
                description="Preencha os campos abaixo para criar uma nova resposta rápida."
            >
                <CannedResponseForm
                    response={editingResponse || undefined}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </SettingsPage>
    );
};

export default CannedResponsesSettings;