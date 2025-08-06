import { supabase } from '../../lib/supabaseClient.js';
import { 
  META_GRAPH_API_BASE_URL, 
  MAX_RETRY_ATTEMPTS, 
  RETRY_DELAY_MS,
  ERROR_MESSAGES
} from './config.js';
import { AnalyticsResponse } from './types.js';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, any>;
  headers?: Record<string, string>;
  retryCount?: number;
}

export class WhatsAppMetricsClient {
  private accessToken: string | null = null;
  private wabaId: string | null = null;
  private teamId: string | null = null;

  /**
   * Initialize the client with required credentials
   */
  async initialize(teamId: string): Promise<void> {
    this.teamId = teamId;
    
    // Fetch WABA configuration from database
    const { data: wabaConfig, error } = await supabase
      .from('waba_configs')
      .select('waba_id, access_token')
      .eq('team_id', teamId)
      .single();

    if (error || !wabaConfig) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    this.wabaId = wabaConfig.waba_id;
    this.accessToken = wabaConfig.access_token;
  }

  /**
   * Make a request to the Meta Graph API with retry logic
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<AnalyticsResponse<T>> {
    if (!this.accessToken || !this.wabaId) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const { 
      method = 'GET', 
      body, 
      headers = {}, 
      retryCount = 0 
    } = options;

    const url = new URL(`${META_GRAPH_API_BASE_URL}${endpoint}`);
    
    // Add access token to query params
    url.searchParams.append('access_token', this.accessToken);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      // Handle rate limiting (status 429)
      if (response.status === 429 && retryCount < MAX_RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
        return this.request<T>(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      // Handle unauthorized (status 401)
      if (response.status === 401) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      // Handle not found (status 404)
      if (response.status === 404) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      }

      // Handle other errors
      if (!response.ok) {
        const errorMessage = data?.error?.message || ERROR_MESSAGES.INTERNAL_ERROR;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('WhatsApp API request failed:', error);
      throw error;
    }
  }

  /**
   * Get analytics data from Meta Graph API
   */
  async getAnalytics<T = any>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<AnalyticsResponse<T>> {
    if (!this.wabaId) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Add required parameters
    const queryParams = new URLSearchParams({
      ...params,
      // Convert arrays to comma-separated strings
      ...Object.fromEntries(
        Object.entries(params)
          .filter(([_, value]) => Array.isArray(value))
          .map(([key, value]) => [key, (value as any[]).join(',')])
      ),
    });

    return this.request(`/${this.wabaId}${endpoint}?${queryParams}`);
  }

  /**
   * Get the WABA ID
   */
  public getWabaId(): string | null {
    return this.wabaId;
  }

  
}