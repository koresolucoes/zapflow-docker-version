import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { conversationHandler } from './handlers/conversationHandler.js';
import { analyzeSentimentHandler } from './handlers/analyzeSentimentHandler.js';
import { generateReplyHandler } from './handlers/generateReplyHandler.js';
import { enqueueCampaignSendHandler } from './handlers/enqueueCampaignSendHandler.js';
import { generateTemplateHandler } from './handlers/generateTemplateHandler.js';
import { membersHandler } from './handlers/membersHandler.js';
import { processCampaignMessageHandler } from './handlers/processCampaignMessageHandler.js';
import { runTriggerHandler } from './handlers/runTriggerHandler.js';
import { setupNewUserHandler } from './handlers/setupNewUserHandler.js';
import { webhookIdHandler } from './handlers/webhookIdHandler.js';
import { triggerIdHandler } from './handlers/triggerIdHandler.js';
import { testWebhookHandler } from './handlers/testWebhookHandler.js';
import { healthCheckHandler } from './handlers/healthCheckHandler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configuração do CORS para permitir credenciais e cabeçalhos necessários
app.use(cors({
  origin: true, // Permite qualquer origem (em produção, defina a origem correta)
  credentials: true, // Permite o envio de credenciais (cookies, headers de autenticação)
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // Métodos HTTP permitidos
}));

app.use(express.json());

// Middleware para log de requisições (apenas para debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

app.all('/api/conversation', conversationHandler);
app.post('/api/analyze-sentiment', analyzeSentimentHandler);
app.post('/api/generate-reply', generateReplyHandler);
app.post('/api/enqueue-campaign-send', enqueueCampaignSendHandler);
app.post('/api/generate-template', generateTemplateHandler);
app.all('/api/members', membersHandler);
app.post('/api/process-campaign-message', processCampaignMessageHandler);
app.post('/api/run-trigger', runTriggerHandler);
app.post('/api/setup-new-user', setupNewUserHandler);
app.all('/api/webhook/:id', webhookIdHandler);
app.all('/api/trigger/:id', triggerIdHandler);
app.post('/api/test-webhook', testWebhookHandler);
app.get('/api/health', healthCheckHandler);

app.get('/health', (req, res) => res.send('OK'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});