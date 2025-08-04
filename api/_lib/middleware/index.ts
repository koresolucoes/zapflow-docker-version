// Exportar middlewares de autenticação
export * from './auth';

// Exportar tipos de middleware
export type { AuthUser, AsyncRequestHandler, SyncRequestHandler, RequestHandler, ValidationError, ErrorResponse } from './types';

// Exportar outros middlewares aqui conforme necessário
// export * from './validation';
// export * from './logging';
