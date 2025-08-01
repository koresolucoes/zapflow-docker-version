import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { CustomFieldDefinitionInsert } from '../../types/index.js';
import Modal from './Modal.js';
import { Button } from './Button.js';
import { cn } from '../../lib/utils.js';

interface AddCustomFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type EditableDefinition = Omit<CustomFieldDefinitionInsert, 'id' | 'team_id' | 'created_at'>;

const AddCustomFieldModal: React.FC<AddCustomFieldModalProps> = ({ isOpen, onClose }) => {
    const { addDefinition } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<EditableDefinition>({
        name: '',
        key: '',
        type: 'TEXTO',
        options: null,
    });

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
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleOpen = () => {
        setError(null);
        setFormData({ name: '', key: '', type: 'TEXTO', options: null });
    };

    // Effect to reset form when modal opens
    React.useEffect(() => {
        if (isOpen) {
            handleOpen();
        }
    }, [isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.key) {
            setError("Nome e Chave do campo são obrigatórios.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const definitionToSave: Omit<CustomFieldDefinitionInsert, 'team_id' | 'id' | 'created_at'> = {
                name: formData.name,
                key: formData.key,
                type: formData.type,
                options: formData.type === 'LISTA' ? formData.options?.toString().split(',').map((o: string) => o.trim()).filter(Boolean) || [] : null
            };
            await addDefinition(definitionToSave);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    );

    const textareaClass = cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    );

    const labelClass = "block text-sm font-medium text-foreground mb-1";
    const helperTextClass = "text-xs text-muted-foreground mt-1";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Campo Personalizado">
            <form onSubmit={handleSave} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive-foreground border border-destructive/20">
                        {error}
                    </div>
                )}
                
                <div>
                    <label className={labelClass}>Nome do Campo</label>
                    <input 
                        name="name" 
                        value={formData.name} 
                        onChange={handleFormChange} 
                        placeholder="Ex: Data de Nascimento" 
                        className={inputClass} 
                        required 
                    />
                </div>
                
                <div>
                    <label className={labelClass}>Chave do Campo</label>
                    <input 
                        name="key" 
                        value={formData.key} 
                        onChange={handleFormChange} 
                        placeholder="Ex: data_nascimento" 
                        className={cn(inputClass, "font-mono")} 
                        required 
                    />
                    <p className={helperTextClass}>
                        Identificador único para o campo (sem espaços ou caracteres especiais).
                    </p>
                </div>
                
                <div>
                    <label className={labelClass}>Tipo de Campo</label>
                    <select 
                        name="type" 
                        value={formData.type} 
                        onChange={handleFormChange} 
                        className={inputClass}
                    >
                        <option value="TEXTO">Texto</option>
                        <option value="NUMERO">Número</option>
                        <option value="DATA">Data</option>
                        <option value="LISTA">Lista de Opções</option>
                    </select>
                </div>
                
                {formData.type === 'LISTA' && (
                    <div>
                        <label className={labelClass}>Opções da Lista</label>
                        <textarea 
                            name="options" 
                            value={Array.isArray(formData.options) ? formData.options.join(', ') : formData.options || ''} 
                            onChange={handleFormChange} 
                            rows={3} 
                            placeholder="Opção 1, Opção 2, Opção 3" 
                            className={textareaClass} 
                        />
                        <p className={helperTextClass}>
                            Separe as opções por vírgula.
                        </p>
                    </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
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
                        variant="default" 
                        isLoading={isLoading}
                    >
                        Salvar
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCustomFieldModal;