import { Worker } from 'bullmq';
import { supabaseAdmin } from '../../api/_lib/supabaseAdmin.js';
// Importe a lógica de envio de mensagem (ex: processCampaignMessageHandler)

const worker = new Worker('campaign-messages', async job => {
  const { messageId, userId, variables } = job.data;
  // Aqui, chame a lógica de envio de mensagem (ex: processCampaignMessageHandler)
  // await processCampaignMessageHandler({ messageId, userId, variables });
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