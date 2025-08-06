import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/common/Card.js';
import { Skeleton } from '../../../components/common/Skeleton.js';
import { 
  facebookMetaService, 
  type WhatsAppAnalytics as WhatsAppAnalyticsType,
  type ConversationAnalytics,
  type TemplateAnalytics,
  type FlowMetrics
} from '../../../services/facebookMetaService.js';
import { useAuthStore } from '../../../stores/authStore.js';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell
} from 'recharts';

interface WhatsAppAnalyticsProps {
  startDate?: Date;
  endDate?: Date;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const WhatsAppAnalytics: React.FC<WhatsAppAnalyticsProps> = ({ startDate, endDate }) => {
  const [analytics, setAnalytics] = useState<WhatsAppAnalyticsType | null>(null);
  const [conversationAnalytics, setConversationAnalytics] = useState<ConversationAnalytics[]>([]);
  const [templateAnalytics, setTemplateAnalytics] = useState<TemplateAnalytics[]>([]);
  const [flowMetrics, setFlowMetrics] = useState<FlowMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeTeam } = useAuthStore();

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!activeTeam?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Load all analytics in parallel
        const [
          analyticsData,
          conversationData,
          templateData,
          flowData
        ] = await Promise.all([
          facebookMetaService.fetchWhatsAppAnalytics(activeTeam.id, startDate, endDate),
          facebookMetaService.fetchConversationAnalytics(activeTeam.id, startDate, endDate),
          facebookMetaService.fetchTemplateAnalytics(activeTeam.id, startDate, endDate),
          facebookMetaService.fetchFlowMetrics(activeTeam.id, startDate, endDate)
        ]);

        setAnalytics(analyticsData);
        setConversationAnalytics(conversationData);
        setTemplateAnalytics(templateData);
        setFlowMetrics(flowData);
      } catch (err) {
        console.error('Failed to load WhatsApp analytics:', err);
        setError('Não foi possível carregar as métricas do WhatsApp. Verifique as configurações da API.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [activeTeam?.id, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Métricas do WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas do WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive p-4 rounded-md bg-destructive/10">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  // Prepare data for the message status chart
  const messageStatusData = [
    {
      name: 'Mensagens',
      Enviadas: analytics.total_messages,
      Entregues: analytics.delivered_messages,
      Lidas: analytics.read_messages,
      Falharam: analytics.failed_messages,
    },
  ];

  // Prepare data for conversation analytics
  const conversationData = conversationAnalytics.map(item => ({
    name: `${item.conversation_category} - ${item.direction}`,
    count: item.count,
    cost: item.total_cost,
  }));

  // Prepare data for template analytics
  const templateData = templateAnalytics.slice(0, 5).map(item => ({
    name: item.template_name,
    Enviados: item.sent_count,
    Entregues: item.delivered_count,
    Lidos: item.read_count,
  }));

  // Prepare data for flow metrics
  const flowData = flowMetrics.map(item => ({
    name: item.flow_id,
    'Taxa de Erro': item.error_rate * 100,
    'Latência Média': item.average_latency,
    'Disponibilidade': item.availability_percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Main Analytics Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Análise da Conta WhatsApp Business</CardTitle>
            <span className="text-sm text-muted-foreground">
              Atualizado {formatDistanceToNow(new Date(analytics.last_updated), { 
                addSuffix: true,
                locale: ptBR 
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total de Mensagens</h3>
              <p className="text-2xl font-bold">{analytics.total_messages.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {analytics.total_messages > 0 
                  ? `${((analytics.delivered_messages / analytics.total_messages) * 100).toFixed(1)}% entregues`
                  : '0% entregues'
                }
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Usuários Ativos</h3>
              <p className="text-2xl font-bold">{analytics.active_users.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                +{analytics.new_users} novos
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Tempo Médio de Resposta</h3>
              <p className="text-2xl font-bold">
                {Math.floor(analytics.average_response_time / 60)}m {Math.floor(analytics.average_response_time % 60)}s
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.error_rate > 0 ? `${(analytics.error_rate * 100).toFixed(1)}% taxa de erro` : 'Sem erros'}
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Modelos de Mensagem</h3>
              <p className="text-2xl font-bold">{analytics.template_messages_sent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {analytics.template_messages_sent > 0 
                  ? `${((analytics.template_messages_read / analytics.template_messages_sent) * 100).toFixed(1)}% taxa de leitura`
                  : '0% taxa de leitura'
                }
              </p>
            </div>
          </div>
          
          {/* Message Status Chart */}
          <div className="h-80">
            <h3 className="text-sm font-medium mb-2">Status das Mensagens</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messageStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Enviadas" fill="#8884d8" />
                <Bar dataKey="Entregues" fill="#82ca9d" />
                <Bar dataKey="Lidas" fill="#ffc658" />
                <Bar dataKey="Falharam" fill="#ff6b6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Analytics */}
      {conversationAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análise de Conversas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Conversas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Analytics */}
      {templateAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análise de Modelos de Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={templateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Enviados" fill="#8884d8" />
                  <Bar dataKey="Entregues" fill="#82ca9d" />
                  <Bar dataKey="Lidos" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flow Metrics */}
      {flowMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Métricas do WhatsApp Flows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {flowMetrics.map((flow, index) => (
                <div key={flow.flow_id} className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Flow: {flow.flow_id}</h3>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Requisições:</span>
                      <span className="text-sm font-medium">{flow.request_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Taxa de Erro:</span>
                      <span className="text-sm font-medium">{(flow.error_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Latência:</span>
                      <span className="text-sm font-medium">{flow.average_latency.toFixed(2)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Disponibilidade:</span>
                      <span className="text-sm font-medium">{flow.availability_percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppAnalytics;
