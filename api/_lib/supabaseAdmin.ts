import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { logger } from './utils/logger';

// Log inicial para depuração
logger.info('Inicializando cliente Supabase Admin...', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasViteSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
  hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

// Configuração das credenciais do Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validação das credenciais
if (!supabaseUrl || supabaseUrl.trim() === '' || !supabaseServiceKey || supabaseServiceKey.trim() === '') {
  const errorMessage = "Erro de configuração: URL do Supabase (SUPABASE_URL ou VITE_SUPABASE_URL) e Chave de Serviço (SUPABASE_SERVICE_ROLE_KEY) são obrigatórios e não podem estar vazios.";
  logger.error(errorMessage, { 
    supabaseUrl: !!supabaseUrl ? '***' : 'undefined',
    supabaseServiceKey: !!supabaseServiceKey ? '***' : 'undefined'
  });
  throw new Error(errorMessage);
}

/**
 * Obtém uma representação em string de uma URL para fins de log
 * @param url A URL a ser formatada
 * @returns Uma representação em string segura para logs
 */
const getUrlForLogging = (url: RequestInfo | URL): string => {
  try {
    if (typeof url === 'string') {
      // Remove credenciais sensíveis da URL
      return url.replace(/([?&])([^=]+)=([^&]+)/g, (match, p1, p2) => 
        p2.toLowerCase().includes('key') || p2.toLowerCase().includes('token') 
          ? `${p1}${p2}=***` 
          : match
      );
    }
    if (url instanceof URL) {
      return getUrlForLogging(url.href);
    }
    // Para objetos Request
    return getUrlForLogging(url.url);
  } catch (error) {
    logger.warn('Erro ao formatar URL para log', { error });
    return '[URL não pôde ser formatada]';
  }
};

/**
 * Implementação personalizada de fetch com timeout e lógica de retentativa
 * @param url A URL para a requisição
 * @param options Opções da requisição
 * @param timeout Timeout em milissegundos para cada tentativa
 * @param maxRetries Número máximo de tentativas
 * @returns Uma Promise com a Response
 */
const fetchWithRetry = async (
  url: RequestInfo | URL,
  options: RequestInit = {},
  timeout = 10000, // 10 segundos por padrão
  maxRetries = 3
): Promise<Response> => {
  const urlForLogging = getUrlForLogging(url);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      logger.debug(`Tentativa ${attempt} de ${maxRetries} para ${urlForLogging}`);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Se a resposta for bem-sucedida, retorna imediatamente
      if (response.ok) {
        return response;
      }
      
      // Para erros 4xx, não tenta novamente (exceto 408, 429, etc.)
      if (response.status >= 400 && response.status < 500 && 
          response.status !== 408 && response.status !== 429) {
        logger.warn(`Requisição falhou com status ${response.status}`, {
          url: urlForLogging,
          status: response.status,
          statusText: response.statusText
        });
        return response;
      }
      
      // Para outros erros, lança para ser capturado no bloco catch
      throw new Error(`HTTP error! status: ${response.status}`);
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      
      // Se foi um aborto por timeout, loga como aviso
      if (error.name === 'AbortError') {
        logger.warn(`Timeout na tentativa ${attempt} para ${urlForLogging}`, { 
          timeout,
          attempt,
          maxRetries 
        });
      } else {
        logger.error(`Erro na tentativa ${attempt} para ${urlForLogging}`, { 
          error: error.message,
          stack: error.stack,
          attempt,
          maxRetries
        });
      }
      
      // Se for a última tentativa, não espera
      if (attempt === maxRetries) break;
      
      // Espera exponencial entre as tentativas (1s, 2s, 4s, etc.)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  throw lastError || new Error(`Falha após ${maxRetries} tentativas para ${urlForLogging}`);
};

// Cria o cliente Supabase com a implementação personalizada de fetch
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: fetchWithRetry
  }
});

// Log de sucesso na inicialização
logger.info('Cliente Supabase Admin criado com sucesso', { 
  url: getUrlForLogging(supabaseUrl),
  // Não logamos a chave de serviço por questões de segurança
});