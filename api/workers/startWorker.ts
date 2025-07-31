import dotenv from 'dotenv';
import { startWorker } from './campaignWorker.js';

// Carrega as variáveis de ambiente
dotenv.config();

// Inicia o worker
startWorker().catch(error => {
  console.error('Worker failed to start:', error);
  process.exit(1);
});
