import React, { useState, useMemo } from 'react';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { TEMPLATE_ICON, SEND_ICON, MAIL_CHECK_ICON, MAIL_OPEN_ICON, TRASH_ICON, SEARCH_ICON } from '../../components/icons/index.js';
import { CampaignWithMetrics } from '../../types/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const CampaignCard: React.FC<{ campaign: CampaignWithMetrics; onViewDetails: () => void; onDelete: () => void; }> = ({ campaign, onViewDetails, onDelete }) => {
    const readRate = campaign.metrics.sent > 0 ? ((campaign.metrics.read / campaign.metrics.sent) * 100).toFixed(1) + '%' : '0.0%';
    const isScheduledForFuture = campaign.sent_at && new Date(campaign.sent_at) > new Date();
    const statusText = campaign.status === 'Scheduled' && !isScheduledForFuture ? 'Enviando' : campaign.status;

    const statusStyle: Record<string, string> = {
        Sent: "bg-success/10 text-success border-success/50",
        Draft: "bg-warning/10 text-warning border-warning/50",
        Failed: "bg-destructive/10 text-destructive border-destructive/50",
        Scheduled: "bg-info/10 text-info border-info/50",
        Enviando: "bg-accent/10 text-accent-foreground border-accent/50"
    };
    
    const displayDate = campaign.sent_at 
        ? campaign.status === 'Scheduled'
            ? isScheduledForFuture
                ? `Agendada para ${new Date(campaign.sent_at).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}`
                : `Iniciada em ${new Date(campaign.sent_at).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}`
            : `Enviada em ${new Date(campaign.sent_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}`
        : 'Não enviada';

    return (
        <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-md dark:hover:shadow-sky-500/10 hover:-translate-y-0.5">
            <div className="flex-1 flex flex-col p-6">
                <div className="flex justify-between items-start gap-3 mb-4">
                    <h3 className="text-lg font-medium text-foreground line-clamp-2">
                        {campaign.name}
                    </h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusStyle[statusText]}`}>
                        {statusText}
                    </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">{displayDate}</p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="bg-muted/30 dark:bg-slate-800/30 p-3 rounded-md">
                        <div className="flex items-center gap-2">
                            <SEND_ICON className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Enviadas</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">{campaign.metrics.sent.toLocaleString('pt-BR')}</p>
                    </div>
                    
                    <div className="bg-muted/30 dark:bg-slate-800/30 p-3 rounded-md">
                        <div className="flex items-center gap-2">
                            <MAIL_CHECK_ICON className="w-4 h-4 text-success" />
                            <span className="text-muted-foreground">Entregues</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">{campaign.metrics.delivered.toLocaleString('pt-BR')}</p>
                    </div>
                    
                    <div className="bg-muted/30 dark:bg-slate-800/30 p-3 rounded-md">
                        <div className="flex items-center gap-2">
                            <MAIL_OPEN_ICON className="w-4 h-4 text-info" />
                            <span className="text-muted-foreground">Lidas</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">{campaign.metrics.read.toLocaleString('pt-BR')}</p>
                    </div>
                    
                    <div className="bg-muted/30 dark:bg-slate-800/30 p-3 rounded-md">
                        <div className="flex items-center gap-2">
                            <span className="text-warning font-bold">%</span>
                            <span className="text-muted-foreground">Taxa de Leitura</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">{readRate}</p>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border">
                    <div className="flex justify-between items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="text-destructive hover:bg-destructive/10"
                        >
                            <TRASH_ICON className="w-4 h-4 mr-2" />
                            Excluir
                        </Button>
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails();
                            }}
                            className="ml-auto"
                        >
                            Ver Detalhes
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const Campaigns: React.FC = () => {
    const { campaigns, deleteCampaign, setCurrentPage } = useAuthStore();
    const { addToast, showConfirmation } = useUiStore();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCampaigns = useMemo(() => {
        if (!searchTerm) return campaigns;
        const lowercasedTerm = searchTerm.toLowerCase();
        return campaigns.filter(campaign =>
            campaign.name.toLowerCase().includes(lowercasedTerm) ||
            campaign.status.toLowerCase().includes(lowercasedTerm)
        );
    }, [campaigns, searchTerm]);

    const handleDeleteCampaign = async (campaignId: string) => {
        showConfirmation(
            'Excluir Campanha',
            'Tem certeza de que deseja excluir esta campanha? Esta ação não pode ser desfeita.',
            async () => {
                try {
                    await deleteCampaign(campaignId);
                    addToast('Campanha excluída com sucesso.', 'success');
                } catch (err: any) {
                    addToast(`Erro ao excluir campanha: ${err.message}`, 'error');
                }
            }
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Campanhas</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie suas campanhas de mensagens
                    </p>
                </div>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-64">
                        <SEARCH_ICON className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar campanhas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm"
                        />
                    </div>
                    <Button 
                        variant="default" 
                        onClick={() => setCurrentPage('new-campaign')}
                        className="whitespace-nowrap"
                    >
                        <SEND_ICON className="w-4 h-4 mr-2" />
                        Nova Campanha
                    </Button>
                </div>
            </div>

            {filteredCampaigns.length === 0 ? (
                <Card className="text-center p-8 border-dashed">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <SEND_ICON className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-foreground">
                        {searchTerm ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha criada'}
                    </h2>
                    <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
                        {searchTerm 
                            ? `Sua busca por "${searchTerm}" não retornou resultados.` 
                            : 'Crie sua primeira campanha para começar a enviar mensagens.'}
                    </p>
                    <Button 
                        variant="default" 
                        onClick={() => setCurrentPage('new-campaign')}
                        size="lg"
                    >
                        <SEND_ICON className="w-4 h-4 mr-2" />
                        Criar Primeira Campanha
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCampaigns.map((campaign) => (
                        <CampaignCard
                            key={campaign.id}
                            campaign={campaign}
                            onViewDetails={() => {
                                setCurrentPage('campaign-details', { campaignId: campaign.id });
                            }}
                            onDelete={() => handleDeleteCampaign(campaign.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Campaigns;