import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { setupTeamRoutes } from './handlers/teamHandler.js';
import { setupNewUserHandler } from './handlers/setupNewUserHandler.js';
import { conversationHandler } from './handlers/conversationHandler.js';
import { metricsHandler } from './handlers/metricsHandler.js';
import { runTriggerHandler } from './handlers/runTriggerHandler.js';
import { webhookIdHandler } from './handlers/webhookIdHandler.js';
import { triggerIdHandler } from './handlers/triggerIdHandler.js';
import { membersHandler } from './handlers/membersHandler.js';
import { analyzeSentimentHandler } from './handlers/analyzeSentimentHandler.js';
import { generateReplyHandler } from './handlers/generateReplyHandler.js';
import { enqueueCampaignSendHandler } from './handlers/enqueueCampaignSendHandler.js';
import { generateTemplateHandler } from './handlers/generateTemplateHandler.js';
import { processCampaignMessageHandler } from './handlers/processCampaignMessageHandler.js';
import { testWebhookHandler } from './handlers/testWebhookHandler.js';
import { healthCheckHandler } from './handlers/healthCheckHandler.js';

import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZapFlow API',
      version: '1.0.0',
      description: 'API para o sistema ZapFlow',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./api/handlers/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rota de saúde
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configuração das rotas principais
app.use('/api/setup-new-user', setupNewUserHandler);
app.use('/api/conversations', conversationHandler);
app.use('/api/metrics', metricsHandler);
app.use('/api/triggers', runTriggerHandler);
app.use('/api/webhooks', webhookIdHandler);

// Rotas de campanhas
app.post('/api/analyze-sentiment', analyzeSentimentHandler);
app.post('/api/generate-reply', generateReplyHandler);
app.post('/api/enqueue-campaign-send', enqueueCampaignSendHandler);
app.post('/api/generate-template', generateTemplateHandler);
app.post('/api/process-campaign-message', processCampaignMessageHandler);
app.post('/api/test-webhook', testWebhookHandler);

// Rota de saúde da API (mantida para compatibilidade)
app.get('/api/health', healthCheckHandler);

// Rota legada de membros (será descontinuada em versões futuras)
// TODO: Migrar para as novas rotas de equipe (/api/teams/:teamId/members)
app.all('/api/members', (req: Request, res: Response, next: NextFunction) => {
  console.warn('A rota /api/members está obsoleta e será removida em versões futuras. Use as rotas de equipe (/api/teams/:teamId/members) em vez disso.');
  next();
}, membersHandler);

// Configuração das rotas de equipe (nova implementação)
setupTeamRoutes(app);

// Middleware de tratamento de erros
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro',
  });
});

// Rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar o servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Documentação da API disponível em http://localhost:${PORT}/api-docs`);
    console.warn('AVISO: A rota /api/members está obsoleta e será removida em versões futuras. Migre para as rotas de equipe (/api/teams/:teamId/members)');
  });
}

export default app;