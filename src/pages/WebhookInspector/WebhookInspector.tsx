import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { WebhookLog } from '../../types/index.js';
import { Card } from '../../components/common/Card.js';
import JsonTreeView from '../AutomationEditor/node-settings/JsonTreeView.js';
import { apiGet } from '../../lib/apiClient.js';
import { Button } from '../../components/common/Button.js';

const WebhookInspector: React.FC = () => {
    const { activeTeam } = useAuthStore();
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        if (!activeTeam) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiGet<WebhookLog[]>('/webhook-logs');
            setLogs(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao buscar logs.');
            console.error("Error fetching webhook logs:", err);
        } finally {
            setIsLoading(false);
        }
    }, [activeTeam]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);


    const handleSelectLog = (log: WebhookLog) => {
        setSelectedLog(log.id === selectedLog?.id ? null : log);
    };

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
                <h1 className="text-3xl font-bold text-foreground">Webhook Inspector</h1>
                <Button onClick={fetchLogs} disabled={isLoading}>
                    {isLoading ? 'Atualizando...' : 'Atualizar'}
                </Button>
            </div>
            <Card className="flex-grow overflow-hidden flex flex-col">
                <p className="text-muted-foreground text-sm mb-4 flex-shrink-0">
                    Visualize as requisições que chegam nos seus endpoints de webhook. Os 50 eventos mais recentes são exibidos. A atualização não é mais em tempo real, clique no botão para atualizar.
                </p>
                {error && <p className="text-destructive mb-4">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow overflow-hidden">
                    {/* Log List */}
                    <div className="md:col-span-1 bg-card/70 p-2 rounded-lg overflow-y-auto">
                        {isLoading ? (
                            <p className="text-center text-muted-foreground p-4">Carregando...</p>
                        ) : logs.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-center text-muted-foreground p-4">Nenhum evento de webhook recebido ainda.</p>
                            </div>
                        ) : (
                            <ul>
                                {logs.map(log => (
                                    <li key={log.id}>
                                        <button
                                            onClick={() => handleSelectLog(log)}
                                            className={`w-full text-left p-3 rounded-md mb-2 transition-colors ${selectedLog?.id === log.id ? 'bg-accent/60' : 'hover:bg-muted'}`}
                                        >
                                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                <span className={`font-semibold ${log.source === 'meta_message' ? 'text-success' : 'text-primary'}`}>{log.source}</span>
                                                <span>{new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                                            </div>
                                            <p className="font-mono text-sm text-foreground mt-1 truncate">{log.path}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Payload Viewer */}
                    <div className="md:col-span-2 bg-card/70 p-4 rounded-lg overflow-y-auto">
                         <h3 className="text-lg font-semibold text-foreground mb-2">Payload</h3>
                        {selectedLog ? (
                            <JsonTreeView data={selectedLog.payload || { error: 'Payload Vazio' }} onSelect={() => {}} selectedPath="" />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">Selecione um evento para ver o payload.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default WebhookInspector;
