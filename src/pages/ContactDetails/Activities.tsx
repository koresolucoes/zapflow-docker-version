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
        fetchActivitiesForContact(contactId);
    }, [contactId, fetchActivitiesForContact]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteContent.trim() || !user) return;
        setIsSaving(true);
        const payload: Omit<ContactActivityInsert, 'team_id'> = {
            contact_id: contactId,
            type: 'NOTA',
            content: noteContent.trim(),
            is_completed: false,
        };
        await addActivity(payload);
        setIsSaving(false);
        setNoteContent('');
        setActiveTab('list');
        onDataChange();
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskContent.trim() || !taskDueDate || !user) return;
        setIsSaving(true);
        const payload: Omit<ContactActivityInsert, 'team_id'> = {
            contact_id: contactId,
            type: 'TAREFA',
            content: taskContent.trim(),
            due_date: taskDueDate,
            is_completed: false,
        };
        await addActivity(payload);
        setIsSaving(false);
        setTaskContent('');
        setTaskDueDate('');
        setActiveTab('list');
        onDataChange();
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Atividades</h2>
                <div className="flex items-center gap-2 p-1 bg-accent/10 rounded-lg">
                    <TabButton label="Todas" active={activeTab === 'list'} onClick={() => setActiveTab('list')} />
                    <TabButton label="Adicionar Nota" active={activeTab === 'note'} onClick={() => setActiveTab('note')} />
                    <TabButton label="Adicionar Tarefa" active={activeTab === 'task'} onClick={() => setActiveTab('task')} />
                </div>
            </div>

            <div>
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
                    <form onSubmit={handleAddNote} className="space-y-3">
                        <textarea
                            value={noteContent}
                            onChange={e => setNoteContent(e.target.value)}
                            placeholder="Escreva sua nota aqui..."
                            rows={4}
                            className="w-full bg-background p-2 rounded-md border border-input text-foreground"
                        />
                        <div className="flex justify-end">
                            <Button type="submit" variant="default" isLoading={isSaving} disabled={!noteContent.trim()}>
                                Salvar Nota
                            </Button>
                        </div>
                    </form>
                )}
                {activeTab === 'task' && (
                    <form onSubmit={handleAddTask} className="space-y-3">
                        <textarea
                            value={taskContent}
                            onChange={e => setTaskContent(e.target.value)}
                            placeholder="Descreva a tarefa..."
                            rows={3}
                            className="w-full bg-background p-2 rounded-md border border-input text-foreground"
                        />
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Data de Vencimento</label>
                                <input
                                    type="date"
                                    value={taskDueDate}
                                    onChange={e => setTaskDueDate(e.target.value)}
                                    className="w-full bg-background p-2 rounded-md border border-input text-foreground"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" variant="default" isLoading={isSaving} disabled={!taskContent.trim() || !taskDueDate}>
                                    Adicionar Tarefa
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </Card>
    );
};

export default Activities;