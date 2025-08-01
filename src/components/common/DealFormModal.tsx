import React, { useState, useMemo, useEffect } from 'react';
import { Pipeline, PipelineStage, Deal, DealInsert } from '../../types/index.js';
import { Button } from './Button.js';
import Modal from './Modal.js';
import { cn } from '../../lib/utils.js';

interface DealFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dealData: { id?: string; name: string; value: number; stage_id: string; pipeline_id: string; }) => Promise<void>;
    pipeline: Pipeline;
    stages: PipelineStage[];
    contactName: string;
    deal?: Deal; // Optional for editing
}

const DealFormModal: React.FC<DealFormModalProps> = ({ isOpen, onClose, onSave, pipeline, stages, contactName, deal }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState(0);
    const [stageId, setStageId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!deal;

    const initialStageId = useMemo(() => {
        if (deal?.stage_id) return deal.stage_id;
        if (stages.length > 0) {
            return stages.reduce((prev, current) => 
                (prev.sort_order < current.sort_order) ? prev : current
            ).id;
        }
        return '';
    }, [deal, stages]);

    useEffect(() => {
        if (isOpen) {
            setName(deal?.name || `Negócio - ${contactName}`);
            setValue(deal?.value || 0);
            setStageId(initialStageId);
        }
    }, [isOpen, deal, contactName, initialStageId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stageId) {
            alert("Por favor, selecione uma etapa para o negócio.");
            return;
        }
        setIsLoading(true);

        const dealData: { id?: string; name: string; value: number; stage_id: string; pipeline_id: string; } = {
            name,
            value,
            stage_id: stageId,
            pipeline_id: pipeline.id,
        };
        if(isEditing) {
            dealData.id = deal.id;
        }

        try {
            await onSave(dealData);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Negócio' : 'Criar Novo Negócio'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                        Nome do Negócio
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                            "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                    />
                </div>
                <div>
                    <label htmlFor="value" className="block text-sm font-medium text-foreground mb-1">
                        Valor (R$)
                    </label>
                    <input
                        type="number"
                        id="value"
                        step="0.01"
                        value={value}
                        onChange={e => setValue(parseFloat(e.target.value))}
                        required
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                            "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                    />
                </div>
                <div>
                    <label htmlFor="stageId" className="block text-sm font-medium text-foreground mb-1">
                        Etapa
                    </label>
                    <select
                        id="stageId"
                        value={stageId}
                        onChange={e => setStageId(e.target.value)}
                        required
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                    >
                        {stages.sort((a,b) => a.sort_order - b.sort_order).map(stage => (
                            <option key={stage.id} value={stage.id} className="bg-background text-foreground">
                                {stage.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
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
                        {isEditing ? 'Salvar Alterações' : 'Criar Negócio'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default DealFormModal;