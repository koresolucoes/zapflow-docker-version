import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../components/common/Card.js';
import { useAuthStore } from '../../stores/authStore.js';
import { CustomTooltip } from './Dashboard.js';
import { CONTACTS_ICON } from '../../components/icons/index.js';
import { useUiStore } from '../../stores/uiStore.js';

const ContactGrowth: React.FC = () => {
    const { contacts, allTags } = useAuthStore();
    const { theme } = useUiStore();

    // Get theme colors
    const chartColors = {
        grid: 'hsl(var(--muted))',
        text: 'hsl(var(--muted-foreground))',
        line: 'hsl(var(--primary))',
        activeDot: 'hsl(var(--background))',
    };

    const growthData = useMemo(() => {
        const countsByDay: { [key: string]: number } = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        contacts.forEach(contact => {
            const createdAt = new Date(contact.created_at);
            if (createdAt >= thirtyDaysAgo) {
                const day = createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                countsByDay[day] = (countsByDay[day] || 0) + 1;
            }
        });

        const sortedDays = Object.keys(countsByDay).sort((a, b) => {
            const [dayA, monthA] = a.split('/').map(Number);
            const [dayB, monthB] = b.split('/').map(Number);
            return new Date(2000, monthA - 1, dayA).getTime() - new Date(2000, monthB - 1, dayB).getTime();
        });

        return sortedDays.map(day => ({
            name: day,
            'Novos Contatos': countsByDay[day],
        }));
    }, [contacts]);

    const popularTags = useMemo(() => {
        const tagCounts: { [key: string]: number } = {};
        contacts.forEach(contact => {
            contact.tags?.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        return Object.entries(tagCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5);
    }, [contacts]);

    return (
        <Card className="h-full w-full">
            <div className="p-4 h-full flex flex-col">
                <h2 className="text-lg font-semibold text-foreground mb-4">Crescimento de Contatos</h2>
                <div className="flex-1 flex flex-col">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Últimos 30 dias</h3>
                    
                    {growthData.length > 0 ? (
                        <div className="w-full h-[180px] min-h-[180px] mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart 
                                    data={growthData} 
                                    margin={{ top: 5, right: 10, left: -15, bottom: 5 }}
                                >
                                    <CartesianGrid 
                                        strokeDasharray="3 3" 
                                        vertical={false} 
                                        stroke={chartColors.grid} 
                                    />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fill: chartColors.text }} 
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{ fill: chartColors.text }} 
                                        allowDecimals={false}
                                        axisLine={false}
                                        tickLine={false}
                                        width={25}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="Novos Contatos" 
                                        stroke={chartColors.line} 
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ 
                                            r: 4, 
                                            strokeWidth: 2, 
                                            stroke: chartColors.activeDot, 
                                            strokeOpacity: 0.5 
                                        }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <CONTACTS_ICON className="w-10 h-10 text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground">Nenhum novo contato registrado</p>
                        </div>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-border">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Tags Populares</h3>
                        {popularTags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {popularTags.map(([tag, count]) => (
                                    <span 
                                        key={tag} 
                                        className="px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground"
                                    >
                                        {tag} ({count})
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma tag encontrada</p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ContactGrowth;