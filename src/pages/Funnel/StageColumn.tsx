import React, { useState } from 'react';
import { PipelineStage, DealWithContact, Deal } from '../../types/index.js';
import DealCard from './DealCard.js';
import { useAuthStore } from '../../stores/authStore.js';
import { TRASH_ICON } from '../../components/icons/index.js';
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
        'Intermediária': 'border-border',
        'Ganho': 'border-success',
        'Perdido': 'border-destructive',
    };

    return (
        <div
            className={cn(
                'w-80 flex-shrink-0 h-full flex flex-col bg-card rounded-xl transition-colors',
                'border border-border/50',
                'shadow-sm',
                isDragOver && 'ring-2 ring-primary/50 bg-accent/30',
                'hover:border-primary/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={cn(
                'p-4 border-b-4 flex-shrink-0 group',
                stageTypeStyles[stage.type],
                'transition-colors duration-200',
                'bg-card/80 backdrop-blur-sm'
            )}>
                <div className="flex justify-between items-center">
                    {isEditing ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameBlur}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                            autoFocus
                            className="bg-background text-foreground font-medium p-1.5 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                        />
                    ) : (
                        <h2 
                            onClick={() => setIsEditing(true)} 
                            className="font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors" 
                            title="Clique para editar"
                        >
                            {stage.name}
                        </h2>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleDelete}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Excluir etapa"
                    >
                        <TRASH_ICON className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                        {deals.length} {deals.length === 1 ? 'negócio' : 'negócios'}
                    </span>
                    {totalValue > 0 && (
                        <span className="text-xs font-medium text-foreground/80">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {deals.map((deal) => (
                    <DealCard
                        key={deal.id}
                        deal={deal}
                        onDragStart={onDragStart}
                        onEdit={() => onEditDeal(deal)}
                        onDelete={() => onDeleteDeal(deal)}
                        isGhost={draggedDealId === deal.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default StageColumn;