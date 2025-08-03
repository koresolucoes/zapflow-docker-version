/**
 * Serviço de API para padronizar chamadas à API
 * Garante que todas as chamadas usem o domínio correto (VITE_APP_URL ou window.location.origin)
 */

const API_BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin;

/**
 * Realiza uma requisição à API
 * @param endpoint - O endpoint da API (ex: '/api/endpoint')
 * @param options - Opções da requisição fetch
 * @returns A resposta da API
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erro na requisição');
  }

  return response.json();
};

/**
 * Realiza uma requisição GET à API
 * @param endpoint - O endpoint da API
 * @param query - Parâmetros de consulta (opcional)
 * @returns Os dados da resposta
 */
export const get = async <T = any>(endpoint: string, query?: Record<string, any>): Promise<T> => {
  const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
  return apiFetch(`${endpoint}${queryString}`);
};

/**
 * Realiza uma requisição POST à API
 * @param endpoint - O endpoint da API
 * @param data - Dados a serem enviados no corpo da requisição
 * @returns Os dados da resposta
 */
export const post = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Realiza uma requisição PUT à API
 * @param endpoint - O endpoint da API
 * @param data - Dados a serem enviados no corpo da requisição
 * @returns Os dados da resposta
 */
export const put = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Realiza uma requisição DELETE à API
 * @param endpoint - O endpoint da API
 * @returns Os dados da resposta
 */
export const del = async <T = any>(endpoint: string): Promise<T> => {
  return apiFetch(endpoint, {
    method: 'DELETE',
  });
};
