import React, { useMemo } from 'react';
import { Card } from '../../components/common/Card.js';
import { useAuthStore } from '../../stores/authStore.js';
import { CAMPAIGN_ICON } from '../../components/icons/index.js';
import { useNavigate } from 'react-router-dom';

const CampaignAnalytics: React.FC = () => {
    const { campaigns, setCurrentPage } = useAuthStore();
    const navigate = useNavigate();

    const stats = useMemo(() => {
        if (campaigns.length === 0) {
            return {
                totalSent: 0,
                overallReadRate: '0.0%',
                totalCampaigns: 0,
            };
        }
        
        const totalSent = campaigns.reduce((sum, c) => sum + c.metrics.sent, 0);
        const totalRead = campaigns.reduce((sum, c) => sum + c.metrics.read, 0);

        const overallReadRate = totalSent > 0
            ? ((totalRead / totalSent) * 100).toFixed(1) + '%'
            : '0.0%';

        return {
            totalSent,
            overallReadRate,
            totalCampaigns: campaigns.length,
        };
    }, [campaigns]);

    const mostRecentCampaigns = useMemo(() => {
        return [...campaigns]
            .filter(c => c.sent_at)
            .sort((a, b) => new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime())
            .slice(0, 5);
    }, [campaigns]);

    const handleCampaignClick = (campaignId: string) => {
        navigate(`/campaigns/${campaignId}`);
    };

    const handleViewAll = () => {
        navigate('/campaigns');
    };

    return (
        <Card className="h-full w-full flex flex-col">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Análise de Campanhas</h2>
                    <button 
                        onClick={handleViewAll}
                        className="text-xs text-primary hover:underline"
                    >
                        Ver todas
                    </button>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                        <p className="text-xl font-bold text-primary">{stats.totalCampaigns}</p>
                        <p className="text-xs text-muted-foreground">Campanhas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-foreground">
                            {stats.totalSent.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">Enviadas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-success">
                            {stats.overallReadRate}
                        </p>
                        <p className="text-xs text-muted-foreground">Taxa de Leitura</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 pb-4 overflow-y-auto">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Campanhas Recentes</h3>
                
                {mostRecentCampaigns.length > 0 ? (
                    <ul className="space-y-3">
                        {mostRecentCampaigns.map(campaign => (
                            <li 
                                key={campaign.id} 
                                className="flex items-start p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => handleCampaignClick(campaign.id)}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    <CAMPAIGN_ICON className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {campaign.name}
                                    </p>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Enviada em {new Date(campaign.sent_at!).toLocaleDateString('pt-BR')}</span>
                                        <span className="font-medium">
                                            {campaign.metrics.read} / {campaign.metrics.sent}
                                        </span>
                                    </div>
                                    <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                                        <div 
                                            className="bg-primary h-1.5 rounded-full" 
                                            style={{ 
                                                width: `${(campaign.metrics.read / (campaign.metrics.sent || 1)) * 100}%` 
                                            }}
                                        />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 h-full">
                        <CAMPAIGN_ICON className="w-10 h-10 text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground text-sm">
                            Nenhuma campanha encontrada.
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default CampaignAnalytics;