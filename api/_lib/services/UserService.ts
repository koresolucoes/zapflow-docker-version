import { userRepository } from '../db/repositories/UserRepository.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { Database } from '../database.types.js';

// Define the TeamWithRole type
type TeamWithRole = {
  id: string;
  name: string;
  owner_id: string | null;
  created_at: string;
  role: string;
};

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
          return {
            profile: rpcData.profile || profile,
            teams: rpcData.teams || []
          };
        }
      } catch (rpcError) {
        console.warn('[UserService] RPC get_user_teams_and_profile falhou, usando fallback:', rpcError);
      }

      // 3. Busca times onde o usuário é dono
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

      // Inicializa o array de times únicos
      const allTeams: TeamWithRole[] = [];

      // Adiciona times onde o usuário é dono
      if (ownedTeams) {
        allTeams.push(...ownedTeams.map(team => ({
          ...team,
          role: 'admin' as const
        })) as TeamWithRole[]);
      }

      // Adiciona times onde o usuário é membro
      if (teamMemberships) {
        teamMemberships.forEach(membership => {
          if (membership.teams) {
            allTeams.push({
              ...membership.teams,
              role: membership.role || 'member'
            });
          }
        });
      }

      // 5. Se não tiver times, tenta configurar o usuário
      if (allTeams.length === 0) {
        console.log(`[UserService] Nenhum time encontrado para o usuário ${userId}, tentando configurar...`);
        
        // Obtém o email do usuário para configuração
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userEmail = userData?.user?.email || `${userId}@example.com`;
        
        const setupResult = await this.setupNewUser(userId, userEmail);
        
        if (setupResult.success && setupResult.data?.team_id) {
          // Se conseguiu configurar, busca o time criado
          const { data: newTeam } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('id', setupResult.data.team_id)
            .single();

          if (newTeam) {
            allTeams.push({
              ...newTeam,
              role: 'admin'
            });
          }
        }
      }

      // Remove duplicatas (caso o mesmo time apareça mais de uma vez)
      const uniqueTeams = Array.from(
        new Map(allTeams.map(team => [team.id, team])).values()
      );

      return {
        profile: profile,
        teams: uniqueTeams
      };
    } catch (error) {
      console.error('[UserService] Erro ao buscar perfil e times:', error);
      // Tenta retornar pelo menos o perfil se possível
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        return {
          profile: profile || { id: userId, email: `${userId}@example.com` },
          teams: []
        };
      } catch (fallbackError) {
        console.error('[UserService] Erro no fallback de perfil:', fallbackError);
        return {
          profile: { id: userId, email: `${userId}@example.com` },
          teams: []
        };
      }
    }
  }

  /**
   * Garante que o perfil do usuário existe, criando um padrão se necessário
   * @param userId ID do usuário
   * @returns Perfil do usuário
   */
  private async ensureProfileExists(userId: string): Promise<any> {
    try {
      // Tenta buscar o perfil existente
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        // Verifica se o usuário tem alguma equipe
        const { data: teamMembers, error: teamError } = await supabaseAdmin
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId);

        if (teamError || !teamMembers || teamMembers.length === 0) {
          console.log(`[UserService] Usuário ${userId} não tem equipe, configurando...`);
          await this.setupNewUser(userId, existingProfile.email || `${userId}@example.com`);
        }
        
        return existingProfile;
      }

      // Se não existe, tenta criar um perfil básico
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email || `${userId}@example.com`;

      console.log(`[UserService] Criando perfil e time padrão para usuário ${userId}`);
      
      // Chama a função RPC para configurar o novo usuário
      const setupResult = await this.setupNewUser(userId, userEmail);
      
      if (!setupResult.success) {
        throw new Error('Falha ao configurar novo usuário');
      }

      // Busca o perfil recém-criado
      const { data: newProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !newProfile) {
        console.error('[UserService] Erro ao buscar perfil recém-criado:', fetchError);
        throw new Error('Falha ao recuperar perfil após criação');
      }

      return newProfile;
    } catch (error) {
      console.error('[UserService] Erro ao garantir perfil do usuário:', error);
      throw new Error('Falha ao garantir perfil do usuário: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
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
