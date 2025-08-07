import dotenv from 'dotenv';
import { campaignWorker } from './campaignWorker.js';

// Load environment variables from .env file
dotenv.config();

console.log('Initializing campaign worker process...');

// The BullMQ worker is instantiated in campaignWorker.ts, so simply importing it
// is enough to start it. The following listeners provide diagnostics.

campaignWorker.on('ready', () => {
  console.log('Campaign worker is connected to Redis and ready to process jobs.');
});

campaignWorker.on('error', (error) => {
  console.error('Campaign worker encountered a critical error:', error);
});

console.log('Campaign worker process is running. Waiting for jobs...');

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down campaign worker...');
  await campaignWorker.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
