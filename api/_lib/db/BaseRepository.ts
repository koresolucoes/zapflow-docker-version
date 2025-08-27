import pool from '../db.js';
import { logger } from '../utils/logger.js';

/**
 * Classe base para repositórios.
 * Fornece acesso ao pool de conexões e logging.
 * As classes filhas devem implementar seus próprios métodos de acesso a dados.
 */
export abstract class BaseRepository {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Executa uma query de forma segura.
   * @param query A string da query SQL.
   * @param params Os parâmetros para a query.
   */
  protected async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error(`Erro ao executar query na tabela ${this.tableName}`, {
        error: error instanceof Error ? error.message : String(error),
        query: query.substring(0, 100) + '...', // Log truncated query
        params,
      });
      // Lança o erro para que a camada de serviço possa tratá-lo
      throw error;
    }
  }

   /**
   * Executa uma query que deve retornar um único resultado.
   * @param query A string da query SQL.
   * @param params Os parâmetros para a query.
   */
  protected async executeQuerySingle<T>(query: string, params: any[] = []): Promise<T | null> {
     const rows = await this.executeQuery<T>(query, params);
     return rows[0] || null;
  }
}
