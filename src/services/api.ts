/**
 * Serviço de API para padronizar chamadas à API
 * Resolve a base URL da API de forma resiliente:
 * - Se VITE_APP_URL estiver definido e não for localhost, usa-o
 * - Caso contrário, usa window.location.origin (runtime), para funcionar atrás do Nginx/Portainer
 */

const resolveApiBaseUrl = (): string => {
  const configured = (import.meta as any)?.env?.VITE_APP_URL as string | undefined;
  const isLocalLike = (url?: string) => !!url && /localhost|127\.0\.0\.1/i.test(url);

  if (configured && !isLocalLike(configured)) {
    return configured.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  // Fallback seguro apenas para build sem janela (raro em produção de SPA)
  return configured || 'http://localhost:5173';
};

export const API_BASE_URL = resolveApiBaseUrl();

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

/**
 * Dispara um evento de automação
 * @param eventType Tipo do evento (ex: 'contact_created', 'deal_created')
 * @param userId ID do usuário que disparou o evento
 * @param contactId ID do contato relacionado (opcional)
 * @param data Dados adicionais para o evento (opcional)
 */
export const triggerAutomation = async (
  eventType: string, 
  userId: string, 
  contactId?: string, 
  data: Record<string, any> = {}
) => {
  try {
    await fetch('/api/triggers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        userId,
        contactId,
        data
      })
    });
  } catch (error) {
    console.error(`Failed to run '${eventType}' trigger:`, error);
    // Não lançamos o erro para não quebrar o fluxo principal
  }
};
