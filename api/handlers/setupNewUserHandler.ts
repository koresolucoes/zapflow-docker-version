import { Request, Response } from 'express';
import { userService } from '../_lib';

/**
 * @swagger
 * /api/setup-new-user:
 *   post:
 *     summary: Configura um novo usuário no sistema
 *     description: Cria uma nova equipe para o usuário e configura seu perfil inicial
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, email]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário no Supabase Auth
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *     responses:
 *       200:
 *         description: Usuário configurado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     team_id:
 *                       type: string
 *                       description: ID da equipe criada para o usuário
 *       400:
 *         description: Dados de entrada inválidos
 *       500:
 *         description: Erro ao configurar o usuário
 */
export async function setupNewUserHandler(req: Request, res: Response) {
  // Verificar método HTTP
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ 
      error: 'Método não permitido',
      allowed: ['POST']
    });
  }

  try {
    const { userId, email } = req.body;
    
    // Validar entrada
    if (!userId || !email) {
      return res.status(400).json({ 
        error: 'Dados de entrada inválidos',
        details: 'userId e email são obrigatórios'
      });
    }

    // Usar o UserService para configurar o novo usuário
    const result = await userService.setupNewUser(userId, email);
    
    // Se chegou até aqui, a operação foi bem-sucedida
    return res.status(200).json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Erro ao configurar novo usuário:', error);
    
    // Verificar o tipo de erro para retornar o status apropriado
    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Erro ao configurar usuário',
        message: error.message
      });
    }
    
    // Erro genérico
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Ocorreu um erro inesperado ao configurar o usuário'
    });
  }
}