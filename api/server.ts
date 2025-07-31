import express from 'express';
import * as cors from 'cors';
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

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.get('/health', (req, res) => res.send('OK'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});