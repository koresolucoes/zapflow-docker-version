// Common types used across the WhatsApp metrics system

export interface DateRange {
  start: string; // ISO date string
  end: string;   // ISO date string
  granularity?: 'HALF_HOUR' | 'DAY' | 'MONTH';
}

export interface WABAParams extends DateRange {
  phoneNumbers?: string[];
  countryCodes?: string[];
  teamId?: string; // Our internal team ID for filtering
}

// Message Analytics
export interface MessageAnalyticsParams extends WABAParams {
  productTypes?: ('0' | '2')[]; // 0 for notification, 2 for customer care
}

// Conversation Analytics
export interface ConversationAnalyticsParams extends WABAParams {
  metricTypes?: ('COST' | 'CONVERSATION')[];
  categories?: ('AUTHENTICATION' | 'MARKETING' | 'SERVICE' | 'UTILITY')[];
  conversationTypes?: ('FREE_ENTRY' | 'FREE_TIER' | 'REGULAR')[];
  directions?: ('BUSINESS_INITIATED' | 'USER_INITIATED')[];
}

// Pricing Analytics
export interface PricingAnalyticsParams extends WABAParams {
  metricTypes?: ('COST' | 'VOLUME')[];
  pricingTypes?: ('FREE_CUSTOMER_SERVICE' | 'FREE_ENTRY_POINT' | 'REGULAR')[];
  pricingCategories?: ('AUTHENTICATION' | 'AUTHENTICATION_INTERNATIONAL' | 'MARKETING' | 'SERVICE' | 'UTILITY')[];
  dimensions?: ('COUNTRY' | 'PHONE' | 'PRICING_CATEGORY' | 'PRICING_TYPE' | 'TIER')[];
}

// Template Analytics
export interface TemplateAnalyticsParams extends WABAParams {
  templateIds?: string[];
  metricTypes?: ('CLICKED' | 'DELIVERED' | 'READ' | 'SENT' | 'COST')[];
  productType?: 'CLOUD_API' | 'MARKETING_MESSAGES_LITE_API';
}

// Flow Metrics
export interface FlowMetricsParams {
  flowId: string;
  metricName: 'ENDPOINT_REQUEST_COUNT' | 'ENDPOINT_REQUEST_ERROR' | 
              'ENDPOINT_REQUEST_ERROR_RATE' | 'ENDPOINT_REQUEST_LATENCY_SECONDS_CEIL' | 
              'ENDPOINT_AVAILABILITY';
  granularity?: 'DAY' | 'HOUR' | 'LIFETIME';
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
  teamId?: string;
}

// Response types
export interface AnalyticsResponse<T> {
  data: T[];
  paging?: {
    previous?: string;
    next?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface MetricValue {
  value: number | string;
  end_time: string;
}

export interface TimeRangeMetric extends MetricValue {
  start_time: string;
}
