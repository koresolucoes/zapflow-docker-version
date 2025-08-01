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
        NEW_CONTACT: <CONTACTS_ICON className="w-4 h-4 text-primary" />,
        CAMPAIGN_SENT: <CAMPAIGN_ICON className="w-4 h-4 text-accent" />,
        DEAL_WON: <FUNNEL_ICON className="w-4 h-4 text-success" />,
        DEAL_LOST: <FUNNEL_ICON className="w-4 h-4 text-destructive" />,
    };
    return (
        <div className="w-8 h-8 flex-shrink-0 bg-muted rounded-full flex items-center justify-center">
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
                <h2 className="text-lg font-semibold text-foreground mb-4">Atividades Recentes</h2>
                
                <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground text-sm">Carregando atividades...</p>
                        </div>
                    ) : data?.activityFeed && data.activityFeed.length > 0 ? (
                        <ul className="space-y-3">
                            {data.activityFeed.map((activity, index) => (
                                <li key={index} className="flex items-start pb-3 border-b border-border last:border-0 last:pb-0">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <ActivityIcon type={activity.type} />
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                        <p className="text-sm text-foreground">
                                            {activity.value}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-muted-foreground">
                                                {formatTimeAgo(activity.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <CONTACTS_ICON className="w-6 h-6 text-muted-foreground/60" />
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Nenhuma atividade recente para exibir.
                            </p>
                            <p className="text-muted-foreground/80 text-xs mt-1">
                                As atividades recentes aparecerão aqui.
                            </p>
                        </div>
                    )}
                </div>
                
                <div className="pt-3 mt-auto border-t border-border">
                    <button 
                        onClick={() => {}}
                        className="w-full text-center text-sm font-medium text-primary hover:text-primary/80"
                    >
                        Ver todas as atividades
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default RecentActivityFeed;
