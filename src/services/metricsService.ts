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

/**
 * Busca o resumo das métricas
 */
export async function fetchMetricsSummary(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<MetricSummary> {
  const { data, error } = await supabase.functions.invoke('metrics/summary', {
    body: params,
  });

  if (error) {
    console.error('Error fetching metrics summary:', error);
    throw error;
  }

  return data;
}

/**
 * Busca o tempo médio de resposta
 */
export async function fetchAverageResponseTime(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ResponseTimeMetric> {
  const { data, error } = await supabase.functions.invoke(
    'metrics/average-response-time',
    {
      body: params,
    }
  );

  if (error) {
    console.error('Error fetching average response time:', error);
    throw error;
  }

  return data;
}

/**
 * Busca métricas por status
 */
export async function fetchStatusMetrics(params?: {
  startDate?: string;
  endDate?: string;
  direction?: 'inbound' | 'outbound';
  messageType?: string;
}): Promise<StatusMetric[]> {
  const { data, error } = await supabase.functions.invoke('metrics/status', {
    body: params,
  });

  if (error) {
    console.error('Error fetching status metrics:', error);
    throw error;
  }

  return data;
}

/**
 * Busca métricas de campanhas
 */
export async function fetchCampaignMetrics(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<CampaignMetric[]> {
  const { data, error } = await supabase.functions.invoke('metrics/campaigns', {
    body: params,
  });

  if (error) {
    console.error('Error fetching campaign metrics:', error);
    throw error;
  }

  return data;
}

// Exporta todas as funções como um objeto para facilitar a importação
export const metricsService = {
  fetchMetricsSummary,
  fetchAverageResponseTime,
  fetchStatusMetrics,
  fetchCampaignMetrics,
};

export default metricsService;
