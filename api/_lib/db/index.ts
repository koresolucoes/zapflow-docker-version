// Exportar repositórios básicos
export * from './BaseRepository';
export * from './repositories/TeamRepository';
export * from './repositories/UserRepository';

// Exportar serviços
export * from '../services/TeamService';
export * from '../services/UserService';

// Exportar tipos úteis
export type { Database } from '../database.types';

// Exportar instância do Supabase Admin
export { supabaseAdmin } from '../supabaseAdmin';
