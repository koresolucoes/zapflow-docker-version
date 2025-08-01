import React, { useEffect, useMemo, useState } from 'react';
import { Message, MessageTemplate } from '../../types/index.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { ARROW_LEFT_ICON, SEND_ICON, MAIL_CHECK_ICON, MAIL_OPEN_ICON, ALERT_TRIANGLE_ICON } from '../../components/icons/index.js';
import { useAuthStore } from '../../stores/authStore.js';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 bg-muted rounded-lg">
            {icon}
        </div>
        <div className="ml-4">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
    </Card>
);

const MessageStatusBadge: React.FC<{ status: Message['status'] }> = ({ status }) => {
    const statusInfo = {
        sent: { text: 'Enviada', style: 'bg-primary/10 text-primary' },
        delivered: { text: 'Entregue', style: 'bg-success/10 text-success' },
        read: { text: 'Lida', style: 'bg-pink-500/10 text-pink-500' },
        failed: { text: 'Falhou', style: 'bg-destructive/10 text-destructive' },
        pending: { text: 'Pendente', style: 'bg-warning/10 text-warning' },
    };
    const info = statusInfo[status] || { text: status, style: 'bg-muted text-foreground' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${info.style}`}>{info.text}</span>;
};

const TemplatePreview: React.FC<{ template: MessageTemplate | null }> = ({ template }) => {
    if (!template) {
        return <p className="text-sm text-muted-foreground">Informações do template não disponíveis.</p>;
    }

    const header = template.components?.find(c => c.type === 'HEADER');
    const body = template.components?.find(c => c.type === 'BODY');

    return (
        <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-mono text-foreground">{template.template_name}</h3>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-muted text-foreground">
                    {template.category}
                </span>
            </div>
            <div className="text-sm text-foreground font-mono whitespace-pre-wrap space-y-2">
                {header?.text && <p className="font-bold">{header.text}</p>}
                {body?.text && <p>{body.text}</p>}
            </div>
        </div>
    );
};


const CampaignDetails: React.FC = () => {
    const { pageParams, setCurrentPage, campaignDetails, fetchCampaignDetails } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const loadDetails = async () => {
            if (pageParams.campaignId) {
                setIsLoading(true);
                try {
                    await fetchCampaignDetails(pageParams.campaignId);
                } catch (error) {
                    console.error("Failed to load campaign details:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        loadDetails();
    }, [pageParams.campaignId, fetchCampaignDetails]);

    const readRate = useMemo(() => {
        if (!campaignDetails || !campaignDetails.metrics.sent) return '0.0%';
        return ((campaignDetails.metrics.read / campaignDetails.metrics.sent) * 100).toFixed(1) + '%';
    }, [campaignDetails]);

    if (isLoading) {
        return <div className="text-center text-foreground">Carregando detalhes da campanha...</div>;
    }

    if (!campaignDetails) {
        return (
            <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">Campanha não encontrada.</h2>
                <p className="text-muted-foreground mt-2">Não foi possível carregar os detalhes da campanha solicitada.</p>
                <Button className="mt-4" onClick={() => setCurrentPage('campaigns')}>
                    <ARROW_LEFT_ICON className="w-5 h-5 mr-2" />
                    Voltar para Campanhas
                </Button>
            </div>
        );
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return <span className="text-muted-foreground/50">-</span>;
        return new Date(dateString).toLocaleString('pt-BR', {timeZone: 'UTC'});
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground truncate pr-4">Detalhes: {campaignDetails.name}</h1>
                <Button variant="secondary" onClick={() => setCurrentPage('campaigns')}>
                    <ARROW_LEFT_ICON className="w-5 h-5 mr-2" />
                    Voltar para Campanhas
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Enviadas" value={campaignDetails.metrics.sent.toLocaleString('pt-BR')} icon={<SEND_ICON className="w-6 h-6 text-primary" />} />
                <StatCard title="Entregues" value={campaignDetails.metrics.delivered.toLocaleString('pt-BR')} icon={<MAIL_CHECK_ICON className="w-6 h-6 text-success" />} />
                <StatCard title="Lidas" value={campaignDetails.metrics.read.toLocaleString('pt-BR')} icon={<MAIL_OPEN_ICON className="w-6 h-6 text-pink-500" />} />
                <StatCard title="Falhas" value={campaignDetails.metrics.failed.toLocaleString('pt-BR')} icon={<ALERT_TRIANGLE_ICON className="w-6 h-6 text-destructive" />} />
                <StatCard title="Taxa de Leitura" value={readRate} icon={<span className="text-foreground font-bold text-xl">%</span>} />
            </div>

            <Card>
                <h2 className="text-lg font-semibold text-foreground mb-2">Template Utilizado</h2>
                <TemplatePreview template={campaignDetails.message_templates} />
            </Card>

            <Card>
                <h2 className="text-lg font-semibold text-foreground mb-4">Relatório de Envio Individual</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="p-3 text-sm font-semibold text-muted-foreground">Destinatário</th>
                                <th className="p-3 text-sm font-semibold text-muted-foreground">Status</th>
                                <th className="p-3 text-sm font-semibold text-muted-foreground">Detalhes do Erro</th>
                                <th className="p-3 text-sm font-semibold text-muted-foreground">Entregue em</th>
                                <th className="p-3 text-sm font-semibold text-muted-foreground">Lido em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaignDetails.messages.map(msg => (
                                <tr key={msg.id} className="border-b border-border/50 hover:bg-muted/30 text-sm">
                                    <td className="p-3 font-medium text-foreground">
                                        <div>{msg.contacts?.name || 'N/A'}</div>
                                        <div className="font-mono text-xs text-muted-foreground">{msg.contacts?.phone || 'N/A'}</div>
                                    </td>
                                    <td className="p-3"><MessageStatusBadge status={msg.status} /></td>
                                    <td className="p-3 text-destructive font-mono text-xs max-w-xs break-words">
                                        {msg.status === 'failed' ? msg.error_message : <span className="text-muted-foreground/50">-</span>}
                                    </td>
                                    <td className="p-3 text-muted-foreground">{formatDate(msg.delivered_at)}</td>
                                    <td className="p-3 text-muted-foreground">{formatDate(msg.read_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default CampaignDetails;