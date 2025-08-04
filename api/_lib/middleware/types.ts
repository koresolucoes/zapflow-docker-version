import { Request, Response, NextFunction } from 'express';

/**
 * Interface para o objeto de autenticação que será anexado ao objeto Request
 */
export interface AuthUser {
  userId: string;
  email: string;
  role?: string;
  teamId?: string;
}

/**
 * Estende a interface Request do Express para incluir o objeto de autenticação
 */
declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

/**
 * Tipo para funções de middleware assíncronas
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Tipo para funções de middleware síncronas
 */
export type SyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

/**
 * Tipo para funções de middleware que podem ser assíncronas ou síncronas
 */
export type RequestHandler = AsyncRequestHandler | SyncRequestHandler;

/**
 * Interface para erros de validação
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Interface para respostas de erro padronizadas
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  validationErrors?: ValidationError[];
}
