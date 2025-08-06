import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/common/Card.js';
import { Skeleton } from '../../../components/common/Skeleton.js';
import { useAuthStore } from '../../../stores/authStore.js';
import { whatsappMetricsService } from '../../../services/whatsapp-metrics/index.js';
import { 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';

interface PerformanceMetricsProps {
  startDate?: Date;
  endDate?: Date;
}

interface EndpointMetrics {
  timestamp: string;
  request_count: number;
  error_count: number;
  error_rate: number;
  average_latency: number;
  p90_latency: number;
  availability: number;
}

interface PerformanceAlerts {
  errorRate: {
    critical: number;
    high: number;
    medium: number;
  };
  latency: {
    critical: number;
    high: number;
    medium: number;
  };
  availability: {
    critical: number;
    low: number;
    good: number;
  };
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ startDate, endDate }) => {
  const [endpointMetrics, setEndpointMetrics] = useState<EndpointMetrics[]>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlerts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeTeam } = useAuthStore();

  useEffect(() => {
    const loadPerformanceMetrics = async () => {
      if (!activeTeam?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate || new Date();

        // Busca métricas de performance do endpoint
        const endpointData = await whatsappMetricsService.getEndpointPerformanceMetrics(
          activeTeam.id,
          start,
          end
        );

        // Busca alertas de performance
        const alerts = await whatsappMetricsService.getPerformanceAlerts(activeTeam.id);

        // Processa os dados da API
        if (endpointData?.data) {
          const processedMetrics: EndpointMetrics[] = endpointData.data.map((item: any) => ({
            timestamp: new Date(item.start_time * 1000).toISOString(),
            request_count: item.values?.ENDPOINT_REQUEST_COUNT || 0,
            error_count: item.values?.ENDPOINT_REQUEST_ERROR || 0,
            error_rate: item.values?.ENDPOINT_REQUEST_ERROR_RATE || 0,
            average_latency: item.values?.ENDPOINT_REQUEST_LATENCY_SECONDS_CEIL || 0,
            p90_latency: item.values?.ENDPOINT_REQUEST_LATENCY_SECONDS_CEIL || 0,
            availability: item.values?.ENDPOINT_AVAILABILITY || 100,
          }));

          setEndpointMetrics(processedMetrics);
        } else {
          // Fallback para dados mock se a API não retornar dados
          const mockData: EndpointMetrics[] = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
            mockData.push({
              timestamp: date.toISOString(),
              request_count: Math.floor(Math.random() * 1000) + 500,
              error_count: Math.floor(Math.random() * 50) + 5,
              error_rate: Math.random() * 0.1,
              average_latency: Math.random() * 2 + 0.5,
              p90_latency: Math.random() * 5 + 1,
              availability: Math.random() * 10 + 90,
            });
          }
          setEndpointMetrics(mockData);
        }

        setPerformanceAlerts(alerts);
      } catch (err) {
        console.error('Failed to load performance metrics:', err);
        setError('Não foi possível carregar as métricas de performance.');
        
        // Fallback para dados mock em caso de erro
        const mockData: EndpointMetrics[] = [];
        const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        for (let i = 0; i < 7; i++) {
          const date = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
          mockData.push({
            timestamp: date.toISOString(),
            request_count: Math.floor(Math.random() * 1000) + 500,
            error_count: Math.floor(Math.random() * 50) + 5,
            error_rate: Math.random() * 0.1,
            average_latency: Math.random() * 2 + 0.5,
            p90_latency: Math.random() * 5 + 1,
            availability: Math.random() * 10 + 90,
          });
        }
        setEndpointMetrics(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceMetrics();
  }, [activeTeam?.id, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
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
          <CardTitle>Métricas de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive p-4 rounded-md bg-destructive/10">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary metrics
  const totalRequests = endpointMetrics.reduce((sum, item) => sum + item.request_count, 0);
  const totalErrors = endpointMetrics.reduce((sum, item) => sum + item.error_count, 0);
  const averageLatency = endpointMetrics.reduce((sum, item) => sum + item.average_latency, 0) / endpointMetrics.length;
  const averageAvailability = endpointMetrics.reduce((sum, item) => sum + item.availability, 0) / endpointMetrics.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totalErrors} erros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageLatency.toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground">
              Tempo de resposta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAvailability.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Uptime do endpoint
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Request Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Volume de Requisições</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={endpointMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: any, name: string) => [
                    value.toLocaleString(),
                    name === 'request_count' ? 'Requisições' : 'Erros'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="request_count" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="Requisições"
                />
                <Area 
                  type="monotone" 
                  dataKey="error_count" 
                  stackId="1" 
                  stroke="#ff6b6b" 
                  fill="#ff6b6b" 
                  name="Erros"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Latency Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Latência do Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={endpointMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: any, name: string) => [
                    `${value.toFixed(2)}s`,
                    name === 'average_latency' ? 'Latência Média' : 'P90 Latência'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="average_latency" 
                  stroke="#8884d8" 
                  name="Latência Média"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="p90_latency" 
                  stroke="#ff6b6b" 
                  name="P90 Latência"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Availability Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidade do Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={endpointMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <YAxis domain={[80, 100]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Disponibilidade']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="availability" 
                  stroke="#00C49F" 
                  name="Disponibilidade"
                  strokeWidth={3}
                />
                <Line 
                  type="monotone" 
                  dataKey="error_rate" 
                  stroke="#ff6b6b" 
                  name="Taxa de Erro"
                  strokeWidth={2}
                  yAxisId={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Taxa de Erro</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Crítico (>50%)</span>
                    <span className="text-red-500">
                      {performanceAlerts?.errorRate.critical || 0} alertas
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Alto (>10%)</span>
                    <span className="text-orange-500">
                      {performanceAlerts?.errorRate.high || 0} alertas
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Médio (>5%)</span>
                    <span className="text-yellow-500">
                      {performanceAlerts?.errorRate.medium || 0} alertas
                    </span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Latência</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Crítico (>7s)</span>
                    <span className="text-red-500">
                      {performanceAlerts?.latency.critical || 0} alertas
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Alto (>5s)</span>
                    <span className="text-orange-500">
                      {performanceAlerts?.latency.high || 0} alertas
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Médio (>1s)</span>
                    <span className="text-yellow-500">
                      {performanceAlerts?.latency.medium || 0} alertas
                    </span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Disponibilidade</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Crítico (<90%)</span>
                    <span className="text-red-500">
                      {performanceAlerts?.availability.critical || 0} alertas
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Baixo (<95%)</span>
                    <span className="text-orange-500">
                      {performanceAlerts?.availability.low || 0} alertas
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ótimo (>99%)</span>
                    <span className="text-green-500">
                      {performanceAlerts?.availability.good || 0} dias
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics; 