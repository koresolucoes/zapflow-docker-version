import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../../components/common/Card.js';
import { useAuthStore } from '../../stores/authStore.js';
import { CustomTooltip } from './Dashboard.js';
import { FUNNEL_ICON } from '../../components/icons/index.js';
import { useUiStore } from '../../stores/uiStore.js';

const SalesMetrics: React.FC = () => {
    const { deals, stages, activePipelineId } = useAuthStore();
    const { theme } = useUiStore();

    const salesKPIs = useMemo(() => {
        const relevantDeals = deals.filter(d => d.pipeline_id === activePipelineId);
        const openDeals = relevantDeals.filter(d => d.status === 'Aberto');
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const wonDealsThisMonth = relevantDeals.filter(d => 
            d.status === 'Ganho' && d.closed_at && new Date(d.closed_at) >= startOfMonth
        );
        
        const wonDeals = relevantDeals.filter(d => d.status === 'Ganho');
        const lostDeals = relevantDeals.filter(d => d.status === 'Perdido');
        const totalClosed = wonDeals.length + lostDeals.length;

        return {
            openValue: openDeals.reduce((sum, d) => sum + (d.value || 0), 0),
            wonCountThisMonth: wonDealsThisMonth.length,
            wonValueThisMonth: wonDealsThisMonth.reduce((sum, d) => sum + (d.value || 0), 0),
            conversionRate: totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0,
        };
    }, [deals, activePipelineId]);

    const funnelChartData = useMemo(() => {
        const activeStages = stages
            .filter(s => s.pipeline_id === activePipelineId)
            .sort((a, b) => a.sort_order - b.sort_order);
            
        return activeStages.map(stage => ({
            name: stage.name,
            Negócios: deals.filter(d => d.stage_id === stage.id).length,
            fill: stage.type === 'Ganho' ? '#22c55e' : stage.type === 'Perdido' ? '#ef4444' : '#64748b', // slate-500
        }));
    }, [stages, deals, activePipelineId]);

    return (
        <Card className="h-full w-full">
            <div className="p-4 h-full flex flex-col">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Métricas de Vendas (Funil)</h2>
                <div className="flex-1 flex flex-col">
                    {funnelChartData.length > 0 ? (
                        <div className="w-full h-[200px] min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={funnelChartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    barSize={20}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        scale="band"
                                        width={100}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip 
                                        content={<CustomTooltip />} 
                                        cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Negócios" radius={[0, 4, 4, 0]}>
                                        {funnelChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <FUNNEL_ICON className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível para exibir</p>
                        </div>
                    )}
                    
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">Valor em Aberto</p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {salesKPIs.openValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">Ganhos (Mês)</p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {salesKPIs.wonCountThisMonth} ({salesKPIs.wonValueThisMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default SalesMetrics;