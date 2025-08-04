import { userRepository } from '../db/repositories/UserRepository';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { Database } from '../database.types.js';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Serviço para operações relacionadas a usuários
 */
export class UserService {
  /**
   * Configura um novo usuário no sistema
   * @param userId ID do usuário
   * @param userEmail Email do usuário
   * @returns Resultado da operação
   */
  async setupNewUser(userId: string, userEmail: string) {
    try {
      // Verificar se o usuário já existe
      const existingUser = await userRepository.findById(userId);
      if (existingUser) {
        console.log(`[UserService] Usuário ${userId} já existe no sistema`);
        return { success: true, user: existingUser };
      }

      // Usar a função RPC para configuração inicial
      const { data, error } = await supabaseAdmin
        .rpc('setup_new_user', { 
          user_id: userId, 
          user_email: userEmail 
        })
        .single();

      if (error) throw error;
      
      console.log(`[UserService] Novo usuário configurado: ${userId}`);
      return { success: true, data };
    } catch (error) {
      console.error('[UserService] Erro ao configurar novo usuário:', error);
      throw new Error('Falha ao configurar novo usuário');
    }
  }

  /**
   * Busca o perfil e times de um usuário
   * @param userId ID do usuário
   */
  async getUserProfileAndTeams(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_user_teams_and_profile')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[UserService] Erro ao buscar perfil e times:', error);
      throw new Error('Falha ao buscar perfil e times do usuário');
    }
  }

  /**
   * Verifica se um usuário é membro de um time
   * @param userId ID do usuário
   * @param teamId ID do time
   */
  async isTeamMember(userId: string, teamId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('is_team_member', { p_team_id: teamId })
        .single();

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error(`[UserService] Erro ao verificar membro do time ${teamId}:`, error);
      return false;
    }
  }

  /**
   * Verifica se um usuário é administrador de um time
   * @param userId ID do usuário
   * @param teamId ID do time
   */
  async isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('is_team_admin', { p_team_id: teamId })
        .single();

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error(`[UserService] Erro ao verificar admin do time ${teamId}:`, error);
      return false;
    }
  }

  /**
   * Atualiza o token de acesso do Meta (WhatsApp) para um usuário
   * @param userId ID do usuário
   * @param accessToken Novo token de acesso
   */
  async updateMetaAccessToken(userId: string, accessToken: string): Promise<Profile | null> {
    return userRepository.updateMetaAccessToken(userId, accessToken);
  }

  /**
   * Busca um usuário por ID
   * @param userId ID do usuário
   */
  async findById(userId: string): Promise<Profile | null> {
    return userRepository.findById(userId);
  }

  /**
   * Busca um usuário por email
   * @param email Email do usuário
   */
  async findByEmail(email: string): Promise<Profile | null> {
    return userRepository.findByEmail(email);
  }
}

// Exportar instância única
export const userService = new UserService();
