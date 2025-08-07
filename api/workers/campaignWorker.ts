import { Worker, Job } from 'bullmq';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { processCampaignMessageHandler } from '../handlers/processCampaignMessageHandler.js';

// Connection details for Redis, consistent with the queue
const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT) || 6379,
};

/**
 * The processor function that will be called for each job in the queue.
 * It simulates a request and response object to be compatible with the existing handler.
 */
const processJob = async (job: Job) => {
  const { messageId } = job.data;
  console.log(`[Worker] Processing job ${job.id} for message ${messageId}`);

  // Simulate the request object that processCampaignMessageHandler expects
  const req = {
    method: 'POST',
    body: job.data,
    headers: {},
  };

  // Simulate the response object
  const res = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`[Worker] Handler for message ${messageId} finished with status ${code}.`, data);
      },
    }),
  };

  try {
    // Execute the actual message processing logic
    await processCampaignMessageHandler(req as any, res as any);
  } catch (error: any) {
    console.error(`[Worker] Error processing message ${messageId} (Job ID: ${job.id}):`, error);
    
    // If an error occurs, update the message status in the database to 'failed'
    await supabaseAdmin
      .from('messages')
      .update({ status: 'failed', error: error.message })
      .eq('id', messageId);

    // Re-throw the error to let BullMQ know the job has failed
    throw error;
  }
};

// --- Worker Setup ---
// Create a new BullMQ Worker to process jobs from the 'campaign-messages' queue.
const campaignWorker = new Worker('campaign-messages', processJob, {
  connection,
  concurrency: 5, // Process up to 5 jobs concurrently
  limiter: {      // Limit to 100 jobs every 10 seconds to avoid overwhelming external APIs
    max: 100,
    duration: 10000,
  },
});

// --- Event Listeners for Logging and Monitoring ---
campaignWorker.on('completed', (job: Job) => {
  console.log(`[Worker] Completed job ${job.id} for message ${job.data.messageId}`);
});

campaignWorker.on('failed', (job: Job | undefined, error: Error) => {
  if (job) {
    console.error(`[Worker] Failed job ${job.id} for message ${job.data.messageId}. Error: ${error.message}`);
  } else {
    console.error(`[Worker] An unspecified job failed. Error: ${error.message}`);
  }
});

console.log('Campaign worker has been initialized.');

// Export the worker instance if it needs to be managed elsewhere
export { campaignWorker };
