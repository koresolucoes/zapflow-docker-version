import { MessageAnalyticsService } from './waba/messageAnalytics.js';
import { WhatsAppMetricsClient } from './client.js';
import { 
  MessageAnalyticsParams,
  ConversationAnalyticsParams,
  TemplateAnalyticsParams,
  FlowMetricsParams,
  AnalyticsResponse,
  TimeRangeMetric
} from './types.js';

export class WhatsAppMetricsService {
  private client: WhatsAppMetricsClient;
  private messageAnalytics: MessageAnalyticsService;

  constructor() {
    this.client = new WhatsAppMetricsClient();
    this.messageAnalytics = new MessageAnalyticsService(this.client);
  }

  /**
   * Busca métricas de mensagens do WhatsApp Business API
   */
  async getMessageAnalytics(params: MessageAnalyticsParams): Promise<AnalyticsResponse<TimeRangeMetric>> {
    try {
      return await this.messageAnalytics.getMessageAnalytics(params);
    } catch (error) {
      console.error('Error fetching message analytics:', error);
      throw error;
    }
  }

  /**
   * Busca métricas de conversas do WhatsApp Business API
   */
  async getConversationAnalytics(params: ConversationAnalyticsParams): Promise<AnalyticsResponse<TimeRangeMetric>> {
    try {
      const {
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end = new Date().toISOString(),
        granularity = 'DAY',
        phoneNumbers = [],
        countryCodes = [],
        teamId
      } = params;

      if (!teamId) {
        throw new Error('teamId is required');
      }

      await this.client.initialize(teamId);

      const queryParams: Record<string, any> = {
        start: Math.floor(new Date(start).getTime() / 1000),
        end: Math.floor(new Date(end).getTime() / 1000),
        granularity,
        metric_types: 'CONVERSATION',
        phone_numbers: phoneNumbers.join(','),
        country_codes: countryCodes.join(','),
        dimensions: 'conversation_category,conversation_direction,conversation_type',
        fields: 'conversation,start,end'
      };

      // Remove empty parameters
      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key]) {
          delete queryParams[key];
        }
      });

      return await this.client.getAnalytics<TimeRangeMetric>('/conversation_analytics', queryParams);
    } catch (error) {
      console.error('Error fetching conversation analytics:', error);
      throw error;
    }
  }

  /**
   * Busca métricas de templates do WhatsApp Business API
   */
  async getTemplateAnalytics(params: TemplateAnalyticsParams): Promise<AnalyticsResponse<TimeRangeMetric>> {
    try {
      const {
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end = new Date().toISOString(),
        templateIds = [],
        metricTypes = ['SENT', 'DELIVERED', 'READ', 'CLICKED'],
        productType = 'CLOUD_API',
        teamId
      } = params;

      if (!teamId) {
        throw new Error('teamId is required');
      }

      await this.client.initialize(teamId);

      const queryParams: Record<string, any> = {
        start: Math.floor(new Date(start).getTime() / 1000),
        end: Math.floor(new Date(end).getTime() / 1000),
        granularity: 'DAY',
        metric_types: metricTypes.join(','),
        template_ids: templateIds.join(','),
        product_type: productType,
        fields: 'template_analytics,start,end'
      };

      // Remove empty parameters
      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key]) {
          delete queryParams[key];
        }
      });

      return await this.client.getAnalytics<TimeRangeMetric>('/template_analytics', queryParams);
    } catch (error) {
      console.error('Error fetching template analytics:', error);
      throw error;
    }
  }

  /**
   * Busca métricas de flows do WhatsApp Business API
   */
  async getFlowMetrics(params: FlowMetricsParams): Promise<AnalyticsResponse<TimeRangeMetric>> {
    try {
      const {
        flowId,
        metricName = 'ENDPOINT_REQUEST_COUNT',
        granularity = 'DAY',
        since,
        until,
        teamId
      } = params;

      if (!teamId || !flowId) {
        throw new Error('teamId and flowId are required');
      }

      await this.client.initialize(teamId);

      const queryParams: Record<string, any> = {
        metric_name: metricName,
        granularity,
        since,
        until,
        fields: 'flow_metrics,start,end'
      };

      return await this.client.getAnalytics<TimeRangeMetric>(`/${flowId}/flow_metrics`, queryParams);
    } catch (error) {
      console.error('Error fetching flow metrics:', error);
      throw error;
    }
  }

  /**
   * Busca métricas de performance do endpoint (para WhatsApp Flows)
   */
  async getEndpointPerformanceMetrics(teamId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      await this.client.initialize(teamId);

      const queryParams = {
        start: Math.floor(startDate.getTime() / 1000),
        end: Math.floor(endDate.getTime() / 1000),
        granularity: 'HOUR',
        metric_types: 'ENDPOINT_REQUEST_COUNT,ENDPOINT_REQUEST_ERROR,ENDPOINT_REQUEST_LATENCY_SECONDS_CEIL,ENDPOINT_AVAILABILITY',
        fields: 'endpoint_metrics,start,end'
      };

      return await this.client.getAnalytics('/endpoint_metrics', queryParams);
    } catch (error) {
      console.error('Error fetching endpoint performance metrics:', error);
      throw error;
    }
  }

  /**
   * Busca alertas de performance baseados nos thresholds da documentação
   */
  async getPerformanceAlerts(teamId: string): Promise<any> {
    try {
      await this.client.initialize(teamId);

      // Busca alertas para diferentes thresholds
      const alerts = {
        errorRate: {
          critical: 0, // >50%
          high: 0,     // >10%
          medium: 0    // >5%
        },
        latency: {
          critical: 0, // >7s
          high: 0,     // >5s
          medium: 0    // >1s
        },
        availability: {
          critical: 0, // <90%
          low: 0,      // <95%
          good: 0      // >99%
        }
      };

      // Em uma implementação real, você faria chamadas para a API
      // para buscar dados históricos e calcular os alertas
      
      return alerts;
    } catch (error) {
      console.error('Error fetching performance alerts:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const whatsappMetricsService = new WhatsAppMetricsService();
