import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { supabase } from '../../lib/supabaseClient.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/common/Tabs.js';
import { Button } from '../../components/common/Button.js';
import { DateRangePicker } from '../../components/common/DateRangePicker.js';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes que serão implementados
const MetricsSummary = () => <div>Resumo de Métricas</div>;
const ResponseTimeMetrics = () => <div>Tempo de Resposta</div>;
const StatusMetrics = () => <div>Métricas por Status</div>;
const CampaignMetrics = () => <div>Métricas de Campanhas</div>;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const Metrics = () => {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  useEffect(() => {
    if (session) {
      fetchMetrics();
    }
  }, [session, dateRange]);

  const fetchMetrics = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      // Aqui vamos buscar os dados da API
      // Exemplo: const response = await fetchMetricsData();
      // Vamos implementar a lógica de busca em cada componente específico
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Métricas e Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize as métricas de desempenho das suas mensagens
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-[250px]"
          />
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Visão Geral</TabsTrigger>
          <TabsTrigger value="response-time">Tempo de Resposta</TabsTrigger>
          <TabsTrigger value="status">Status das Mensagens</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <MetricsSummary />
        </TabsContent>

        <TabsContent value="response-time" className="space-y-4">
          <ResponseTimeMetrics />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <StatusMetrics />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Metrics;
