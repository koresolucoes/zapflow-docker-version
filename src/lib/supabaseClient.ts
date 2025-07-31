import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Tenta obter as variáveis de ambiente de diferentes maneiras para maior compatibilidade
const getEnvVar = (key: string): string => {
  // Primeiro tenta do import.meta.env (Vite)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  
  // Depois tenta do process.env (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[`VITE_${key}`] || '';
  }
  
  // Se não encontrar, retorna string vazia
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente não encontradas:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '***' : 'não definido');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' : 'não definido');
  throw new Error("As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.");
}

// Cria o cliente Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});