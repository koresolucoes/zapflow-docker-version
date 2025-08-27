const API_URL = '/api';

/**
 * Performs a request to the API.
 * @param endpoint The endpoint path (e.g., '/auth/login').
 * @param options Request options, such as method, body, etc.
 * @returns The API response in JSON format.
 */
export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const { method = 'GET', headers: customHeaders = {}, body } = options;

  const token = localStorage.getItem('authToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `Request failed with status ${response.status}`,
      }));

      console.error('API request error:', {
        status: response.status,
        endpoint,
        errorData,
      });

      throw new Error(errorData.message || 'An error occurred while communicating with the server.');
    }

    if (response.status === 204) {
      return {} as T;
    }

    // For login, we might want to get the token from headers
    if (response.headers.get("content-type")?.includes("application/json")) {
        return await response.json() as T;
    }

    return {} as T;


  } catch (error) {
    console.error('API communication failure:', {
      endpoint,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const apiGet = <T>(endpoint: string, options?: RequestInit) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

export const apiPost = <T>(endpoint:string, body: any, options?: RequestInit) =>
  apiClient<T>(endpoint, { ...options, method: 'POST', body });

export const apiPut = <T>(endpoint: string, body: any, options?: RequestInit) =>
  apiClient<T>(endpoint, { ...options, method: 'PUT', body });

export const apiDelete = <T>(endpoint: string, options?: RequestInit) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });
