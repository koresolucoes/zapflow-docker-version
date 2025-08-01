import { Request, Response } from 'express';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { MetricsService } from '../_lib/services/metrics.service.js';

/**
 * Handler para as rotas de métricas
 * Suporta os seguintes endpoints:
 * - GET /api/metrics/summary - Retorna um resumo das métricas
 * - GET /api/metrics/average-response-time - Retorna o tempo médio de resposta
 * - GET /api/metrics/status - Retorna contagem de mensagens por status
 * - GET /api/metrics/campaigns - Retorna métricas detalhadas de campanhas
 */
export async function metricsHandler(req: Request, res: Response) {
  // Verifica autenticação
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header is missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  
  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Extrai parâmetros de data (opcionais)
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate as string) 
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias por padrão
    
  const endDate = req.query.endDate 
    ? new Date(req.query.endDate as string) 
    : new Date();

  // Rota: GET /api/metrics/summary
  if (req.method === 'GET' && req.path.endsWith('/summary')) {
    try {
      // Obtém métricas resumidas
      const metrics = await MetricsService.getMetrics(user.id, startDate, endDate);
      return res.status(200).json({ data: metrics });
    } catch (error) {
      console.error('Error fetching metrics summary:', error);
      return res.status(500).json({ error: 'Failed to fetch metrics summary' });
    }
  }

  // Rota: GET /api/metrics/average-response-time
  if (req.method === 'GET' && req.path.endsWith('/average-response-time')) {
    try {
      const averageResponseTime = await MetricsService.getAverageResponseTime(user.id, startDate, endDate);
      return res.status(200).json({ 
        data: { 
          averageResponseTime,
          unit: 'milliseconds'
        } 
      });
    } catch (error) {
      console.error('Error calculating average response time:', error);
      return res.status(500).json({ error: 'Failed to calculate average response time' });
    }
  }

  // Rota: GET /api/metrics/status
  if (req.method === 'GET' && req.path.endsWith('/status')) {
    try {
      // Filtros adicionais
      const direction = req.query.direction as 'inbound' | 'outbound' | undefined;
      const messageType = req.query.messageType as string | undefined;
      
      // Aqui você pode adicionar lógica para filtrar por direção/tipo de mensagem
      // usando os parâmetros de consulta fornecidos
      
      // Por enquanto, retornamos as métricas sem filtros adicionais
      const metrics = await MetricsService.getMetrics(user.id, startDate, endDate);
      return res.status(200).json({ data: metrics });
    } catch (error) {
      console.error('Error fetching status metrics:', error);
      return res.status(500).json({ error: 'Failed to fetch status metrics' });
    }
  }

  // Rota: GET /api/metrics/campaigns
  if (req.method === 'GET' && req.path.endsWith('/campaigns')) {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_campaign_metrics', {
        p_profile_id: user.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      if (error) {
        console.error('Error fetching campaign metrics:', error);
        return res.status(500).json({ error: 'Failed to fetch campaign metrics' });
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error in campaign metrics endpoint:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Rota não encontrada
  return res.status(404).json({ error: 'Not Found' });
}
