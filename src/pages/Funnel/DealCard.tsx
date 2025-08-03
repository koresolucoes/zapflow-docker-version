import React, { useMemo } from 'react';
import { DealWithContact } from '../../types/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Button } from '../../components/common/Button.js';
import { EDIT_ICON, TRASH_ICON, USERS_ICON, CALENDAR_ICON } from '../../components/icons/index.js';
import { cn } from '../../lib/utils.js';

interface DealCardProps {
    deal: DealWithContact;
    onDragStart: (dealId: string) => void;
    isGhost?: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, onDragStart, isGhost, onEdit, onDelete }) => {
    const { setCurrentPage } = useAuthStore();

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        onDragStart(deal.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const navigateToContact = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(deal.contacts?.id) {
            setCurrentPage('contact-details', { contactId: deal.contacts.id });
        }
    };
    
    const stagnantDays = useMemo(() => {
        if (deal.status !== 'Aberto') return 0;
        const updatedAt = new Date(deal.updated_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - updatedAt.getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }, [deal.updated_at, deal.status]);

    const isStagnant = stagnantDays > 7;

    const statusStyles = {
        Aberto: {
            bg: 'bg-primary/10',
            text: 'text-primary',
            border: 'border-primary/20',
            glow: 'glow-primary',
        },
        Ganho: {
            bg: 'bg-success/10',
            text: 'text-success',
            border: 'border-success/20',
            glow: 'glow-success',
        },
        Perdido: {
            bg: 'bg-destructive/10',
            text: 'text-destructive',
            border: 'border-destructive/20',
            glow: 'glow-destructive',
        },
    };

    const currentStatus = statusStyles[deal.status] || statusStyles['Aberto'];

    const valueColor = {
        Aberto: 'text-foreground',
        Ganho: 'text-success',
        Perdido: 'text-destructive',
    };
    
    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className={cn(
                'p-4 bg-card rounded-lg transition-all duration-200',
                'border border-border/50',
                'cursor-grab active:cursor-grabbing',
                'shadow-sm hover:shadow-md',
                isGhost ? 'opacity-30' : 'opacity-100',
                'group relative overflow-hidden',
                'flex flex-col gap-2',
                'hover:-translate-y-0.5',
                'dark:hover:shadow-sky-500/10',
                'glow-effect', 
                currentStatus.glow, 
                'hover:glow-active', 
                currentStatus.border
            )}
        >
            {/* Header with title and status */}
            <div className="flex justify-between items-start gap-2 relative z-10">
                <h3 className="font-medium text-foreground line-clamp-2 pr-8">{deal.name}</h3>
                <span className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap',
                    currentStatus.bg,
                    currentStatus.text,
                    currentStatus.border
                )}>
                    {deal.status}
                </span>
            </div>

            {/* Contact info */}
            <div 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline cursor-pointer relative z-10" 
                onClick={navigateToContact}
            >
                <USERS_ICON className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{deal.contacts?.name || 'Contato não encontrado'}</span>
            </div>

            {/* Value */}
            <p className={cn(
                "text-xl font-semibold mt-1 relative z-10",
                valueColor[deal.status]
            )}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value || 0)}
            </p>

            {/* Stagnant warning */}
            {isStagnant && (
                <div className="flex items-center gap-1.5 text-xs text-warning mt-1 relative z-10">
                    <CALENDAR_ICON className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Parado há {stagnantDays} dias</span>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 relative z-10">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                    className="text-muted-foreground hover:text-foreground h-8 px-2"
                    title="Editar negócio"
                >
                    <EDIT_ICON className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-xs">Editar</span>
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                    className="text-muted-foreground hover:text-destructive h-8 px-2"
                    title="Excluir negócio"
                >
                    <TRASH_ICON className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-xs">Excluir</span>
                </Button>
            </div>
        </div>
    );
};

export default DealCard;