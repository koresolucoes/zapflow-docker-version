import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../../components/common/Card.js';
import { useAuthStore } from '../../stores/authStore.js';
import { CustomTooltip } from './Dashboard.js';
import { FUNNEL_ICON } from '../../components/icons/index.js';
import { useUiStore } from '../../stores/uiStore.js';
import { useNavigate } from 'react-router-dom';

const SalesMetrics: React.FC = () => {
    const { deals, stages, activePipelineId } = useAuthStore();
    const { theme } = useUiStore();
    const navigate = useNavigate();

    // Get theme colors from CSS variables
    const chartColors = {
        won: 'hsl(var(--success))',
        lost: 'hsl(var(--destructive))',
        intermediate: 'hsl(var(--muted-foreground))',
        hoverBg: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        cardBg: 'hsl(var(--card))',
        cardBorder: 'hsl(var(--border))',
        text: 'hsl(var(--foreground))',
        mutedText: 'hsl(var(--muted-foreground))',
        primary: 'hsl(var(--primary))',
        primaryForeground: 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        secondaryForeground: 'hsl(var(--secondary-foreground))',
        accent: 'hsl(var(--accent))',
        accentForeground: 'hsl(var(--accent-foreground))',
        muted: 'hsl(var(--muted))',
        mutedForeground: 'hsl(var(--muted-foreground))',
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
            totalDeals: relevantDeals.length,
        };
    }, [deals, activePipelineId]);

    const funnelChartData = useMemo(() => {
        const activeStages = stages
            .filter(s => s.pipeline_id === activePipelineId)
            .sort((a, b) => a.sort_order - b.sort_order);
            
        return activeStages.map(stage => ({
            name: stage.name,
            value: deals.filter(d => d.stage_id === stage.id).length,
            type: stage.type,
            color: getStageColor(stage.type)
        }));
    }, [stages, deals, activePipelineId]);

    function getStageColor(type: string) {
        switch (type) {
            case 'Ganho':
                return chartColors.won;
            case 'Perdido':
                return chartColors.lost;
            default:
                return chartColors.primary;
        }
    }

    const handleViewAllDeals = () => {
        navigate('/deals');
    };

    return (
        <Card className="h-full w-full flex flex-col">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Métricas de Vendas (Funil)</h2>
                    <button 
                        onClick={handleViewAllDeals}
                        className="text-xs text-primary hover:underline"
                    >
                        Ver todos
                    </button>
                </div>
            </div>
            
            <div className="flex-1 px-4 pb-4 overflow-y-auto">
                {funnelChartData.length > 0 ? (
                    <div className="w-full h-[200px] min-h-[200px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={funnelChartData}
                                layout="vertical"
                                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                barSize={16}
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
                                        fill: chartColors.mutedText,
                                        fontFamily: 'var(--font-sans)'
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    content={<CustomTooltip />} 
                                    cursor={{ 
                                        fill: chartColors.hoverBg,
                                        radius: 4
                                    }}
                                    contentStyle={{
                                        backgroundColor: chartColors.cardBg,
                                        borderColor: chartColors.cardBorder,
                                        borderRadius: 'var(--radius)',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        fontFamily: 'var(--font-sans)'
                                    }}
                                    itemStyle={{
                                        color: chartColors.text,
                                        fontSize: '12px',
                                        fontFamily: 'var(--font-sans)'
                                    }}
                                    labelStyle={{
                                        color: chartColors.text,
                                        fontWeight: 500,
                                        fontSize: '12px',
                                        fontFamily: 'var(--font-sans)'
                                    }}
                                />
                                <Bar 
                                    dataKey="value" 
                                    radius={[0, 4, 4, 0]}
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                >
                                    {funnelChartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke={chartColors.cardBorder}
                                            strokeWidth={1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 h-[200px]">
                        <FUNNEL_ICON className="w-12 h-12 text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground">Nenhum dado disponível para exibir</p>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                        <p className="text-muted-foreground">Valor em Aberto</p>
                        <p className="font-semibold text-foreground">
                            {salesKPIs.openValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                        <p className="text-muted-foreground">Ganhos (Mês)</p>
                        <p className="font-semibold text-foreground">
                            {salesKPIs.wonCountThisMonth} ({salesKPIs.wonValueThisMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                        </p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                        <p className="text-muted-foreground">Taxa de Conversão</p>
                        <p className="font-semibold text-foreground">
                            {salesKPIs.conversionRate.toFixed(1)}%
                        </p>
                    </div>
                    <div 
                        className="bg-muted/50 p-3 rounded-lg border border-border/50 hover:bg-muted/70 cursor-pointer transition-colors"
                        onClick={handleViewAllDeals}
                    >
                        <p className="text-muted-foreground">Negócios no Funil</p>
                        <p className="font-semibold text-foreground">
                            {salesKPIs.totalDeals}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default SalesMetrics;