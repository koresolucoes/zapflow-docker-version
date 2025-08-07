// Exportar camada de acesso a dados
export * from './db/index.js';

// Exportar serviços
export * from './services/index.js';

// Exportar tipos e interfaces
export * from './types.js';

// Exportar utilitários
export * from './utils/index.js';

// Exportar configurações
export { supabaseAdmin } from './supabaseAdmin.js';

// Exportar tipos do banco de dados (apenas os tipos, não as constantes)
export type { Database } from './database.types.js';
