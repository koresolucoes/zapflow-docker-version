import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabaseAdmin } from '../supabaseAdmin';
import { Database } from '../database.types';
import { logger } from '../utils/logger';

type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

/**
 * Classe base para repositórios que acessam o banco de dados
 * @template T Nome da tabela no banco de dados
 */
export abstract class BaseRepository<T extends keyof Database['public']['Tables']> {
  protected tableName: T;
  protected table: ReturnType<typeof supabaseAdmin.from>;

  constructor(tableName: T) {
    this.tableName = tableName;
    this.table = supabaseAdmin.from(this.tableName as string);
  }

  /**
   * Retorna uma query para a tabela do repositório
   * @deprecated Use a propriedade `table` diretamente
   */
  protected get query() {
    return this.table;
  }

  /**
   * Busca um registro por ID
   * @param id ID do registro
   * @param columns Colunas a serem retornadas (padrão: *)
   */
  async findById(
    id: string, 
    columns = '*'
  ): Promise<TableRow<T> | null> {
    try {
      const { data, error } = await this.table
        .select(columns)
        .eq('id', id)
        .single<TableRow<T>>();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error(`Erro ao buscar ${String(this.tableName)} por ID`, { 
        error, 
        table: this.tableName,
        id 
      });
      return null;
    }
  }

  /**
   * Busca todos os registros que atendem aos critérios
   * @param filter Filtros opcionais
   * @param columns Colunas a serem retornadas (padrão: *)
   */
  async findAll(
    filter: Partial<TableRow<T>> = {},
    columns = '*'
  ): Promise<TableRow<T>[]> {
    try {
      let query = this.table.select(columns);
      
      // Aplica os filtros
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query as { data: TableRow<T>[] | null; error: PostgrestError | null };

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error(`Erro ao buscar ${String(this.tableName)}`, { 
        error, 
        table: this.tableName,
        filter 
      });
      return [];
    }
  }

  /**
   * Cria um novo registro
   * @param data Dados do registro a ser criado
   */
  async create(
    data: TableInsert<T>
  ): Promise<TableRow<T> | null> {
    try {
      const { data: result, error } = await this.table
        .insert([data])
        .select()
        .single<TableRow<T>>();

      if (error) {
        throw error;
      }

      logger.info(`${String(this.tableName)} criado com sucesso`, { 
        ...(result && 'id' in result ? { id: result.id } : {}),
        table: this.tableName 
      });

      return result;
    } catch (error) {
      logger.error(`Erro ao criar ${String(this.tableName)}`, { 
        error, 
        table: this.tableName,
        data
      });
      return null;
    }
  }

  /**
   * Atualiza um registro existente
   * @param id ID do registro a ser atualizado
   * @param updates Campos a serem atualizados
   */
  async update(
    id: string, 
    updates: TableUpdate<T>
  ): Promise<TableRow<T> | null> {
    try {
      const { data, error } = await this.table
        .update(updates)
        .eq('id', id)
        .select()
        .single<TableRow<T>>();

      if (error) {
        throw error;
      }

      logger.info(`${String(this.tableName)} atualizado`, { 
        id, 
        table: this.tableName,
        updates 
      });

      return data;
    } catch (error) {
      logger.error(`Erro ao atualizar ${String(this.tableName)}`, { 
        error, 
        table: this.tableName,
        id,
        updates
      });
      return null;
    }
  }

  /**
   * Remove um registro
   * @param id ID do registro a ser removido
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.table
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      logger.info(`${String(this.tableName)} removido`, { 
        id, 
        table: this.tableName 
      });

      return true;
    } catch (error) {
      logger.error(`Erro ao remover ${String(this.tableName)}`, { 
        error, 
        table: this.tableName,
        id 
      });
      return false;
    }
  }

  /**
   * Verifica se um registro com o ID especificado existe
   * @param id ID do registro
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { data, error } = await this.table
        .select('id')
        .eq('id', id)
        .single<TableRow<T>>();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return !!data;
    } catch (error) {
      logger.error(`Erro ao verificar existência de ${String(this.tableName)}`, { 
        error, 
        table: this.tableName,
        id 
      });
      return false;
    }
  }
}
