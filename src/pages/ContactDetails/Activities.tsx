import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import ActivityItem from './ActivityItem.js';
import { ContactActivity, ContactActivityInsert } from '../../types/index.js';
import { useAuthStore } from '../../stores/authStore.js';

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
    >
        {label}
    </button>
);

interface ActivitiesProps {
    contactId: string;
    onDataChange: () => void;
}

const Activities: React.FC<ActivitiesProps> = ({ contactId, onDataChange }: ActivitiesProps) => {
    const { activitiesForContact, fetchActivitiesForContact, addActivity, activityLoading, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'list' | 'note' | 'task'>('list');
    
    const [noteContent, setNoteContent] = useState('');
    const [taskContent, setTaskContent] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadActivities = async () => {
            try {
                await fetchActivitiesForContact(contactId);
            } catch (error) {
                console.error('Erro ao carregar atividades:', error);
            }
        };
        
        loadActivities();
    }, [contactId, fetchActivitiesForContact]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteContent.trim() || !user) return;
        
        try {
            setIsSaving(true);
            const payload: Omit<ContactActivityInsert, 'team_id'> = {
                contact_id: contactId,
                type: 'NOTA',
                content: noteContent.trim(),
                is_completed: false,
            };
            await addActivity(payload);
            setNoteContent('');
            setActiveTab('list');
            onDataChange();
        } catch (error) {
            console.error('Erro ao adicionar nota:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskContent.trim() || !taskDueDate || !user) return;
        
        try {
            setIsSaving(true);
            const payload: Omit<ContactActivityInsert, 'team_id'> = {
                contact_id: contactId,
                type: 'TAREFA',
                content: taskContent.trim(),
                due_date: taskDueDate,
                is_completed: false,
            };
            await addActivity(payload);
            setTaskContent('');
            setTaskDueDate('');
            setActiveTab('list');
            onDataChange();
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-semibold text-foreground">Atividades</h2>
                <div className="flex flex-wrap items-center gap-2 p-1 bg-accent/10 rounded-lg w-full sm:w-auto">
                    <TabButton 
                        label="Todas" 
                        active={activeTab === 'list'} 
                        onClick={() => setActiveTab('list')} 
                    />
                    <TabButton 
                        label="Adicionar Nota" 
                        active={activeTab === 'note'} 
                        onClick={() => {
                            setActiveTab('note');
                            setNoteContent('');
                        }} 
                    />
                    <TabButton 
                        label="Adicionar Tarefa" 
                        active={activeTab === 'task'} 
                        onClick={() => {
                            setActiveTab('task');
                            setTaskContent('');
                        }} 
                    />
                </div>
            </div>

            <div className="space-y-6">
                {activeTab === 'list' && (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {activityLoading ? (
                            <p className="text-center text-muted-foreground py-4">Carregando...</p>
                        ) : activitiesForContact.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">Nenhuma nota ou tarefa registrada.</p>
                        ) : (
                            activitiesForContact.map((activity: ContactActivity) => (
                                <ActivityItem key={activity.id} activity={activity} onDataChange={onDataChange} />
                            ))
                        )}
                    </div>
                )}
                
                {activeTab === 'note' && (
                    <form onSubmit={handleAddNote} className="space-y-4">
                        <div>
                            <label htmlFor="note-content" className="block text-sm font-medium text-muted-foreground mb-2">
                                Nova Nota
                            </label>
                            <textarea
                                id="note-content"
                                value={noteContent}
                                onChange={e => setNoteContent(e.target.value)}
                                placeholder="Escreva sua nota aqui..."
                                rows={4}
                                className="w-full bg-background p-3 rounded-md border border-input text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setActiveTab('list')}
                                disabled={isSaving}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                variant="default" 
                                isLoading={isSaving} 
                                disabled={!noteContent.trim()}
                            >
                                Salvar Nota
                            </Button>
                        </div>
                    </form>
                )}
                
                {activeTab === 'task' && (
                    <form onSubmit={handleAddTask} className="space-y-4">
                        <div>
                            <label htmlFor="task-content" className="block text-sm font-medium text-muted-foreground mb-2">
                                Descrição da Tarefa
                            </label>
                            <textarea
                                id="task-content"
                                value={taskContent}
                                onChange={e => setTaskContent(e.target.value)}
                                placeholder="Descreva a tarefa..."
                                rows={3}
                                className="w-full bg-background p-3 rounded-md border border-input text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                                autoFocus
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="task-due-date" className="block text-sm font-medium text-muted-foreground mb-2">
                                    Data de Vencimento
                                </label>
                                <input
                                    id="task-due-date"
                                    type="date"
                                    value={taskDueDate}
                                    onChange={e => setTaskDueDate(e.target.value)}
                                    className="w-full bg-background p-2 rounded-md border border-input text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setActiveTab('list')}
                                disabled={isSaving}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                variant="default" 
                                isLoading={isSaving} 
                                disabled={!taskContent.trim() || !taskDueDate}
                            >
                                Adicionar Tarefa
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Card>
    );
};

export default Activities;