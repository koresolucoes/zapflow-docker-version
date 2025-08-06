import { WhatsAppMetricsClient } from '../client.js';
import { 
  MessageAnalyticsParams, 
  AnalyticsResponse,
  TimeRangeMetric,
} from '../types.js';
import { 
  ERROR_MESSAGES,
  DEFAULT_METRIC_TYPES,
  DEFAULT_DATE_RANGE,
} from '../config.js';

/**
 * Result type for message analytics
 */
interface MessageAnalyticsResult {
  data: Array<TimeRangeMetric & {
    values: {
      [key: string]: number;
    };
  }>;
  paging?: {
    previous?: string;
    next?: string;
  };
}

/**
 * Extend the base interface to include our custom fields
 */
interface MessageMetric extends TimeRangeMetric {
  metric_name: string;
  [key: string]: any; // Allow additional dynamic properties
}

/**
 * Service for fetching message analytics from WhatsApp Business API
 */
export class MessageAnalyticsService {
  private client: WhatsAppMetricsClient;

  constructor(client: WhatsAppMetricsClient) {
    this.client = client;
  }

  /**
   * Get message analytics for the specified parameters
   */
  async getMessageAnalytics(
    params: MessageAnalyticsParams
  ): Promise<AnalyticsResponse<MessageMetric>> {
    try {
      // Get WABA ID from the client
      const wabaId = await this.client.getWabaId();
      if (!wabaId) {
        throw new Error('WABA ID not available');
      }

      // Define the expected item type
      type AnalyticsItem = {
        start_time: string;
        end_time: string;
        values: Record<string, number>;
      };

      // The response will be of type AnalyticsResponse<AnalyticsItem>
      const response = await this.client.getAnalytics<AnalyticsItem>(
        `${wabaId}/message_analytics`,
        {
          start: params.start,
          end: params.end,
          granularity: params.granularity || 'DAY',
          phone_numbers: params.phoneNumbers?.join(','),
          product_types: params.productTypes?.join(',')
        }
      );

      // Transform the response to match our extended MessageMetric[]
      const transformedData: MessageMetric[] = [];
      
      // response.data is an array of AnalyticsItem
      for (const item of response.data) {
        if (!item.values) continue;
        
        for (const [key, value] of Object.entries(item.values)) {
          transformedData.push({
            start_time: item.start_time,
            end_time: item.end_time,
            metric_name: key,
            value: typeof value === 'number' ? value : 0
          });
        }
      }

      return {
        ...response,
        data: transformedData
      };
    } catch (error) {
      console.error('Error in getMessageAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get message deli very rates
   */
  async getDeliveryRates(params: MessageAnalyticsParams) {
    const response = await this.getMessageAnalytics(params);
    
    // Create a map to group metrics by time period
    const metricsByTime = new Map<string, {
      start_time: string;
      end_time: string;
      sent: number;
      delivered: number;
      read: number;
    }>();
    
    // Process all metrics and group them by time period
    for (const item of response.data) {
      const timeKey = item.start_time;
      if (!metricsByTime.has(timeKey)) {
        metricsByTime.set(timeKey, {
          start_time: item.start_time,
          end_time: item.end_time,
          sent: 0,
          delivered: 0,
          read: 0
        });
      }
      
      const metrics = metricsByTime.get(timeKey)!;
      
      if (item.metric_name === 'messages.sent') metrics.sent = item.value as number;
      else if (item.metric_name === 'messages.delivered') metrics.delivered = item.value as number;
      else if (item.metric_name === 'messages.read') metrics.read = item.value as number;
    }
    
    // Calculate rates for each time period
    return Array.from(metricsByTime.values()).map(metrics => ({
      ...metrics,
      delivery_rate: metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0,
      read_rate: metrics.delivered > 0 ? (metrics.read / metrics.delivered) * 100 : 0
    }));
  }

  /**
   * Get message metrics by country
   */
  async getMetricsByCountry(params: MessageAnalyticsParams) {
    const response = await this.client.getAnalytics<MessageAnalyticsResult>(
      '/analytics',
      {
        ...params,
        dimensions: ['country'],
        fields: [
          'country',
          'messages.sent',
          'messages.delivered',
          'messages.read',
          'messages.failed'
        ].join(',')
      }
    );

    return response.data;
  }

  /**
   * Get message metrics by phone number
   */
  async getMetricsByPhoneNumber(params: MessageAnalyticsParams) {
    const response = await this.client.getAnalytics<MessageAnalyticsResult>(
      '/analytics',
      {
        ...params,
        dimensions: ['phone_number'],
        fields: [
          'phone_number',
          'messages.sent',
          'messages.delivered',
          'messages.read',
          'messages.failed'
        ].join(',')
      }
    );

    return response.data;
  }

  /**
   * Get message metrics by product type
   */
  async getMetricsByProductType(params: MessageAnalyticsParams) {
    const response = await this.client.getAnalytics<MessageAnalyticsResult>(
      '/analytics',
      {
        ...params,
        dimensions: ['product_type'],
        fields: [
          'product_type',
          'messages.sent',
          'messages.delivered',
          'messages.read',
          'messages.failed'
        ].join(',')
      }
    );

    return response.data;
  }
}
