import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/common/Card.js';
import { Skeleton } from '../../../components/common/Skeleton.js';
import { metricsService, MetricSummary } from '../../../services/metricsService.js';
import { formatNumber } from '../../../lib/utils.js';

interface MetricsSummaryProps {
  startDate?: string;
  endDate?: string;
}

export function MetricsSummary({ startDate, endDate }: MetricsSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await metricsService.fetchMetricsSummary({
          startDate,
          endDate,
        });
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching metrics summary:', err);
        setError('Falha ao carregar as métricas. Tente novamente mais tarde.');
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
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : error ? (
          <div className="text-sm text-destructive">Erro</div>
        ) : (
          <div>
            <div className="text-2xl font-bold">{formatNumber(value)}</div>
            {total !== undefined && (
              <div className="text-xs text-muted-foreground">
                {getPercentage(value, total)} do total
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Visão Geral</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Mensagens"
          value={data?.total_messages || 0}
          color="bg-blue-100 text-blue-800"
        />
        
        <MetricCard
          title="Entregues"
          value={data?.delivered || 0}
          total={data?.total_messages}
          color="bg-green-100 text-green-800"
        />
        
        <MetricCard
          title="Lidas"
          value={data?.read || 0}
          total={data?.total_messages}
          color="bg-purple-100 text-purple-800"
        />
        
        <MetricCard
          title="Respondidas"
          value={data?.responded || 0}
          total={data?.total_messages}
          color="bg-amber-100 text-amber-800"
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500"
                    style={{
                      width: data?.total_messages 
                        ? `${(data.delivered / data.total_messages) * 100}%` 
                        : '0%'
                    }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {data?.total_messages 
                    ? `${Math.round((data.delivered / data.total_messages) * 100)}% de entrega`
                    : '0% de entrega'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taxa de Leitura</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{
                      width: data?.delivered 
                        ? `${(data.read / data.delivered) * 100}%` 
                        : '0%'
                    }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {data?.delivered 
                    ? `${Math.round((data.read / data.delivered) * 100)}% de mensagens lidas`
                    : '0% de leitura'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
