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

// Import components
import { MetricsSummary } from './components/MetricsSummary.js';
import { GoalsMetrics } from './components/GoalsMetrics.js';

interface MetricComponentProps {
  startDate?: string;
  endDate?: string;
}

// Temporary placeholders for missing components
const ResponseTimeMetrics: React.FC<MetricComponentProps> = () => (
  <div className="p-4 border rounded-lg bg-muted/20">
    <h3 className="font-medium mb-2">Tempo de Resposta</h3>
    <p className="text-sm text-muted-foreground">
      Módulo de métricas de tempo de resposta em desenvolvimento.
    </p>
  </div>
);

const StatusMetrics: React.FC<MetricComponentProps> = () => (
  <div className="p-4 border rounded-lg bg-muted/20">
    <h3 className="font-medium mb-2">Status das Mensagens</h3>
    <p className="text-sm text-muted-foreground">
      Módulo de métricas de status em desenvolvimento.
    </p>
  </div>
);

const CampaignMetrics: React.FC<MetricComponentProps> = () => (
  <div className="p-4 border rounded-lg bg-muted/20">
    <h3 className="font-medium mb-2">Métricas de Campanhas</h3>
    <p className="text-sm text-muted-foreground">
      Módulo de métricas de campanhas em desenvolvimento.
    </p>
  </div>
);

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
      // Data fetching will be handled by individual components
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
            Visualize as métricas de desempenho das suas mensagens e metas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-[250px]"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMetrics} 
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <span className="hidden sm:inline">Metas</span>
            <span className="inline sm:hidden">🎯</span>
          </TabsTrigger>
          <TabsTrigger value="summary">Visão Geral</TabsTrigger>
          <TabsTrigger value="response-time">Tempo de Resposta</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          <GoalsMetrics 
            startDate={dateRange?.from ? formatDate(dateRange.from) : undefined}
            endDate={dateRange?.to ? formatDate(dateRange.to) : undefined}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <MetricsSummary 
            startDate={dateRange?.from ? formatDate(dateRange.from) : undefined}
            endDate={dateRange?.to ? formatDate(dateRange.to) : undefined}
          />
        </TabsContent>

        <TabsContent value="response-time" className="space-y-4">
          <ResponseTimeMetrics 
            startDate={dateRange?.from ? formatDate(dateRange.from) : undefined}
            endDate={dateRange?.to ? formatDate(dateRange.to) : undefined}
          />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <StatusMetrics 
            startDate={dateRange?.from ? formatDate(dateRange.from) : undefined}
            endDate={dateRange?.to ? formatDate(dateRange.to) : undefined}
          />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignMetrics 
            startDate={dateRange?.from ? formatDate(dateRange.from) : undefined}
            endDate={dateRange?.to ? formatDate(dateRange.to) : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Metrics;
