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

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  useMock?: boolean;
  teamId?: string;
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
    // Query para buscar métricas básicas das mensagens
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', params.teamId || '');

    const { count: delivered } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', params.teamId || '')
      .eq('status', 'delivered');

    const { count: read } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', params.teamId || '')
      .eq('status', 'read');

    const { count: failed } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', params.teamId || '')
      .eq('status', 'failed');

    const { count: responded } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', params.teamId || '')
      .eq('direction', 'inbound');

    return {
      total_messages: totalMessages || 0,
      delivered: delivered || 0,
      read: read || 0,
      failed: failed || 0,
      responded: responded || 0,
    };
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
    // Query para calcular o tempo médio de resposta
    const { data: responses, error } = await supabase
      .from('messages')
      .select('created_at, conversation_id')
      .eq('team_id', params.teamId || '')
      .eq('direction', 'inbound');

    if (error) throw error;

    // Esta é uma simplificação - em um cenário real, você precisaria
    // parear mensagens de entrada com suas respectivas respostas
    const responseTimes = responses?.map(msg => {
      // Implemente a lógica para calcular o tempo de resposta
      return 0; // Substitua pelo cálculo real
    }) || [];

    const average = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    return {
      average_response_time_ms: average,
      message_count: responseTimes.length
    };
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
    let query = supabase
      .from('messages')
      .select('status, direction, type, count', { count: 'exact' })
      .eq('team_id', params.teamId || '');

    if (params.direction) {
      query = query.eq('direction', params.direction);
    }

    if (params.messageType) {
      query = query.eq('type', params.messageType);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transforma os dados no formato esperado
    return (data || []).map(item => ({
      status: item.status,
      direction: item.direction,
      message_type: item.type,
      count: item.count
    }));
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
    // Busca todas as campanhas
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('team_id', params.teamId || '');

    if (campaignsError) throw campaignsError;

    // Para cada campanha, busca as métricas
    const metricsPromises = (campaigns || []).map(async (campaign) => {
      const { count: total_sent } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);

      const { count: delivered } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'delivered');

      const { count: read } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'read');

      const { count: responded } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('direction', 'inbound');

      const { count: failed } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'failed');

      const total = total_sent || 0;
      const deliveredCount = delivered || 0;
      const readCount = read || 0;
      const respondedCount = responded || 0;
      const failedCount = failed || 0;

      return {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        total_sent: total,
        delivered: deliveredCount,
        read: readCount,
        responded: respondedCount,
        failed: failedCount,
        delivery_rate: total > 0 ? Math.round((deliveredCount / total) * 100) : 0,
        read_rate: total > 0 ? Math.round((readCount / total) * 100) : 0,
        response_rate: total > 0 ? Math.round((respondedCount / total) * 100) : 0,
      };
    });

    return await Promise.all(metricsPromises);
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
