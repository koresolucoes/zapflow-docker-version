import { BaseRepository } from '../BaseRepository';
import { Database } from '../../database.types';
import { supabaseAdmin } from '../../supabaseAdmin';
import { logger } from '../../utils/logger';

type Team = Database['public']['Tables']['teams']['Row'];
type TeamInsert = Database['public']['Tables']['teams']['Insert'];
type TeamUpdate = Database['public']['Tables']['teams']['Update'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface TeamWithMembers extends Team {
  members: Array<{
    user_id: string;
    user_email?: string;
    role: string;
    created_at: string;
  }>;
}

/**
 * Repositório para operações relacionadas a equipes (teams)
 */
export class TeamRepository extends BaseRepository<'teams'> {
  constructor() {
    super('teams');
  }

  /**
   * Busca uma equipe pelo nome
   * @param name Nome da equipe
   * @param ownerId ID do dono da equipe (opcional)
   */
  async findByName(name: string, ownerId?: string): Promise<Team | null> {
    try {
      let query = this.query
        .select('*')
        .eq('name', name);

      if (ownerId) {
        query = query.eq('owner_id', ownerId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Erro ao buscar equipe por nome', { error, name, ownerId });
      return null;
    }
  }

  /**
   * Busca todas as equipes de um usuário
   * @param userId ID do usuário
   */
  async findByMember(userId: string): Promise<Team[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('team_members')
        .select<{ team: Team }>('team(*)')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return data?.map(item => item.team) || [];
    } catch (error) {
      logger.error('Erro ao buscar equipes do usuário', { error, userId });
      return [];
    }
  }

  /**
   * Busca os membros de uma equipe
   * @param teamId ID da equipe
   * @param role Filtro opcional por função
   */
  async getTeamMembers(teamId: string, role?: string): Promise<Array<{
    user_id: string;
    user_email?: string;
    role: string;
    created_at: string;
  }>> {
    try {
      let query = supabaseAdmin
        .from('team_members')
        .select('user_id, role, created_at, profiles(email)')
        .eq('team_id', teamId);

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(member => ({
        user_id: member.user_id,
        user_email: (member as any).profiles?.email,
        role: member.role,
        created_at: member.created_at
      }));
    } catch (error) {
      logger.error('Erro ao buscar membros da equipe', { error, teamId, role });
      return [];
    }
  }

  /**
   * Obtém um membro específico de uma equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário
   */
  async getTeamMember(teamId: string, userId: string): Promise<{
    user_id: string;
    role: string;
    created_at: string;
  } | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('team_members')
        .select('user_id, role, created_at')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Erro ao buscar membro da equipe', { error, teamId, userId });
      return null;
    }
  }

  /**
   * Adiciona um membro a uma equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário
   * @param role Função do membro na equipe
   */
  async addTeamMember(teamId: string, userId: string, role = 'member'): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('team_members')
        .upsert(
          { team_id: teamId, user_id: userId, role },
          { onConflict: 'team_id,user_id' }
        );

      if (error) {
        throw error;
      }

      logger.info('Membro adicionado à equipe', { teamId, userId, role });
      return true;
    } catch (error) {
      logger.error('Erro ao adicionar membro à equipe', { error, teamId, userId, role });
      return false;
    }
  }

  /**
   * Remove um membro de uma equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário
   */
  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      logger.info('Membro removido da equipe', { teamId, userId });
      return true;
    } catch (error) {
      logger.error('Erro ao remover membro da equipe', { error, teamId, userId });
      return false;
    }
  }

  /**
   * Atualiza a função de um membro na equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário
   * @param role Nova função do membro
   */
  async updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      logger.info('Função do membro atualizada', { teamId, userId, role });
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar função do membro', { error, teamId, userId, role });
      return false;
    }
  }

  /**
   * Verifica se um usuário é membro de uma equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário
   */
  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.getTeamMember(teamId, userId);
      return !!member;
    } catch (error) {
      logger.error('Erro ao verificar se usuário é membro', { error, teamId, userId });
      return false;
    }
  }

  /**
   * Verifica se um usuário é administrador de uma equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário
   */
  async isTeamAdmin(teamId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.getTeamMember(teamId, userId);
      return member?.role === 'admin';
    } catch (error) {
      logger.error('Erro ao verificar se usuário é administrador', { error, teamId, userId });
      return false;
    }
  }

  /**
   * Busca uma equipe por ID
   * @param id ID da equipe
   */
  async findById(id: string): Promise<Team | null> {
    try {
      const { data, error } = await this.query
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Erro ao buscar equipe por ID', { error, id });
      return null;
    }
  }
}

// Exportar instância única
export const teamRepository = new TeamRepository();
