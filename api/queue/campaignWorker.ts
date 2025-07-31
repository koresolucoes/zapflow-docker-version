import { Worker } from 'bullmq';
import { executeCampaignMessage } from '../_lib/campaigns/messageProcessor.js';

const worker = new Worker('campaign-messages', async job => {
  const { messageId, userId, variables } = job.data;
    await executeCampaignMessage({ messageId, userId, variables });
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

worker.on('completed', job => {
  console.log(`Mensagem ${job.id} enviada com sucesso!`);
});
worker.on('failed', (job, err) => {
  console.error(`Falha ao enviar mensagem ${job?.id}:`, err);
});
