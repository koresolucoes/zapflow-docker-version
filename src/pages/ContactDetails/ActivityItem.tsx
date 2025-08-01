import React from 'react';
import { ContactActivity } from '../../types/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { NOTE_ICON, CALENDAR_ICON, TRASH_ICON, CHECK_SQUARE_ICON } from '../../components/icons/index.js';
import { Button } from '../../components/common/Button.js';
import { cn } from '../../lib/utils.js';

interface ActivityItemProps {
    activity: ContactActivity;
    onDataChange: () => void;
    isCompact?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onDataChange, isCompact = false }) => {
    const { updateActivity, deleteActivity } = useAuthStore();
    const { showConfirmation, addToast } = useUiStore();
    const isTask = activity.type === 'TAREFA';

    const handleToggleComplete = async () => {
        if (!isTask) return;
        await updateActivity(activity.id, { is_completed: !activity.is_completed });
        onDataChange();
    };

    const handleDelete = async () => {
        showConfirmation(
            'Excluir Atividade',
            "Tem certeza que deseja excluir esta atividade?",
            async () => {
                try {
                    await deleteActivity(activity.id);
                    onDataChange();
                    addToast('Atividade excluída.', 'success');
                } catch (err: any) {
                    addToast(`Erro ao excluir atividade: ${err.message}`, 'error');
                }
            }
        );
    };
    
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const isOverdue = isTask && !activity.is_completed && activity.due_date && new Date(activity.due_date) < new Date();

    return (
        <div className={cn(
            "p-3 rounded-lg flex items-start gap-3 group border",
            isCompact ? "bg-card/50" : "bg-card",
            isCompact ? "border-border/50" : "border-border"
        )}>
            <div className={cn(
                "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full",
                isTask ? 'bg-primary/10' : 'bg-secondary/10'
            )}>
                {isTask ? (
                    <CALENDAR_ICON className={cn(
                        "w-4 h-4",
                        activity.is_completed ? 'text-muted-foreground' : 'text-primary'
                    )} />
                ) : (
                    <NOTE_ICON className="w-4 h-4 text-secondary-foreground" />
                )}
            </div>
            <div className="flex-grow">
                <p className={cn(
                    "text-sm",
                    activity.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                )}>
                    {activity.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>Criado em {formatDate(activity.created_at)}</span>
                    {isTask && activity.due_date && (
                        <span className={cn(
                            "font-medium",
                            isOverdue ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                            {isOverdue ? 'Vencida em ' : 'Vence em '}
                            {formatDate(activity.due_date)}
                        </span>
                    )}
                </div>
            </div>
            <div className={cn(
                "flex-shrink-0 flex items-center gap-1",
                isCompact ? "opacity-0 group-hover:opacity-100 transition-opacity" : "opacity-100"
            )}>
                {isTask && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleComplete}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title={activity.is_completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                    >
                        <CHECK_SQUARE_ICON className={cn(
                            "w-4 h-4",
                            activity.is_completed ? 'text-success' : 'text-muted-foreground'
                        )} />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Excluir"
                >
                    <TRASH_ICON className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default ActivityItem;