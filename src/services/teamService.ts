import { apiGet, apiPost, apiPut, apiDelete } from '../lib/apiClient.js';
import type { TeamMemberWithEmail } from '../types/index.js';

export const getTeamMembersForTeams = async (teamIds: string[]): Promise<TeamMemberWithEmail[]> => {
    if (teamIds.length === 0) {
        return [];
    }

    try {
        const query = new URLSearchParams();
        teamIds.forEach(id => query.append('team_ids', id));
        
        const members = await apiGet<TeamMemberWithEmail[]>(`/members?${query.toString()}`);
        return members || [];
    } catch (error) {
        console.error("Failed to fetch team members:", error);
        throw new Error('Failed to fetch team members');
    }
};

export const inviteUserToTeam = async (teamId: string, email: string, role: 'admin' | 'agent'): Promise<TeamMemberWithEmail> => {
    try {
        const response = await apiPost<TeamMemberWithEmail>('/members', {
            team_id: teamId,
            email,
            role,
        });
        return response;
    } catch (error) {
        console.error("Failed to invite user to team:", error);
        throw new Error('Failed to invite user to team');
    }
};

export const updateTeamMemberRole = async (teamId: string, userId: string, newRole: 'admin' | 'agent'): Promise<void> => {
    try {
        await apiPut(`/members/${userId}/role`, { 
            team_id: teamId, 
            role: newRole 
        });
    } catch (error) {
        console.error("Failed to update team member role:", error);
        throw new Error('Failed to update team member role');
    }
};

export const removeTeamMember = async (teamId: string, userId: string): Promise<void> => {
    try {
        await apiDelete(`/teams/${teamId}/members/${userId}`);
    } catch (error) {
        console.error("Failed to remove team member:", error);
        throw new Error('Failed to remove team member');
    }
};