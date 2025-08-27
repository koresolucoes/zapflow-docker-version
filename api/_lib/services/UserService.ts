import { userRepository } from '../db/repositories/UserRepository.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { Database } from '../database.types.js';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Serviço para operações relacionadas a usuários
 */
export class UserService {
  /**
   * Configura um novo usuário no sistema usando a função RPC
   * @param userId ID do usuário
   * @param userEmail Email do usuário
   * @returns Resultado da operação
   */
  async setupNewUser(userId: string, userEmail: string) {
    try {
      // Verificar se o usuário já tem times
      const { data: existingTeams, error: teamsError } = await supabaseAdmin
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      if (teamsError) {
        console.error('[UserService] Erro ao verificar times existentes:', teamsError);
      }

      if (existingTeams && existingTeams.length > 0) {
        console.log(`[UserService] Usuário ${userId} já tem times associados`);
        return { 
          success: true, 
          data: { 
            team_id: existingTeams[0].team_id,
            already_configured: true 
          } 
        };
      }

      // Se não tiver times, chama a função RPC para configurar
      console.log(`[UserService] Configurando novo usuário via RPC: ${userId}`);
      
      const { data: setupData, error: setupError } = await supabaseAdmin
        .rpc('setup_new_user', {
          user_id: userId,
          user_email: userEmail
        });

      if (setupError) {
        console.error('[UserService] Erro na função RPC setup_new_user:', setupError);
        throw new Error('Falha ao configurar novo usuário');
      }

      console.log(`[UserService] Novo usuário configurado via RPC: ${userId}`, setupData);
      return { 
        success: true, 
        data: { 
          team_id: setupData.team?.id,
          already_configured: false
        } 
      };
    } catch (error) {
      console.error('[UserService] Erro ao configurar novo usuário:', error);
      throw new Error('Falha ao configurar novo usuário');
    }
  }

  /**
   * Busca o perfil e times de um usuário
   * @param userId ID do usuário
   * @returns Objeto contendo o perfil e times do usuário
   */
  async getUserProfileAndTeams(userId: string): Promise<{ 
    profile: any; 
    teams: Array<{ 
      id: string; 
      name: string; 
      owner_id: string | null; 
      created_at: string; 
      role: string 
    }> 
  }> {
    try {
      // 1. Garante que o perfil existe primeiro
      const profile = await this.ensureProfileExists(userId);
      
      // 2. Tenta buscar times usando o método RPC
      try {
        const { data: rpcData, error: rpcError } = await supabaseAdmin
          .rpc('get_user_teams_and_profile')
          .eq('user_id', userId)
          .single();

        if (!rpcError && rpcData) {
          // Se o RPC retornou dados, formata a resposta
          const teams = Array.isArray(rpcData.teams) 
            ? rpcData.teams.map((team: any) => ({
                id: team.id,
                name: team.name || `Time ${team.id.substring(0, 8)}`,
                owner_id: team.owner_id,
                created_at: team.created_at || new Date().toISOString(),
                role: team.owner_id === userId ? 'owner' : 'member'
              }))
            : [];

          return {
            profile: rpcData.profile || profile,
            teams: teams
          };
        } else if (rpcError) {
          console.warn('[UserService] RPC get_user_teams_and_profile falhou, usando fallback:', rpcError);
        }
      } catch (rpcError) {
        console.warn('[UserService] Erro ao chamar RPC get_user_teams_and_profile:', rpcError);
      }

      // 3. Fallback: Busca times onde o usuário é dono
      const { data: ownedTeams = [], error: teamsError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('owner_id', userId);

      if (teamsError) {
        console.error('[UserService] Erro ao buscar times do usuário:', teamsError);
      }

      // 4. Busca times onde o usuário é membro (mas não dono)
      const { data: teamMemberships = [], error: membershipsError } = await supabaseAdmin
        .from('team_members')
        .select('*, teams(*)')
        .eq('user_id', userId);

      if (membershipsError) {
        console.error('[UserService] Erro ao buscar associações do usuário:', membershipsError);
      }

      // 5. Se não tiver times, tenta configurar o usuário
      if ((!ownedTeams || ownedTeams.length === 0) && (!teamMemberships || teamMemberships.length === 0)) {
        console.log(`[UserService] Nenhum time encontrado para o usuário ${userId}, tentando configurar...`);
        
        // Obtém o email do usuário para configuração
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userEmail = userData?.user?.email || `${userId}@example.com`;
        
        const result = await this.setupNewUser(userId, userEmail);
        if (result.success) {
          // Se a configuração foi bem-sucedida, tenta novamente
          return this.getUserProfileAndTeams(userId);
        } else {
          console.error('[UserService] Falha ao configurar usuário:', result);
          throw new Error('Falha ao configurar o usuário');
        }
      }

      // 6. Formata os times do usuário
      const userTeams = [
        // Times onde o usuário é dono
        ...(ownedTeams || []).map(t => ({
          id: t.id,
          name: t.name || `Time ${t.id.substring(0, 8)}`,
          owner_id: t.owner_id,
          created_at: t.created_at || new Date().toISOString(),
          role: 'owner' as const
        })),
        // Times onde o usuário é membro (mas não é dono)
        ...((teamMemberships || [])
          .filter(tm => !tm.teams?.owner_id || tm.teams.owner_id !== userId) // Remove se for dono (já incluído acima)
          .map(tm => ({
            id: tm.team_id,
            name: tm.teams?.name || `Time ${tm.team_id.substring(0, 8)}`,
            owner_id: tm.teams?.owner_id || null,
            created_at: tm.created_at || new Date().toISOString(),
            role: (tm.role || 'member') as string
          })))
      ];

      // 7. Remove duplicatas (caso existam)
      const uniqueTeams = Array.from(new Map(userTeams.map(team => [team.id, team])).values());

      return {
        profile,
        teams: uniqueTeams
      };
    } catch (error) {
      console.error('[UserService] Erro ao buscar perfil e times:', error);
      throw new Error('Falha ao buscar perfil e times do usuário');
    }
  }

  /**
   * Garante que o perfil do usuário existe, criando um padrão se necessário
   * @param userId ID do usuário
   * @returns Perfil do usuário
   */
  private async ensureProfileExists(userId: string): Promise<any> {
    try {
      // Primeiro tenta buscar o perfil existente
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        return existingProfile;
      }

      // Se não existir, usa a função RPC para criar perfil e time padrão
      console.log(`[UserService] Criando perfil e time padrão para usuário ${userId}`);
      
      // Obtém o email do usuário
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email || `${userId}@example.com`;
      
      // Chama a função RPC para configurar o novo usuário
      const { data: setupData, error: setupError } = await supabaseAdmin
        .rpc('setup_new_user', {
          user_id: userId,
          user_email: userEmail
        });

      if (setupError) {
        console.error('[UserService] Erro ao configurar novo usuário via RPC:', setupError);
        throw new Error('Falha ao configurar o perfil do usuário');
      }

      // Busca o perfil recém-criado
      const { data: newProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !newProfile) {
        console.error('[UserService] Erro ao buscar perfil recém-criado:', fetchError);
        throw new Error('Falha ao recuperar o perfil do usuário');
      }

      return newProfile;
    } catch (error) {
      console.error('[UserService] Erro ao garantir perfil do usuário:', error);
      throw new Error('Falha ao garantir perfil do usuário');
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
