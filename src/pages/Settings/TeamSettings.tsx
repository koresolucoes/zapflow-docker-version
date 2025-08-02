import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import * as teamService from '../../services/teamService.js';
import { Button } from '../../components/common/Button.js';
import { USER_PLUS_ICON, TRASH_ICON, USERS_ICON } from '../../components/icons/index.js';
import { useUiStore } from '../../stores/uiStore.js';
import { 
    SettingsPage, 
    SettingsSection,
    SettingsTable, 
    SettingsTableRow, 
    SettingsTableCell, 
    SettingsActionCell
} from '../../components/settings/SettingsPage.js';
import { TeamMemberWithEmail } from '@/src/types/index.js';

// Extendendo o tipo para incluir as propriedades adicionais necessárias
interface ExtendedTeamMember extends TeamMemberWithEmail {
    user_name?: string;
    user_email: string;
    status?: 'active' | 'pending';
}

const TeamSettings: React.FC = () => {
    const { activeTeam, user, allTeamMembers, teamLoading } = useAuthStore();
    const { showConfirmation, addToast } = useUiStore();
    const [error, setError] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<string | null>(null);

    const members = useMemo<ExtendedTeamMember[]>(() => {
        if (!activeTeam) return [];
        return allTeamMembers
            .filter((m): m is TeamMemberWithEmail & { user_name?: string; status?: string } => 
                m.team_id === activeTeam.id
            )
            .map(member => ({
                ...member,
                user_name: member.user_name || member.email.split('@')[0], // Usa o nome do usuário ou parte do email
                user_email: member.email,
                status: member.status as 'active' | 'pending' || 'pending' // Assume 'pending' se não houver status
            }));
    }, [allTeamMembers, activeTeam]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTeam || !inviteEmail.trim()) return;
        
        setIsInviting(true);
        setError(null);
        setInviteMessage(null);
        try {
            const result = await teamService.inviteUserToTeam(activeTeam.id, inviteEmail, 'agent');
            setInviteMessage(result.message);
            setInviteEmail('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'agent') => {
        if (!activeTeam) return;
        try {
            await teamService.updateTeamMemberRole(activeTeam.id, userId, newRole);
            addToast("Função atualizada. A alteração pode levar alguns instantes para ser refletida.", 'info');
        } catch (err: any) {
            addToast(`Erro ao atualizar função: ${err.message}`, 'error');
        }
    };
    
    const handleRemoveMember = async (userId: string) => {
        if (!activeTeam) return;
        showConfirmation(
            'Remover Membro',
            'Tem certeza de que deseja remover este membro da equipe?',
            async () => {
                try {
                    await teamService.removeTeamMember(activeTeam.id, userId);
                    addToast('Membro removido com sucesso.', 'success');
                } catch (err: any) {
                    addToast(`Erro ao remover membro: ${err.message}`, 'error');
                }
            }
        );
    };

    if (!activeTeam) {
        return (
            <SettingsPage
                title="Gerenciar Equipe"
                description="Visualize e gerencie os membros da sua equipe"
            >
                <SettingsSection>
                    <p className="text-center text-muted-foreground">Nenhuma equipe ativa selecionada.</p>
                </SettingsSection>
            </SettingsPage>
        );
    }
    
    const isOwner = (memberUserId: string) => activeTeam.owner_id === memberUserId;

    const canManageTeam = useMemo(() => {
        if (!user || !activeTeam) return false;
        if (activeTeam.owner_id === user.id) return true;
        const memberInfo = members.find(m => m.user_id === user.id);
        return memberInfo?.role === 'admin';
    }, [user, activeTeam, members]);

    return (
        <SettingsPage
            title="Gerenciar Equipe"
            description="Visualize e gerencie os membros da sua equipe"
        >
            <SettingsSection 
                title="Convidar Novo Membro"
                description="Os usuários convidados receberão um e-mail para se juntarem à sua equipe."
            >
                {error && <p className="text-destructive text-sm mb-4">{error}</p>}
                {inviteMessage && <p className="text-green-600 dark:text-green-400 text-sm mb-4">{inviteMessage}</p>}
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="flex-1 bg-background p-2 rounded-md text-foreground border border-input"
                        required
                        disabled={!canManageTeam}
                    />
                    <Button 
                        type="submit" 
                        disabled={isInviting || !canManageTeam}
                        className="w-full sm:w-auto"
                    >
                        <USER_PLUS_ICON className="w-4 h-4 mr-2" />
                        {isInviting ? 'Enviando convite...' : 'Convidar'}
                    </Button>
                </form>
            </SettingsSection>

            <SettingsSection 
                title="Membros da Equipe"
                description={`${members.length} membro(s) na equipe`}
            >
                <SettingsTable 
                    headers={['Nome', 'E-mail', 'Função', 'Status']}
                    className="mt-4"
                >
                    {members.map((member) => (
                        <SettingsTableRow key={member.user_id}>
                            <SettingsTableCell className="font-medium">
                                {member.user_name || member.user_email?.split('@')[0] || 'Usuário sem nome'}
                                {isOwner(member.user_id) && (
                                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                        Proprietário
                                    </span>
                                )}
                            </SettingsTableCell>
                            <SettingsTableCell>
                                {member.user_email}
                            </SettingsTableCell>
                            <SettingsTableCell>
                                {isOwner(member.user_id) ? (
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                        Administrador
                                    </span>
                                ) : (
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.user_id, e.target.value as 'admin' | 'agent')}
                                        disabled={!canManageTeam || isOwner(member.user_id)}
                                        className="bg-background border border-input rounded px-2 py-1 text-sm"
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="agent">Agente</option>
                                    </select>
                                )}
                            </SettingsTableCell>
                            <SettingsTableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    member.status === 'active' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                    {member.status === 'active' ? 'Ativo' : 'Pendente'}
                                </span>
                            </SettingsTableCell>
                            <SettingsActionCell>
                                {!isOwner(member.user_id) && canManageTeam && (
                                    <button
                                        onClick={() => handleRemoveMember(member.user_id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                        title="Remover membro"
                                    >
                                        <TRASH_ICON className="w-5 h-5" />
                                    </button>
                                )}
                            </SettingsActionCell>
                        </SettingsTableRow>
                    ))}
                </SettingsTable>
            </SettingsSection>
        </SettingsPage>
    );
};

export default TeamSettings;