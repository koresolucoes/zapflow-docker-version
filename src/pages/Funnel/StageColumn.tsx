import React, { useState } from 'react';
import { PipelineStage, DealWithContact, Deal } from '../../types/index.js';
import DealCard from './DealCard.js';
import { useAuthStore } from '../../stores/authStore.js';
import { TRASH_ICON, PLUS_ICON } from '../../components/icons/index.js';
import { Button } from '../../components/common/Button.js';
import { useUiStore } from '../../stores/uiStore.js';
import { cn } from '../../lib/utils.js';

interface StageColumnProps {
    stage: PipelineStage;
    deals: DealWithContact[];
    onDragStart: (dealId: string) => void;
    onDrop: (stageId: string) => void;
    draggedDealId: string | null;
    onEditDeal: (deal: DealWithContact) => void;
    onDeleteDeal: (deal: Deal) => void;
}

const StageColumn: React.FC<StageColumnProps> = ({ stage, deals, onDragStart, onDrop, draggedDealId, onEditDeal, onDeleteDeal }) => {
    const { updateStage, deleteStage } = useAuthStore();
    const { showConfirmation, addToast } = useUiStore();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(stage.name);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleNameBlur = () => {
        setIsEditing(false);
        if (name.trim() && name !== stage.name) {
            updateStage(stage.id, { name: name.trim() });
        } else {
            setName(stage.name);
        }
    };
    
    const handleDelete = () => {
        if (deals.length > 0) {
            addToast(`Não é possível excluir a etapa "${stage.name}" porque ela contém ${deals.length} negócio(s). Mova-os primeiro.`, 'warning');
            return;
        }
        showConfirmation(
            'Excluir Etapa',
            `Tem certeza de que deseja excluir a etapa "${stage.name}"?`,
            async () => {
                try {
                    await deleteStage(stage.id);
                    addToast('Etapa excluída com sucesso.', 'success');
                } catch (err: any) {
                    addToast(`Erro ao excluir etapa: ${err.message}`, 'error');
                }
            }
        );
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop(stage.id);
    };

    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    const stageTypeStyles = {
        'Intermediária': 'border-border/50 bg-card/80',
        'Ganho': 'border-success/50 bg-success/5',
        'Perdido': 'border-destructive/50 bg-destructive/5',
    };

    const stageHeaderStyles = {
        'Intermediária': 'border-b-border/30',
        'Ganho': 'border-b-success/20',
        'Perdido': 'border-b-destructive/20',
    };

    return (
        <div
            className={cn(
                'w-80 flex-shrink-0 h-full flex flex-col rounded-lg transition-all',
                'shadow-sm',
                'border border-border/50',
                isDragOver ? 'ring-2 ring-primary/50 bg-accent/30' : 'hover:border-primary/50',
                stageTypeStyles[stage.type],
                'transition-all duration-200',
                'overflow-hidden'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className={cn(
                'p-4 border-b',
                stageHeaderStyles[stage.type],
                'bg-card/50 backdrop-blur-sm',
                'flex justify-between items-center',
                'group'
            )}>
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameBlur}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                            autoFocus
                            className="w-full bg-transparent border-none p-0 text-foreground font-medium focus:ring-0 focus:outline-none"
                        />
                    ) : (
                        <h3 
                            className="text-base font-medium text-foreground truncate cursor-text"
                            onClick={() => setIsEditing(true)}
                        >
                            {stage.name}
                        </h3>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                        {deals.length} {deals.length === 1 ? 'negócio' : 'negócios'}
                        {totalValue > 0 && (
                            <span className="ml-2">• {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</span>
                        )}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                    title="Excluir etapa"
                >
                    <TRASH_ICON className="w-4 h-4" />
                </Button>
            </div>

            {/* Deal List */}
            <div className="flex-1 p-2 overflow-y-auto">
                <div className="space-y-2">
                    {deals.map((deal) => (
                        <DealCard
                            key={deal.id}
                            deal={deal}
                            onDragStart={onDragStart}
                            isGhost={draggedDealId === deal.id}
                            onEdit={() => onEditDeal(deal)}
                            onDelete={() => onDeleteDeal(deal)}
                        />
                    ))}
                </div>

                {deals.length === 0 && !isDragOver && (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                        <p className="text-sm">Arraste negócios para cá</p>
                    </div>
                )}

                {isDragOver && (
                    <div className="border-2 border-dashed border-primary/50 rounded-lg p-4 bg-primary/5 my-2">
                        <p className="text-xs text-center text-primary">Solte para mover para esta etapa</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StageColumn;