import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types.js';

// Tenta obter as variáveis de ambiente de diferentes maneiras para maior compatibilidade
const getEnvVar = (key: string): string => {
  // 1) Runtime via window.__ENV__ (injetado pelo container em produção)
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    const winVal = (window as any).__ENV__[key];
    if (winVal) return winVal;
  }
  // 2) Vite import.meta.env durante build/dev
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const viteVal = (import.meta as any).env[key];
    if (viteVal) return viteVal;
  }
  // 3) process.env (SSR/tests)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[`VITE_${key}`] || '';
  }
  // 4) fallback
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