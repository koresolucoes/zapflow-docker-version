import { Queue } from 'bullmq';

export const campaignQueue = new Queue('campaign-messages', {
  connection: {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});