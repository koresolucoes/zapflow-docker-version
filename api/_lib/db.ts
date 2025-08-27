import pg from 'pg';
import { logger } from './utils/logger.js';

const { Pool } = pg;

// Validação para garantir que a variável de ambiente está definida
if (!process.env.DATABASE_URL) {
  logger.error('Erro de configuração: A variável de ambiente DATABASE_URL é obrigatória.');
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Configurações adicionais do pool
  max: 20, // número máximo de clientes no pool
  idleTimeoutMillis: 30000, // tempo que um cliente pode ficar ocioso antes de ser fechado
  connectionTimeoutMillis: 2000, // tempo para esperar por uma conexão antes de dar timeout
});

pool.on('connect', (client) => {
  logger.info('Novo cliente conectado ao banco de dados PostgreSQL.');
});

pool.on('error', (err, client) => {
  logger.error('Erro inesperado no cliente do banco de dados', {
    error: err.message,
    stack: err.stack
  });
});

logger.info('Pool de conexões com o PostgreSQL inicializado com sucesso.');

export default pool;
