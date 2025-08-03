import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/common/Card.js';
import { Skeleton } from '../../../components/common/Skeleton.js';
import { metricsService, MetricSummary } from '../../../services/metricsService.js';
import { formatNumber } from '../../../lib/utils.js';

interface MetricsSummaryProps {
  startDate?: string;
  endDate?: string;
}

// Adicionando o tipo para os dados mock
interface MockMetricsSummary extends MetricSummary {
  failed: number;
}

// Dados mock para o resumo de métricas
const MOCK_SUMMARY: MockMetricsSummary = {
  total_messages: 1245,
  delivered: 1200,
  read: 950,
  failed: 45,
  responded: 780,
};

export function MetricsSummary({ startDate, endDate }: MetricsSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricSummary | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Tenta buscar dados reais primeiro
        const result = await metricsService.fetchMetricsSummary({
          startDate,
          endDate,
          useMock: false,
        });
        
        // Verifica se estamos usando dados mock (quando a API falha)
        const usingMock = result === MOCK_SUMMARY;
        setIsMockData(usingMock);
        
        // Garante que o campo 'failed' está presente
        const summaryWithDefaults: MetricSummary = {
          ...MOCK_SUMMARY, // Usa os valores padrão como fallback
          ...result,      // Sobrescreve com os valores da API, se disponíveis
        };
        
        setData(summaryWithDefaults);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar métricas:', err);
        // Em caso de erro, usa os dados mock
        setIsMockData(true);
        setData(MOCK_SUMMARY);
        setError('Não foi possível conectar ao servidor. Dados de exemplo exibidos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">Não foi possível carregar as métricas.</p>
      </div>
    );
  }

  const MetricCard = ({
    title,
    value,
    total,
    color,
  }: {
    title: string;
    value: number;
    total?: number;
    color: string;
  }) => (
    <Card className="flex-1 min-w-[200px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <div className="text-2xl font-bold">{formatNumber(value)}</div>
          {total !== undefined && (
            <div className="text-xs text-muted-foreground">
              {getPercentage(value, total)} do total
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {isMockData && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 text-yellow-800 dark:text-yellow-200 text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Você está visualizando dados de exemplo. A API de métricas não está disponível no momento.</span>
          </div>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total de Mensagens" 
          value={data.total_messages} 
          total={data.total_messages}
          color="bg-blue-500"
        />
        <MetricCard 
          title="Entregues" 
          value={data.delivered} 
          total={data.total_messages}
          color="bg-green-500"
        />
        <MetricCard 
          title="Lidas" 
          value={data.read} 
          total={data.delivered}
          color="bg-purple-500"
        />
        <MetricCard 
          title="Com Resposta" 
          value={data.responded} 
          total={data.read}
          color="bg-amber-500"
        />
        <MetricCard 
          title="Falhas" 
          value={data.failed} 
          total={data.total_messages}
          color="bg-red-500"
        />
      </div>
    </div>
  );
}
