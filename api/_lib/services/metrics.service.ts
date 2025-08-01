import { supabaseAdmin } from '../supabaseAdmin.js';
import { Database } from '../database.types.js';

type MessageMetrics = Database['public']['Tables']['message_metrics']['Insert'];
type MessageDirection = 'inbound' | 'outbound';
type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'button' | 'list' | 'template';

interface LogMessageMetricParams {
  profileId: string;
  messageId: string;
  contactId: string;
  direction: MessageDirection;
  status: MessageStatus;
  messageType: MessageType;
  timestamp: Date;
  responseTime?: number;
  errorCode?: string;
  templateName?: string;
  campaignId?: string;
  sessionId?: string;
}

export class MetricsService {
  /**
   * Registra uma nova métrica de mensagem
   */
  static async logMessage(metric: LogMessageMetricParams): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('message_metrics')
        .insert([
          {
            profile_id: metric.profileId,
            message_id: metric.messageId,
            contact_id: metric.contactId,
            direction: metric.direction,
            status: metric.status,
            message_type: metric.messageType,
            timestamp: metric.timestamp.toISOString(),
            response_time: metric.responseTime,
            error_code: metric.errorCode,
            template_name: metric.templateName,
            campaign_id: metric.campaignId,
            session_id: metric.sessionId,
          },
        ]);

      if (error) {
        console.error('[MetricsService] Erro ao registrar métrica:', error);
        throw error;
      }

      console.log(`[MetricsService] Métrica registrada para mensagem ${metric.messageId} (${metric.status})`);
    } catch (error) {
      console.error('[MetricsService] Erro não tratado ao registrar métrica:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma métrica existente
   */
  static async updateMessageStatus(params: {
    profileId: string;
    messageId: string;
    status: MessageStatus;
    timestamp: Date;
    errorCode?: string;
  }): Promise<void> {
    try {
      const updateData: Partial<MessageMetrics> = {
        status: params.status,
        updated_at: new Date().toISOString(),
      };

      if (params.errorCode) {
        updateData.error_code = params.errorCode;
      }

      const { error } = await supabaseAdmin
        .from('message_metrics')
        .update(updateData)
        .eq('profile_id', params.profileId)
        .eq('message_id', params.messageId);

      if (error) {
        console.error(`[MetricsService] Erro ao atualizar status para ${params.messageId}:`, error);
        throw error;
      }

      console.log(`[MetricsService] Status atualizado para mensagem ${params.messageId}: ${params.status}`);
    } catch (error) {
      console.error('[MetricsService] Erro não tratado ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas agregadas para um perfil
   */
  static async getMetrics(profileId: string, startDate: Date, endDate: Date) {
    try {
      // Usando a função RPC para buscar métricas agrupadas por status
      const { data, error } = await supabaseAdmin.rpc('get_metrics_by_status', {
        p_profile_id: profileId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      if (error) {
        console.error('[MetricsService] Erro ao buscar métricas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[MetricsService] Erro não tratado ao buscar métricas:', error);
      throw error;
    }
  }

  /**
   * Calcula o tempo médio de resposta para mensagens de saída
   */
  static async getAverageResponseTime(profileId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('message_metrics')
        .select('response_time')
        .eq('profile_id', profileId)
        .eq('direction', 'outbound')
        .not('response_time', 'is', null)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) {
        console.error('[MetricsService] Erro ao calcular tempo médio de resposta:', error);
        throw error;
      }

      if (!data || data.length === 0) return 0;

      const total = data.reduce((sum, item) => sum + (item.response_time || 0), 0);
      return total / data.length;
    } catch (error) {
      console.error('[MetricsService] Erro não tratado ao calcular tempo médio de resposta:', error);
      throw error;
    }
  }
}
