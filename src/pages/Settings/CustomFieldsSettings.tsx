import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { Button } from '../../components/common/Button.js';
import AddCustomFieldModal, { CustomFieldDefinition } from '../../components/common/AddCustomFieldModal.js';
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
    LAYOUT_GRID_ICON,
    EDIT_ICON as PENCIL_ICON
} from '../../components/icons/index.js';
import { useUiStore } from '../../stores/uiStore.js';

const CustomFieldsSettings: React.FC = () => {
    const { definitions, deleteDefinition } = useAuthStore();
    const { showConfirmation, addToast } = useUiStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
    
    const handleDelete = async (id: string, name: string) => {
        showConfirmation(
            'Excluir Campo Personalizado',
            `Tem certeza que deseja excluir o campo "${name}"? Esta ação não pode ser desfeita.`,
            async () => {
                try {
                    await deleteDefinition(id);
                    addToast('Campo excluído com sucesso.', 'success');
                } catch (err: any) {
                    addToast(`Erro ao excluir: ${err.message}`, 'error');
                }
            }
        );
    };

    const handleEdit = (field: CustomFieldDefinition) => {
        setEditingField(field);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingField(null);
    };

    const handleSaveField = () => {
        // Implementação do handleSaveField
    };

    return (
        <SettingsPage
            title="Campos Personalizados"
            description="Gerencie os campos personalizados disponíveis para contatos e negócios"
            headerAction={
                <Button 
                    variant="default" 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2"
                >
                    <PLUS_ICON className="w-5 h-5" />
                    Adicionar Campo
                </Button>
            }
        >
            {definitions.length > 0 ? (
                <SettingsSection>
                    <div className="overflow-hidden rounded-lg border border-border shadow-sm">
                        <SettingsTable 
                            headers={['Nome', 'Chave', 'Tipo', 'Obrigatório', 'Ações']}
                        >
                            {definitions.map((def) => (
                                <SettingsTableRow key={def.id}>
                                    <SettingsTableCell className="font-medium text-foreground">
                                        {def.name}
                                    </SettingsTableCell>
                                    <SettingsTableCell className="font-mono text-sm text-muted-foreground">
                                        {def.key}
                                    </SettingsTableCell>
                                    <SettingsTableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                            {def.type}
                                        </span>
                                    </SettingsTableCell>
                                    <SettingsTableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                            Opcional
                                        </span>
                                    </SettingsTableCell>
                                    <SettingsActionCell>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(def)}
                                                className="text-primary hover:text-primary/80 transition-colors"
                                                title="Editar"
                                            >
                                                <PENCIL_ICON className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(def.id, def.name)}
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
                    icon={<LAYOUT_GRID_ICON className="mx-auto h-12 w-12 text-muted-foreground" />}
                    title="Nenhum campo personalizado"
                    description="Comece criando seu primeiro campo personalizado para adicionar informações adicionais aos seus contatos e negócios."
                    action={
                        <Button
                            type="button"
                            variant="default"
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4"
                        >
                            <PLUS_ICON className="w-5 h-5 mr-2" />
                            Criar Campo Personalizado
                        </Button>
                    }
                />
            )}

            {isModalOpen && (
                <AddCustomFieldModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingField(null);
                    }}
                    initialData={editingField || undefined}
                    onSave={handleSaveField}
                />
            )}
        </SettingsPage>
    );
};

export default CustomFieldsSettings;