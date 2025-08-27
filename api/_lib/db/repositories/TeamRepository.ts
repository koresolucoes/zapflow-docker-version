import { BaseRepository } from '../BaseRepository.js';
import { Team, TeamMember, TeamMemberWithEmail, TeamRole } from '../../types.js';

/**
 * Repositório para operações relacionadas a equipes (teams)
 */
export class TeamRepository extends BaseRepository {
  constructor() {
    super('teams');
  }

  async findById(id: string): Promise<Team | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    return this.executeQuerySingle<Team>(query, [id]);
  }

  async findByName(name: string, ownerId?: string): Promise<Team | null> {
    let query = `SELECT * FROM ${this.tableName} WHERE name = $1`;
    const params: any[] = [name];
    if (ownerId) {
      query += ' AND owner_id = $2';
      params.push(ownerId);
    }
    return this.executeQuerySingle<Team>(query, params);
  }

  async findByMember(userId: string): Promise<Team[]> {
    const query = `
      SELECT t.*
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
    `;
    return this.executeQuery<Team>(query, [userId]);
  }

  async getTeamMembers(teamId: string, role?: TeamRole): Promise<TeamMemberWithEmail[]> {
    let query = `
      SELECT tm.user_id, u.email, tm.role, tm.created_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
    `;
    const params: any[] = [teamId];
    if (role) {
      query += ' AND tm.role = $2';
      params.push(role);
    }
    return this.executeQuery<TeamMemberWithEmail>(query, params);
  }

  async getTeamMember(teamId: string, userId: string): Promise<TeamMember | null> {
    const query = 'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2';
    return this.executeQuerySingle<TeamMember>(query, [teamId, userId]);
  }

  async addTeamMember(teamId: string, userId: string, role: TeamRole = 'member'): Promise<TeamMember | null> {
    const query = `
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (team_id, user_id) DO UPDATE SET role = $3
      RETURNING *
    `;
    return this.executeQuerySingle<TeamMember>(query, [teamId, userId, role]);
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2';
    const result = await this.executeQuery(query, [teamId, userId]);
    // The query returns an empty array on success, so we can't check rowCount.
    // If it doesn't throw, we assume success. A more robust check might be needed.
    return true;
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: TeamRole): Promise<TeamMember | null> {
    const query = `
      UPDATE team_members
      SET role = $1
      WHERE team_id = $2 AND user_id = $3
      RETURNING *
    `;
    return this.executeQuerySingle<TeamMember>(query, [role, teamId, userId]);
  }

  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    const member = await this.getTeamMember(teamId, userId);
    return !!member;
  }

  async isTeamAdmin(teamId: string, userId: string): Promise<boolean> {
    const member = await this.getTeamMember(teamId, userId);
    return member?.role === 'admin';
  }
}

// Exportar instância única
export const teamRepository = new TeamRepository();
