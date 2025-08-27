import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { AuthUser, ErrorResponse } from '../middleware/types.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Tipagem para o payload do JWT decodificado
interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!JWT_SECRET) {
    logger.error('JWT_SECRET não está definido nas variáveis de ambiente.');
    const errorResponse: ErrorResponse = {
      error: 'Erro de configuração do servidor',
      message: 'O segredo JWT não está configurado.'
    };
    return res.status(500).json(errorResponse);
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const errorResponse: ErrorResponse = {
      error: 'Não autorizado',
      message: 'Token de autenticação não fornecido ou mal formatado.'
    };
    return res.status(401).json(errorResponse);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.auth = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    logger.warn('Falha na verificação do token JWT', {
      error: error instanceof Error ? error.message : 'Token inválido',
    });
    const errorResponse: ErrorResponse = {
      error: 'Não autorizado',
      message: 'Token inválido ou expirado.'
    };
    return res.status(401).json(errorResponse);
  }
};
