import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../components/common/Card.js';
import { useAuthStore } from '../../stores/authStore.js';
import { CustomTooltip } from './Dashboard.js';
import { CONTACTS_ICON } from '../../components/icons/index.js';

const ContactGrowth: React.FC = () => {
    const { contacts, allTags } = useAuthStore();

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
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Crescimento de Contatos</h2>
                <div className="flex-1 flex flex-col">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Últimos 30 dias</h3>
                    
                    {growthData.length > 0 ? (
                        <div className="w-full h-[180px] min-h-[180px] mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart 
                                    data={growthData} 
                                    margin={{ top: 5, right: 10, left: -15, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fill: '#94a3b8' }} 
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{ fill: '#94a3b8' }} 
                                        allowDecimals={false}
                                        axisLine={false}
                                        tickLine={false}
                                        width={25}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="Novos Contatos" 
                                        stroke="#34d399" 
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff', strokeOpacity: 0.5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <CONTACTS_ICON className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhum novo contato registrado</p>
                        </div>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Tags Populares</h3>
                        {popularTags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {popularTags.map(([tag, count]) => (
                                    <div 
                                        key={tag}
                                        className="flex items-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded-full"
                                    >
                                        <span className="truncate max-w-[100px]">{tag}</span>
                                        <span className="ml-1.5 font-medium text-slate-900 dark:text-white">{count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma tag utilizada</p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ContactGrowth;