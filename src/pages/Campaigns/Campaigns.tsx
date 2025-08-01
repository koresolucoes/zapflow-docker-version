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
        Sent: "bg-success/10 text-success border border-success/20",
        Draft: "bg-warning/10 text-warning border border-warning/20",
        Failed: "bg-destructive/10 text-destructive border border-destructive/20",
        Scheduled: "bg-info/10 text-info border border-info/20",
        Enviando: "bg-accent/10 text-accent-foreground border border-accent/20"
    };
    
    const displayDate = campaign.sent_at 
        ? campaign.status === 'Scheduled'
            ? isScheduledForFuture
                ? `Agendada para ${new Date(campaign.sent_at).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}`
                : `Iniciada em ${new Date(campaign.sent_at).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}`
            : `Enviada em ${new Date(campaign.sent_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}`
        : 'Não enviada';


    return (
        <Card className="h-full flex flex-col justify-between hover:border-primary/50 border-2 border-border/50 hover:border-primary/70 transition-colors duration-200 group relative overflow-hidden">
             <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-3 right-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Excluir campanha"
            >
                <TRASH_ICON className="w-4 h-4" />
            </Button>
            <div className="p-5">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-semibold text-foreground break-all">{campaign.name}</h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle[statusText]}`}>
                        {statusText}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{displayDate}</p>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <SEND_ICON className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Enviadas</p>
                            <p className="font-bold text-foreground">{campaign.metrics.sent.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <MAIL_CHECK_ICON className="w-5 h-5 text-success" />
                        <div>
                            <p className="text-muted-foreground">Entregues</p>
                            <p className="font-bold text-foreground">{campaign.metrics.delivered.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <MAIL_OPEN_ICON className="w-5 h-5 text-info" />
                        <div>
                            <p className="text-muted-foreground">Lidas</p>
                            <p className="font-bold text-foreground">{campaign.metrics.read.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="text-warning font-bold text-lg">%</span>
                        <div>
                            <p className="text-muted-foreground">Taxa de Leitura</p>
                            <p className="font-bold text-foreground">{readRate}</p>
                        </div>
                    </div>
                </div>
            </div>
             <div className="p-5 pt-0">
                <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails();
                    }} 
                    className="w-full"
                >
                    Ver Relatório Detalhado
                </Button>
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
        <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Campanhas</h1>
                    <p className="text-muted-foreground">Gerencie suas campanhas de mensagens</p>
                </div>
                <Button onClick={() => setCurrentPage('new-campaign')}>
                    <SEND_ICON className="w-4 h-4 mr-2" />
                    Nova Campanha
                </Button>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SEARCH_ICON className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    placeholder="Pesquisar campanhas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12">
                    <TEMPLATE_ICON className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">Nenhuma campanha encontrada</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {searchTerm ? 'Tente alterar sua busca.' : 'Comece criando uma nova campanha.'}
                    </p>
                    <div className="mt-6">
                        <Button onClick={() => setCurrentPage('new-campaign')}>
                            <SEND_ICON className="w-4 h-4 mr-2" />
                            Nova Campanha
                        </Button>
                    </div>
                </div>
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