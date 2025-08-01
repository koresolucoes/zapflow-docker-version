import React from 'react';
import { Card } from '../../components/common/Card.js';
import { useAuthStore } from '../../stores/authStore.js';
import { CALENDAR_ICON } from '../../components/icons/index.js';
import { Button } from '../../components/common/Button.js';

const TodaysTasksCard: React.FC = () => {
    const { todaysTasks, setCurrentPage } = useAuthStore();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hoje';
        if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
        return date.toLocaleDateString('pt-BR');
    };

    const isOverdue = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    return (
        <Card className="h-full w-full">
            <div className="p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tarefas para Hoje</h2>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {todaysTasks.length} {todaysTasks.length === 1 ? 'tarefa' : 'tarefas'}
                    </span>
                </div>
                
                {todaysTasks.length > 0 ? (
                    <ul className="flex-1 space-y-2 overflow-y-auto pr-1 -mr-1">
                        {todaysTasks.map(task => (
                            <li 
                                key={task.id}
                                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                            >
                                <div className="flex items-start">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {task.content}
                                        </p>
                                        <div className="mt-1.5 flex items-center text-xs">
                                            <span 
                                                className={`inline-flex items-center ${
                                                    task.contacts?.id 
                                                        ? 'text-blue-600 dark:text-blue-400' 
                                                        : 'text-slate-500 dark:text-slate-400'
                                                }`}
                                                title={task.contacts?.id ? task.contacts.name : 'Nenhum contato associado'}
                                            >
                                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                {task.contacts?.name || 'Sem contato'}
                                            </span>
                                            
                                            {task.due_date && (
                                                <span 
                                                    className={`ml-3 inline-flex items-center ${
                                                        isOverdue(task.due_date) 
                                                            ? 'text-red-500 dark:text-red-400' 
                                                            : 'text-slate-500 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <CALENDAR_ICON className="w-3.5 h-3.5 mr-1" />
                                                    {formatDate(task.due_date)}
                                                    {isOverdue(task.due_date) && (
                                                        <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                                                            Atrasada
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                                        onClick={() => {}}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <CALENDAR_ICON className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-slate-700 dark:text-slate-300 font-medium mb-1">Nenhuma tarefa para hoje</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Você não tem tarefas agendadas para hoje.
                        </p>
                        <Button 
                            variant="outline"
                            onClick={() => setCurrentPage('dashboard')}
                            className="text-sm"
                        >
                            Ver todas as tarefas
                        </Button>
                    </div>
                )}
                
                {todaysTasks.length > 0 && (
                    <div className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-700">
                        <Button 
                            variant="ghost"
                            onClick={() => setCurrentPage('dashboard')}
                            className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Ver todas as tarefas
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default TodaysTasksCard;