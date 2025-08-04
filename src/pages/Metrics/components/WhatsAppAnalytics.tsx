import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/common/Card.js';
import { Skeleton } from '../../../components/common/Skeleton.js';
import { facebookMetaService, type WhatsAppAnalytics as WhatsAppAnalyticsType } from '../../../services/facebookMetaService.js';
import { useAuthStore } from '../../../stores/authStore.js';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface WhatsAppAnalyticsProps {
  startDate?: Date;
  endDate?: Date;
}

const WhatsAppAnalytics: React.FC<WhatsAppAnalyticsProps> = ({ startDate, endDate }) => {
  const [analytics, setAnalytics] = useState<WhatsAppAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeTeam } = useAuthStore();

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!activeTeam?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await facebookMetaService.fetchWhatsAppAnalytics(
          activeTeam.id,
          startDate,
          endDate
        );
        setAnalytics(data);
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
      <Card className="col-span-2">
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
    );
  }

  if (error) {
    return (
      <Card className="col-span-2">
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

  // Prepare data for the chart
  const chartData = [
    {
      name: 'Mensagens',
      Enviadas: analytics.total_messages,
      Entregues: analytics.delivered_messages,
      Lidas: analytics.read_messages,
    },
  ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Métricas do WhatsApp</CardTitle>
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
              {((analytics.delivered_messages / analytics.total_messages) * 100).toFixed(1)}% entregues
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
              {Math.floor(analytics.average_response_time / 60)}m {analytics.average_response_time % 60}s
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.error_rate > 0 ? `${(analytics.error_rate * 100).toFixed(1)}% taxa de erro` : 'Sem erros'}
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Modelos de Mensagem</h3>
            <p className="text-2xl font-bold">{analytics.template_messages_sent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {((analytics.template_messages_read / analytics.template_messages_sent) * 100).toFixed(1)}% taxa de leitura
            </p>
          </div>
        </div>
        
        {/* Message Status Chart */}
        <div className="h-80">
          <h3 className="text-sm font-medium mb-2">Status das Mensagens</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Enviadas" fill="#8884d8" />
              <Bar dataKey="Entregues" fill="#82ca9d" />
              <Bar dataKey="Lidas" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppAnalytics;
