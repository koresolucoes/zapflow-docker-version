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

    // Get theme colors
    const chartColors = {
        won: 'hsl(var(--success))',
        lost: 'hsl(var(--destructive))',
        intermediate: 'hsl(var(--muted-foreground))',
        hoverBg: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        cardBg: 'hsl(var(--card))',
        cardBorder: 'hsl(var(--border))',
        text: 'hsl(var(--foreground))',
        mutedText: 'hsl(var(--muted-foreground))',
    };

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
            type: stage.type,
        }));
    }, [stages, deals, activePipelineId]);

    // Function to get color based on stage type
    const getStageColor = (type: string) => {
        switch (type) {
            case 'Ganho':
                return chartColors.won;
            case 'Perdido':
                return chartColors.lost;
            default:
                return chartColors.intermediate;
        }
    };

    return (
        <Card className="h-full w-full">
            <div className="p-4 h-full flex flex-col">
                <h2 className="text-lg font-semibold text-foreground mb-4">Métricas de Vendas (Funil)</h2>
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
                                    <CartesianGrid 
                                        strokeDasharray="3 3" 
                                        horizontal={false} 
                                        stroke={chartColors.cardBorder}
                                    />
                                    <XAxis 
                                        type="number" 
                                        hide 
                                    />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        scale="band"
                                        width={100}
                                        tick={{ 
                                            fontSize: 12,
                                            fill: chartColors.mutedText
                                        }}
                                    />
                                    <Tooltip 
                                        content={<CustomTooltip />} 
                                        cursor={{ 
                                            fill: chartColors.hoverBg 
                                        }}
                                    />
                                    <Bar 
                                        dataKey="Negócios" 
                                        radius={[0, 4, 4, 0]}
                                    >
                                        {funnelChartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={getStageColor(entry.type)} 
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <FUNNEL_ICON className="w-12 h-12 text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground">Nenhum dado disponível para exibir</p>
                        </div>
                    )}
                    
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-muted-foreground">Valor em Aberto</p>
                            <p className="font-semibold text-foreground">
                                {salesKPIs.openValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-muted-foreground">Ganhos (Mês)</p>
                            <p className="font-semibold text-foreground">
                                {salesKPIs.wonCountThisMonth} ({salesKPIs.wonValueThisMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                            </p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-muted-foreground">Taxa de Conversão</p>
                            <p className="font-semibold text-foreground">
                                {salesKPIs.conversionRate.toFixed(1)}%
                            </p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-muted-foreground">Negócios no Funil</p>
                            <p className="font-semibold text-foreground">
                                {deals.filter(d => d.pipeline_id === activePipelineId).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default SalesMetrics;