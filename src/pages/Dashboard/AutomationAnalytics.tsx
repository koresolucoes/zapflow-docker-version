import React, { useMemo } from 'react';
import { Card } from '../../components/common/Card.js';
import { useAuthStore } from '../../stores/authStore.js';
import { DashboardData } from '../../services/dataService.js';
import { AUTOMATION_ICON } from '../../components/icons/index.js';

interface AutomationAnalyticsProps {
    data: DashboardData | null;
    isLoading: boolean;
}

const AutomationAnalytics: React.FC<AutomationAnalyticsProps> = ({ data, isLoading }) => {
    const { automations, setCurrentPage } = useAuthStore();

    const stats = useMemo(() => {
        if (!data) return { successRate: '0.0%', totalRuns: 0, mostActive: [] };
        const successRate = data.totalRunsLast7Days > 0
            ? ((data.successfulRunsLast7Days / data.totalRunsLast7Days) * 100).toFixed(1) + '%'
            : '0.0%';
        
        return {
            successRate,
            totalRuns: data.totalRunsLast7Days,
            mostActive: data.mostActiveAutomations,
        };
    }, [data]);

    const activeAutomationsCount = useMemo(() => {
        return automations.filter(a => a.status === 'active').length;
    }, [automations]);
    
    return (
        <Card className="h-full w-full">
            <div className="p-4 h-full flex flex-col">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Análise de Automações</h2>
                
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="text-center">
                        <p className="text-xl font-bold text-pink-500 dark:text-pink-400">{activeAutomationsCount}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ativas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalRuns}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Execuções (7d)</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-green-500 dark:text-green-400">{stats.successRate}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Sucesso (7d)</p>
                    </div>
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Mais Ativas (7 dias)</h3>
                    
                    {stats.mostActive.length > 0 ? (
                        <ul className="space-y-2">
                            {stats.mostActive.map((item, index) => (
                                <li key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-700 dark:text-slate-300 truncate pr-2">
                                        {item.automations?.name || `Automação #${index + 1}`}
                                    </span>
                                    <span className="font-mono font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                        {item.count}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                            <AUTOMATION_ICON className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {isLoading ? 'Carregando...' : 'Nenhuma automação executada nos últimos 7 dias.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default AutomationAnalytics;