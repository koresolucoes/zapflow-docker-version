import { Request, Response } from 'express';
import { teamService } from '../_lib/services/TeamService';
import { authenticate, checkTeamAdmin, checkTeamMembership } from '../_lib/middleware';

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Gerenciamento de equipes
 */

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Cria uma nova equipe
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome da equipe
 *               description:
 *                 type: string
 *                 description: Descrição da equipe (opcional)
 *     responses:
 *       201:
 *         description: Equipe criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao criar equipe
 */
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!name) {
      return res.status(400).json({ error: 'O nome da equipe é obrigatório' });
    }

    const team = await teamService.createTeam(name, userId);
    return res.status(201).json(team);
  } catch (error) {
    console.error('Erro ao criar equipe:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar equipe';
    return res.status(500).json({ error: message });
  }
};

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Lista todas as equipes do usuário
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de equipes do usuário
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao listar equipes
 */
export const listUserTeams = async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const teams = await teamService.listUserTeams(userId);
    return res.status(200).json(teams);
  } catch (error) {
    console.error('Erro ao listar equipes:', error);
    return res.status(500).json({ error: 'Erro ao listar equipes' });
  }
};

/**
 * @swagger
 * /api/teams/{teamId}:
 *   get:
 *     summary: Obtém detalhes de uma equipe específica
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da equipe
 *     responses:
 *       200:
 *         description: Detalhes da equipe
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Equipe não encontrada
 *       500:
 *         description: Erro ao buscar equipe
 */
export const getTeam = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const team = await teamService.getTeamWithMembers(teamId, userId);
    if (!team) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    return res.status(200).json(team);
  } catch (error) {
    console.error('Erro ao buscar equipe:', error);
    const message = error instanceof Error ? error.message : 'Erro ao buscar equipe';
    return res.status(500).json({ error: message });
  }
};

/**
 * @swagger
 * /api/teams/{teamId}/members:
 *   post:
 *     summary: Adiciona um membro à equipe
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da equipe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário a ser adicionado
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 default: member
 *                 description: Função do usuário na equipe
 *     responses:
 *       200:
 *         description: Membro adicionado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao adicionar membro
 */
export const addTeamMember = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'member' } = req.body;
    const adminUserId = req.auth?.userId;

    if (!adminUserId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!email) {
      return res.status(400).json({ error: 'O email do usuário é obrigatório' });
    }

    const result = await teamService.addTeamMember(teamId, adminUserId, email, role);
    if (!result) {
      throw new Error('Falha ao adicionar membro à equipe');
    }

    return res.status(200).json({ message: 'Membro adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar membro à equipe:', error);
    const message = error instanceof Error ? error.message : 'Erro ao adicionar membro à equipe';
    const status = message.includes('não encontrado') ? 404 : 500;
    return res.status(status).json({ error: message });
  }
};

/**
 * @swagger
 * /api/teams/{teamId}/members/{userId}:
 *   delete:
 *     summary: Remove um membro da equipe
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da equipe
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário a ser removido
 *     responses:
 *       200:
 *         description: Membro removido com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro ao remover membro
 */
export const removeTeamMember = async (req: Request, res: Response) => {
  try {
    const { teamId, userId } = req.params;
    const adminUserId = req.auth?.userId;

    if (!adminUserId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const result = await teamService.removeTeamMember(teamId, adminUserId, userId);
    if (!result) {
      throw new Error('Falha ao remover membro da equipe');
    }

    return res.status(200).json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover membro da equipe:', error);
    const message = error instanceof Error ? error.message : 'Erro ao remover membro da equipe';
    return res.status(500).json({ error: message });
  }
};

/**
 * Middleware para verificar se o usuário é administrador da equipe
 */
const requireTeamAdmin = [
  authenticate,
  checkTeamMembership,
  checkTeamAdmin
];

/**
 * Middleware para verificar se o usuário é membro da equipe
 */
const requireTeamMembership = [
  authenticate,
  checkTeamMembership
];

/**
 * Configura as rotas do time
 */
export const setupTeamRoutes = (app: any) => {
  // Rotas que exigem autenticação
  app.post('/api/teams', authenticate, createTeam);
  app.get('/api/teams', authenticate, listUserTeams);
  
  // Rotas que exigem ser membro da equipe
  app.get('/api/teams/:teamId', requireTeamMembership, getTeam);
  
  // Rotas que exigem ser administrador da equipe
  app.post('/api/teams/:teamId/members', requireTeamAdmin, addTeamMember);
  app.delete('/api/teams/:teamId/members/:userId', requireTeamAdmin, removeTeamMember);
};

export default {
  createTeam,
  listUserTeams,
  getTeam,
  addTeamMember,
  removeTeamMember,
  setupTeamRoutes
};
