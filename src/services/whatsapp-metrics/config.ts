// Configuration and constants for WhatsApp Metrics

// Base URL for Meta Graph API
export const META_GRAPH_API_BASE_URL = 'https://graph.facebook.com/v18.0';

// Default time range for metrics (last 30 days)
const defaultEndDate = new Date();
const defaultStartDate = new Date();
defaultStartDate.setDate(defaultStartDate.getDate() - 30);

export const DEFAULT_DATE_RANGE = {
  start: defaultStartDate.toISOString(),
  end: defaultEndDate.toISOString(),
  granularity: 'DAY' as const,
};

// Default page size for paginated requests
export const DEFAULT_PAGE_SIZE = 100;

// Maximum retry attempts for API calls
export const MAX_RETRY_ATTEMPTS = 3;

// Delay between retry attempts (in ms)
export const RETRY_DELAY_MS = 1000;

// Cache TTL (in seconds)
export const CACHE_TTL = 300; // 5 minutes

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid or missing WhatsApp Business API credentials',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  INVALID_DATE_RANGE: 'Invalid date range. End date must be after start date.',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  UNAUTHORIZED: 'Unauthorized access to WhatsApp Business Account',
  NOT_FOUND: 'Requested resource not found',
  INTERNAL_ERROR: 'Internal server error',
};

// Default metric types for each analytics endpoint
export const DEFAULT_METRIC_TYPES = {
  MESSAGE: ['SENT', 'DELIVERED', 'READ'],
  CONVERSATION: ['CONVERSATION'],
  PRICING: ['VOLUME'],
  TEMPLATE: ['SENT', 'DELIVERED', 'READ', 'CLICKED'],
};

// Default dimensions for analytics
export const DEFAULT_DIMENSIONS = {
  MESSAGE: ['country', 'phone_number', 'product_type'],
  CONVERSATION: ['conversation_category', 'conversation_direction', 'conversation_type'],
  PRICING: ['pricing_category', 'pricing_type', 'tier'],
};

// WhatsApp Business API version
export const API_VERSION = 'v18.0';
