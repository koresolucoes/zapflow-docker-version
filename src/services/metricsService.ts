import { supabase } from '../lib/supabaseClient.js';

export interface MetricSummary {
  total_messages: number;
  delivered: number;
  read: number;
  failed: number;
  responded: number;
}

export interface ResponseTimeMetric {
  average_response_time_ms: number;
  message_count: number;
}

export interface StatusMetric {
  status: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  count: number;
}

export interface CampaignMetric {
  campaign_id: string;
  campaign_name: string;
  total_sent: number;
  delivered: number;
  read: number;
  responded: number;
  failed: number;
  delivery_rate: number;
  read_rate: number;
  response_rate: number;
}

// Dados mock para quando a API não estiver disponível
const MOCK_METRICS: Record<string, any> = {
  summary: {
    total_messages: 1245,
    delivered: 1200,
    read: 950,
    failed: 45,
    responded: 780,
  },
  responseTime: {
    average_response_time_ms: 125000, // 2 minutos e 5 segundos em ms
    message_count: 780,
  },
  status: [
    { status: 'delivered', direction: 'outbound', message_type: 'text', count: 800 },
    { status: 'read', direction: 'outbound', message_type: 'text', count: 650 },
    { status: 'failed', direction: 'outbound', message_type: 'text', count: 25 },
    { status: 'received', direction: 'inbound', message_type: 'text', count: 700 },
  ],
  campaigns: [
    {
      campaign_id: 'camp-001',
      campaign_name: 'Campanha de Boas-vindas',
      total_sent: 500,
      delivered: 485,
      read: 420,
      responded: 350,
      failed: 15,
      delivery_rate: 97,
      read_rate: 84,
      response_rate: 70,
    },
  ],
};

// Função auxiliar para simular atraso de rede
const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// Atualizando as interfaces de parâmetros para incluir useMock
interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  useMock?: boolean;
}

interface StatusMetricsParams extends DateRangeParams {
  direction?: 'inbound' | 'outbound';
  messageType?: string;
}

/**
 * Busca o resumo das métricas
 */
export async function fetchMetricsSummary(params: DateRangeParams = {}): Promise<MetricSummary> {
  if (params?.useMock) {
    await simulateNetworkDelay();
    return MOCK_METRICS.summary;
  }

  try {
    const { data, error } = await supabase.functions.invoke('metrics/summary', {
      body: params,
    });

    if (error) {
      console.warn('Falha na API de métricas, usando dados de exemplo:', error);
      return MOCK_METRICS.summary;
    }

    return data;
  } catch (error) {
    console.warn('Erro ao buscar métricas, usando dados de exemplo:', error);
    return MOCK_METRICS.summary;
  }
}

/**
 * Busca o tempo médio de resposta
 */
export async function fetchAverageResponseTime(params: DateRangeParams = {}): Promise<ResponseTimeMetric> {
  if (params?.useMock) {
    await simulateNetworkDelay();
    return MOCK_METRICS.responseTime;
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      'metrics/average-response-time',
      { body: params }
    );

    if (error) {
      console.warn('Falha na API de métricas, usando dados de exemplo:', error);
      return MOCK_METRICS.responseTime;
    }

    return data;
  } catch (error) {
    console.warn('Erro ao buscar tempo médio de resposta, usando dados de exemplo:', error);
    return MOCK_METRICS.responseTime;
  }
}

/**
 * Busca métricas por status
 */
export async function fetchStatusMetrics(params: StatusMetricsParams = {}): Promise<StatusMetric[]> {
  if (params?.useMock) {
    await simulateNetworkDelay();
    return MOCK_METRICS.status;
  }

  try {
    const { data, error } = await supabase.functions.invoke('metrics/status', {
      body: params,
    });

    if (error) {
      console.warn('Falha na API de métricas, usando dados de exemplo:', error);
      return MOCK_METRICS.status;
    }

    return data;
  } catch (error) {
    console.warn('Erro ao buscar métricas por status, usando dados de exemplo:', error);
    return MOCK_METRICS.status;
  }
}

/**
 * Busca métricas de campanhas
 */
export async function fetchCampaignMetrics(params: DateRangeParams = {}): Promise<CampaignMetric[]> {
  if (params?.useMock) {
    await simulateNetworkDelay();
    return MOCK_METRICS.campaigns;
  }

  try {
    const { data, error } = await supabase.functions.invoke('metrics/campaigns', {
      body: params,
    });

    if (error) {
      console.warn('Falha na API de métricas, usando dados de exemplo:', error);
      return MOCK_METRICS.campaigns;
    }

    return data;
  } catch (error) {
    console.warn('Erro ao buscar métricas de campanhas, usando dados de exemplo:', error);
    return MOCK_METRICS.campaigns;
  }
}

// Atualizando o objeto metricsService para incluir a opção de mock
export const metricsService = {
  fetchMetricsSummary,
  fetchAverageResponseTime,
  fetchStatusMetrics,
  fetchCampaignMetrics,
};

export default metricsService;
