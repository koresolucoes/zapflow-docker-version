import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { userService } from '../services/UserService.js';
import { AuthUser, ErrorResponse } from './types.js';

/**
 * Interface para o objeto de autenticação que será anexado ao objeto Request
 */
declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

/**
 * Middleware para verificar se o usuário está autenticado
 * Verifica o token JWT no cabeçalho de autorização
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Verificar se o cabeçalho de autorização está presente
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorResponse: ErrorResponse = {
        error: 'Não autorizado',
        message: 'Token de autenticação não fornecido'
      };
      return res.status(401).json(errorResponse);
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];
    
    // Verificar o token com o Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      const errorResponse: ErrorResponse = {
        error: 'Não autorizado',
        message: 'Token inválido ou expirado'
      };
      return res.status(401).json(errorResponse);
    }

    // Anexar informações do usuário ao objeto de requisição
    req.auth = {
      userId: user.id,
      email: user.email as string,
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    const errorResponse: ErrorResponse = {
      error: 'Erro de autenticação',
      message: 'Ocorreu um erro ao processar a autenticação'
    };
    return res.status(500).json(errorResponse);
  }
};

/**
 * Middleware para verificar se o usuário é membro de uma equipe específica
 * @param teamIdParam Nome do parâmetro na rota que contém o ID da equipe
 */
export const checkTeamMembership = (teamIdParam = 'teamId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.auth) {
        const errorResponse: ErrorResponse = {
          error: 'Não autorizado',
          message: 'Usuário não autenticado'
        };
        return res.status(401).json(errorResponse);
      }

      const teamId = req.params[teamIdParam] || req.body.teamId;
      
      if (!teamId) {
        const errorResponse: ErrorResponse = {
          error: 'ID da equipe não fornecido',
          message: 'O ID da equipe é obrigatório'
        };
        return res.status(400).json(errorResponse);
      }

      // Verificar se o usuário é membro da equipe
      const isMember = await userService.isTeamMember(req.auth.userId, teamId);
      
      if (!isMember) {
        const errorResponse: ErrorResponse = {
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar esta equipe'
        };
        return res.status(403).json(errorResponse);
      }

      // Se chegou até aqui, o usuário tem permissão
      if (req.auth) {
        req.auth.teamId = teamId;
      }
      next();
    } catch (error) {
      console.error('Erro ao verificar associação à equipe:', error);
      const errorResponse: ErrorResponse = {
        error: 'Erro de autorização',
        message: 'Ocorreu um erro ao verificar as permissões'
      };
      return res.status(500).json(errorResponse);
    }
  };
};

/**
 * Middleware para verificar se o usuário é administrador de uma equipe
 * @param teamIdParam Nome do parâmetro na rota que contém o ID da equipe
 */
export const checkTeamAdmin = (teamIdParam = 'teamId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.auth) {
        const errorResponse: ErrorResponse = {
          error: 'Não autorizado',
          message: 'Usuário não autenticado'
        };
        return res.status(401).json(errorResponse);
      }

      const teamId = req.params[teamIdParam] || req.body.teamId;
      
      if (!teamId) {
        const errorResponse: ErrorResponse = {
          error: 'ID da equipe não fornecido',
          message: 'O ID da equipe é obrigatório'
        };
        return res.status(400).json(errorResponse);
      }

      // Verificar se o usuário é administrador da equipe
      const isAdmin = await userService.isTeamAdmin(req.auth.userId, teamId);
      
      if (!isAdmin) {
        const errorResponse: ErrorResponse = {
          error: 'Acesso negado',
          message: 'Você precisa ser administrador desta equipe'
        };
        return res.status(403).json(errorResponse);
      }

      // Se chegou até aqui, o usuário tem permissão
      if (req.auth) {
        req.auth.teamId = teamId;
      }
      next();
    } catch (error) {
      console.error('Erro ao verificar permissões de administrador:', error);
      const errorResponse: ErrorResponse = {
        error: 'Erro de autorização',
        message: 'Ocorreu um erro ao verificar as permissões de administrador'
      };
      return res.status(500).json(errorResponse);
    }
  };
};

/**
 * Middleware para verificar se o usuário tem uma função específica
 * @param roles Lista de funções permitidas
 */
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.auth) {
        const errorResponse: ErrorResponse = {
          error: 'Não autorizado',
          message: 'Usuário não autenticado'
        };
        return res.status(401).json(errorResponse);
      }

      // Verificar se o usuário tem uma das funções necessárias
      if (req.auth.role && !roles.includes(req.auth.role)) {
        const errorResponse: ErrorResponse = {
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar este recurso'
        };
        return res.status(403).json(errorResponse);
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar funções do usuário:', error);
      const errorResponse: ErrorResponse = {
        error: 'Erro de autorização',
        message: 'Ocorreu um erro ao verificar as permissões'
      };
      return res.status(500).json(errorResponse);
    }
  };
};
