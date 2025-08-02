import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { CustomFieldDefinitionInsert } from '../../types/index.js';
import Modal from './Modal.js';
import { Button } from './Button.js';
import { cn } from '../../lib/utils.js';

export type CustomFieldDefinition = Omit<CustomFieldDefinitionInsert, 'team_id' | 'created_at'> & {
    id?: string;
};

interface AddCustomFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: CustomFieldDefinition;
    onSave: (field: CustomFieldDefinition) => Promise<void> | void;
}

type EditableDefinition = Omit<CustomFieldDefinition, 'id' | 'team_id' | 'created_at'>;

const AddCustomFieldModal: React.FC<AddCustomFieldModalProps> = ({ 
    isOpen, 
    onClose, 
    initialData,
    onSave 
}) => {
    const { addDefinition } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<EditableDefinition>({
        name: '',
        key: '',
        type: 'TEXTO',
        options: null,
    });

    // Reset form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            setError(null);
            if (initialData) {
                const { id, ...rest } = initialData;
                setFormData(rest);
            } else {
                setFormData({ name: '', key: '', type: 'TEXTO', options: null });
            }
        }
    }, [isOpen, initialData]);

    const slugify = (text: string) =>
        text.toString().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .replace(/[^\w-]+/g, '')
            .replace(/__+/g, '_')
            .replace(/^-+/, '')
            .replace(/-+$/, '');

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'name') {
            setFormData(prev => ({ ...prev, name: value, key: slugify(value) }));
        } else if (name === 'options' && value) {
            const options = value.split(',').map(opt => opt.trim()).filter(opt => opt);
            setFormData(prev => ({ ...prev, options: options.length ? options : null }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setError('O nome do campo é obrigatório');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const fieldData: CustomFieldDefinition = {
                ...formData,
                ...(initialData?.id && { id: initialData.id })
            };
            
            await onSave(fieldData);
            onClose();
        } catch (err: any) {
            console.error('Erro ao salvar campo personalizado:', err);
            setError(err.message || 'Ocorreu um erro ao salvar o campo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Campo Personalizado' : 'Adicionar Campo Personalizado'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome do Campo *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ex: Tamanho da Camiseta"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Chave (identificador único)
                    </label>
                    <input
                        type="text"
                        id="key"
                        name="key"
                        value={formData.key}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Este valor será usado para identificar o campo no sistema.
                    </p>
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Campo *
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                    >
                        <option value="TEXTO">Texto</option>
                        <option value="NUMERO">Número</option>
                        <option value="DATA">Data</option>
                        <option value="LISTA">Lista de Opções</option>
                    </select>
                </div>

                {formData.type === 'LISTA' && (
                    <div>
                        <label htmlFor="options" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Opções (separadas por vírgula) *
                        </label>
                        <input
                            type="text"
                            id="options"
                            name="options"
                            value={formData.options?.join(', ') || ''}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Ex: P, M, G, GG"
                            required={formData.type === 'LISTA'}
                        />
                    </div>
                )}

                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-md">
                        {error}
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Salvando...' : 'Salvar Campo'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCustomFieldModal;