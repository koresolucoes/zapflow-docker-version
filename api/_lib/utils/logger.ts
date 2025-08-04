import { Request, Response } from 'express';

/**
 * Níveis de log disponíveis
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

/**
 * Configuração do logger
 */
interface LoggerConfig {
  level: LogLevel;
  timestamp: boolean;
  colorize: boolean;
}

/**
 * Cores para os diferentes níveis de log
 */
const COLORS = {
  [LogLevel.ERROR]: '\x1b[31m', // Vermelho
  [LogLevel.WARN]: '\x1b[33m',  // Amarelo
  [LogLevel.INFO]: '\x1b[36m',  // Ciano
  [LogLevel.DEBUG]: '\x1b[35m', // Magenta
  [LogLevel.TRACE]: '\x1b[37m', // Branco
  reset: '\x1b[0m'
};

/**
 * Configuração padrão do logger
 */
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  timestamp: true,
  colorize: process.env.NODE_ENV !== 'production'
};

/**
 * Classe para gerenciamento de logs
 */
class Logger {
  private config: LoggerConfig;
  private context: string;

  constructor(context: string = 'app', config: Partial<LoggerConfig> = {}) {
    this.context = context;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Define o nível de log
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Registra uma mensagem de erro
   */
  error(message: string, ...meta: any[]): void {
    this.log(LogLevel.ERROR, message, ...meta);
  }

  /**
   * Registra uma mensagem de aviso
   */
  warn(message: string, ...meta: any[]): void {
    this.log(LogLevel.WARN, message, ...meta);
  }

  /**
   * Registra uma mensagem informativa
   */
  info(message: string, ...meta: any[]): void {
    this.log(LogLevel.INFO, message, ...meta);
  }

  /**
   * Registra uma mensagem de depuração
   */
  debug(message: string, ...meta: any[]): void {
    this.log(LogLevel.DEBUG, message, ...meta);
  }

  /**
   * Registra uma mensagem de rastreamento
   */
  trace(message: string, ...meta: any[]): void {
    this.log(LogLevel.TRACE, message, ...meta);
  }

  /**
   * Registra uma mensagem de log
   */
  private log(level: LogLevel, message: string, ...meta: any[]): void {
    if (this.shouldLog(level)) {
      const timestamp = this.config.timestamp ? `[${new Date().toISOString()}] ` : '';
      const context = `[${this.context}]`;
      const levelStr = `[${level.toUpperCase()}]`;
      
      let logMessage = `${timestamp}${context}${levelStr} ${message}`;
      
      if (this.config.colorize) {
        logMessage = `${COLORS[level]}${logMessage}${COLORS.reset}`;
      }
      
      console[level](logMessage, ...meta);
    }
  }

  /**
   * Verifica se o nível de log está habilitado
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  /**
   * Cria um middleware para log de requisições HTTP
   */
  static httpLogger() {
    const logger = new Logger('http');
    
    return (req: Request, res: Response, next: () => void) => {
      const start = Date.now();
      const { method, originalUrl, ip } = req;
      
      logger.info(`${method} ${originalUrl} from ${ip}`);
      
      res.on('finish', () => {
        const { statusCode } = res;
        const responseTime = Date.now() - start;
        
        const logLevel = statusCode >= 500 ? LogLevel.ERROR :
                        statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
        
        logger[logLevel](`${method} ${originalUrl} - ${statusCode} (${responseTime}ms)`);
      });
      
      next();
    };
  }
}

// Exportar instância padrão
export const logger = new Logger('app');

// Exportar tipos
export type { LoggerConfig };

export default logger;
