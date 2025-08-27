import { BaseRepository } from '../BaseRepository.js';
import { User, Profile } from '../../types.js';

/**
 * Repositório para operações relacionadas a usuários e perfis.
 */
export class UserRepository extends BaseRepository {
  constructor() {
    // Embora tenhamos duas tabelas (users, profiles),
    // a maioria das operações de "usuário" envolve o perfil.
    super('profiles');
  }

  /**
   * Busca um usuário (da tabela 'users') por email.
   * @param email Email do usuário
   * @returns O usuário ou null se não encontrado
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    return this.executeQuerySingle<User>(query, [email]);
  }

  /**
   * Busca um perfil de usuário por ID.
   * @param userId ID do usuário
   * @returns O perfil do usuário ou null se não encontrado
   */
  async findProfileById(userId: string): Promise<Profile | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    return this.executeQuerySingle<Profile>(query, [userId]);
  }

  /**
   * Busca perfis de usuários por um ID de equipe.
   * @param teamId ID da equipe
   * @returns Lista de perfis de usuários da equipe
   */
  async findProfilesByTeam(teamId: string): Promise<Profile[]> {
    const query = `
      SELECT p.*
      FROM profiles p
      JOIN team_members tm ON p.id = tm.user_id
      WHERE tm.team_id = $1
    `;
    return this.executeQuery<Profile>(query, [teamId]);
  }

  /**
   * Atualiza o token de acesso do Meta (WhatsApp) para um usuário.
   * @param userId ID do usuário
   * @param accessToken Token de acesso
   * @returns O perfil atualizado ou null em caso de erro
   */
  async updateMetaAccessToken(userId: string, accessToken: string): Promise<Profile | null> {
    const query = `
      UPDATE ${this.tableName}
      SET meta_access_token = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    return this.executeQuerySingle<Profile>(query, [accessToken, userId]);
  }
}

// Exportar instância única
export const userRepository = new UserRepository();
