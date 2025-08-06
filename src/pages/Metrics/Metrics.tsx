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
import WhatsAppAnalytics  from './components/WhatsAppAnalytics.js';
import PerformanceMetrics from './components/PerformanceMetrics.js';

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
  const { session, activeTeam } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');

  const formatDateForApi = (date: Date | undefined): string | undefined => {
    return date ? format(date, 'yyyy-MM-dd') : undefined;
  };

  const formattedStartDate = dateRange?.from ? formatDateForApi(dateRange.from) : undefined;
  const formattedEndDate = dateRange?.to ? formatDateForApi(dateRange.to) : undefined;

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

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Métricas e Relatórios</h1>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateChange}
            className="[&>button]:w-[260px]"
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

      <Tabs 
        defaultValue="overview" 
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricsSummary startDate={formattedStartDate} endDate={formattedEndDate} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <GoalsMetrics startDate={formattedStartDate} endDate={formattedEndDate} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Status Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusMetrics startDate={formattedStartDate} endDate={formattedEndDate} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppAnalytics 
            startDate={dateRange?.from} 
            endDate={dateRange?.to} 
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMetrics 
            startDate={dateRange?.from} 
            endDate={dateRange?.to} 
          />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignMetrics startDate={formattedStartDate} endDate={formattedEndDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Metrics;
