// Exportar repositórios básicos
export * from './BaseRepository';
export * from './repositories/TeamRepository';
export * from './repositories/UserRepository';

// Exportar serviços
// Estes serão movidos ou removidos à medida que a refatoração avança.
// Por enquanto, vamos mantê-los para evitar quebras em outras partes do sistema.
export * from '../services/TeamService';
export * from '../services/UserService';
