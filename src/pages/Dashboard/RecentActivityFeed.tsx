import React from 'react';
import { Card } from '../../components/common/Card.js';
import { DashboardData, GlobalActivityEvent } from '../../services/dataService.js';
import { CONTACTS_ICON, CAMPAIGN_ICON, FUNNEL_ICON } from '../../components/icons/index.js';

interface RecentActivityFeedProps {
    data: DashboardData | null;
    isLoading: boolean;
}

const ActivityIcon: React.FC<{ type: GlobalActivityEvent['type'] }> = ({ type }) => {
    const icons = {
        NEW_CONTACT: <CONTACTS_ICON className="w-4 h-4 text-sky-400" />,
        CAMPAIGN_SENT: <CAMPAIGN_ICON className="w-4 h-4 text-pink-400" />,
        DEAL_WON: <FUNNEL_ICON className="w-4 h-4 text-green-400" />,
        DEAL_LOST: <FUNNEL_ICON className="w-4 h-4 text-red-400" />,
    };
    return (
        <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center">
            {icons[type]}
        </div>
    );
};

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ data, isLoading }) => {
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " anos atrás";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses atrás";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " dias atrás";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas atrás";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos atrás";
        return "agora mesmo";
    };

    return (
        <Card className="h-full w-full">
            <div className="p-4 h-full flex flex-col">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Atividades Recentes</h2>
                
                <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando atividades...</p>
                        </div>
                    ) : data?.activityFeed && data.activityFeed.length > 0 ? (
                        <ul className="space-y-3">
                            {data.activityFeed.map((activity, index) => (
                                <li key={index} className="flex items-start pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <ActivityIcon type={activity.type} />
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                        <p className="text-sm text-slate-800 dark:text-slate-200">
                                            {activity.value}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {formatTimeAgo(activity.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                <CONTACTS_ICON className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Nenhuma atividade recente para exibir.
                            </p>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                                As atividades recentes aparecerão aqui.
                            </p>
                        </div>
                    )}
                </div>
                
                <div className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-700">
                    <button 
                        onClick={() => {}}
                        className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        Ver todas as atividades
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default RecentActivityFeed;
