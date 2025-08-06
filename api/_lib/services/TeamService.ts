import { teamRepository } from '../db/repositories/TeamRepository.js';
import { userService } from './UserService.js';
import { Database } from '../database.types.js';
import { logger } from '../utils/logger.js';

type Team = Database['public']['Tables']['teams']['Row'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface TeamWithMembers extends Team {
  members: Array<{
    id: string;
    email: string;
    role: string;
    created_at: string;
  }>;
}

/**
 * Serviço para operações relacionadas a equipes
 */
export class TeamService {
  /**
   * Cria uma nova equipe
   * @param name Nome da equipe
   * @param ownerId ID do dono da equipe
   * @param description Descrição da equipe (opcional)
   */
  async createTeam(name: string, ownerId: string): Promise<Team | null> {
    try {
      // Verificar se o usuário já tem uma equipe com o mesmo nome
      const existingTeam = await teamRepository.findByName(name, ownerId);
      if (existingTeam) {
        throw new Error('Você já tem uma equipe com este nome');
      }

      // Criar a equipe
      const teamData: Database['public']['Tables']['teams']['Insert'] = {
        name,
        owner_id: ownerId,
        created_at: new Date().toISOString()
      };

      const team = await teamRepository.create(teamData);

      if (!team) {
        throw new Error('Falha ao criar equipe');
      }

      // Adicionar o dono como membro administrador da equipe
      await teamRepository.addTeamMember(team.id, ownerId, 'admin');

      logger.info(`Equipe criada com sucesso: ${team.id}`, { teamId: team.id, ownerId });
      return team;
    } catch (error) {
      logger.error('Erro ao criar equipe', { error, ownerId, name });
      throw error instanceof Error ? error : new Error('Falha ao criar equipe');
    }
  }

  /**
   * Busca uma equipe por ID com seus membros
   * @param teamId ID da equipe
   * @param userId ID do usuário que está fazendo a requisição
   */
  async getTeamWithMembers(teamId: string, userId: string): Promise<TeamWithMembers | null> {
    try {
      // Verifica se o usuário tem permissão para acessar a equipe
      const isMember = await this.isTeamMember(teamId, userId);
      if (!isMember) {
        throw new Error('Acesso negado: você não é membro desta equipe');
      }

      // Busca a equipe
      const team = await teamRepository.findById(teamId);
      if (!team) {
        return null;
      }

      // Busca os membros da equipe
      const members = await teamRepository.getTeamMembers(teamId);

      return {
        ...team,
        members: members.map(member => ({
          id: member.user_id,
          email: member.user_email || '',
          role: member.role,
          created_at: member.created_at
        }))
      };
    } catch (error) {
      logger.error('Erro ao buscar equipe com membros', { error, teamId, userId });
      throw error instanceof Error ? error : new Error('Falha ao buscar equipe');
    }
  }

  /**
   * Adiciona um membro a uma equipe
   * @param teamId ID da equipe
   * @param adminUserId ID do usuário administrador que está adicionando o membro
   * @param userEmail Email do usuário a ser adicionado
   * @param role Função do novo membro (padrão: 'member')
   */
  async addTeamMember(teamId: string, adminUserId: string, userEmail: string, role = 'member'): Promise<boolean> {
    try {
      // Verifica se o usuário é administrador da equipe
      const isAdmin = await this.isTeamAdmin(teamId, adminUserId);
      if (!isAdmin) {
        throw new Error('Acesso negado: você não é administrador desta equipe');
      }

      // Busca o usuário pelo email
      const user = await userService.findByEmail(userEmail);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verifica se o usuário já é membro da equipe
      const isMember = await this.isTeamMember(teamId, user.id);
      if (isMember) {
        throw new Error('Este usuário já é membro da equipe');
      }

      // Adiciona o usuário à equipe
      await teamRepository.addTeamMember(teamId, user.id, role);
      
      logger.info(`Membro adicionado à equipe`, { teamId, userId: user.id, role });
      return true;
    } catch (error) {
      logger.error('Erro ao adicionar membro à equipe', { error, teamId, adminUserId, userEmail });
      throw error instanceof Error ? error : new Error('Falha ao adicionar membro à equipe');
    }
  }

  /**
   * Remove um membro de uma equipe
   * @param teamId ID da equipe
   * @param adminUserId ID do usuário administrador que está removendo o membro
   * @param userId ID do usuário a ser removido
   */
  async removeTeamMember(teamId: string, adminUserId: string, userId: string): Promise<boolean> {
    try {
      // Verifica se o usuário é administrador da equipe
      const isAdmin = await this.isTeamAdmin(teamId, adminUserId);
      if (!isAdmin) {
        throw new Error('Acesso negado: você não é administrador desta equipe');
      }

      // Impede que um administrador se remova se for o único administrador
      if (adminUserId === userId) {
        const admins = await teamRepository.getTeamMembers(teamId, 'admin');
        if (admins.length <= 1) {
          throw new Error('Não é possível remover o único administrador da equipe');
        }
      }

      // Remove o membro da equipe
      await teamRepository.removeTeamMember(teamId, userId);
      
      logger.info(`Membro removido da equipe`, { teamId, userId, removedBy: adminUserId });
      return true;
    } catch (error) {
      logger.error('Erro ao remover membro da equipe', { error, teamId, adminUserId, userId });
      throw error instanceof Error ? error : new Error('Falha ao remover membro da equipe');
    }
  }

  /**
   * Atualiza a função de um membro na equipe
   * @param teamId ID da equipe
   * @param adminUserId ID do usuário administrador que está atualizando a função
   * @param userId ID do usuário que terá a função atualizada
   * @param role Nova função
   */
  async updateTeamMemberRole(teamId: string, adminUserId: string, userId: string, role: string): Promise<boolean> {
    try {
      // Verifica se o usuário é administrador da equipe
      const isAdmin = await this.isTeamAdmin(teamId, adminUserId);
      if (!isAdmin) {
        throw new Error('Acesso negado: você não é administrador desta equipe');
      }

      // Atualiza a função do membro
      await teamRepository.updateTeamMemberRole(teamId, userId, role);
      
      logger.info(`Função do membro atualizada`, { teamId, userId, role, updatedBy: adminUserId });
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar função do membro', { error, teamId, adminUserId, userId, role });
      throw error instanceof Error ? error : new Error('Falha ao atualizar função do membro');
    }
  }

  /**
   * Lista todas as equipes de um usuário
   * @param userId ID do usuário
   */
  async listUserTeams(userId: string): Promise<Team[]> {
    try {
      return await teamRepository.findByMember(userId);
    } catch (error) {
      logger.error('Erro ao listar equipes do usuário', { error, userId });
      throw error instanceof Error ? error : new Error('Falha ao listar equipes');
    }
  }

  /**
   * Verifica se um usuário é administrador de uma equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário
   */
  async isTeamAdmin(teamId: string, userId: string): Promise<boolean> {
    try {
      const member = await teamRepository.getTeamMember(teamId, userId);
      return member?.role === 'admin';
    } catch (error) {
      logger.error('Erro ao verificar se usuário é administrador', { error, teamId, userId });
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
      const member = await teamRepository.getTeamMember(teamId, userId);
      return !!member;
    } catch (error) {
      logger.error('Erro ao verificar se usuário é membro', { error, teamId, userId });
      return false;
    }
  }
}

// Exportar instância única
export const teamService = new TeamService();
