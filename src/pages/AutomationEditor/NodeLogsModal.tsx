import React from 'react';
import { AutomationNodeLog } from '../../types/index.js';
import { Button } from '../../components/common/Button.js';

interface NodeLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeLabel: string;
    logs: AutomationNodeLog[];
    isLoading: boolean;
}

const StatusBadge: React.FC<{ status: AutomationNodeLog['status'] }> = ({ status }) => {
    const statusStyles = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    const style = statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    const text = status === 'success' ? 'Sucesso' : 'Falha';
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${style}`}>{text}</span>;
};


const NodeLogsModal: React.FC<NodeLogsModalProps> = ({ isOpen, onClose, nodeLabel, logs, isLoading }) => {
    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'medium',
        });
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Logs de Execução: {nodeLabel}</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <svg className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>
                </header>
                
                <main className="flex-grow p-6 overflow-y-auto bg-white dark:bg-slate-800">
                    {isLoading ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">Carregando logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                            Nenhum log encontrado para este nó.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map(log => (
                                <div key={log.id} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(log.created_at)}</p>
                                        <StatusBadge status={log.status} />
                                    </div>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{log.details}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <footer className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end bg-gray-50 dark:bg-slate-800/50">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        Fechar
                    </Button>
                </footer>
            </div>
        </div>
    );
};

export default NodeLogsModal;
