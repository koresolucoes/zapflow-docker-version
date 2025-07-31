import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { processCampaignMessageHandler } from '../handlers/processCampaignMessageHandler.js';
import redisQueue from '../_lib/redisQueue.js';

// Tipos para a requisição e resposta simuladas
interface SimulatedRequest {
  method: string;
  body: any;
  headers: Record<string, string>;
}

interface SimulatedResponse {
  status: (code: number) => {
    json: (data: any) => void;
  };
}

// Função para processar uma única mensagem
async function processMessage(message: any) {
  try {
    console.log(`Processing message ${message.messageId}`);
    
    // Cria um objeto de requisição simulado para o processamento
    const req: SimulatedRequest = {
      method: 'POST',
      body: message,
      headers: {}
    };
    
    const res: SimulatedResponse = {
      status: (code: number) => ({
        json: (data: any) => {
          console.log(`Processed message ${message.messageId} with status ${code}`, data);
          return { code, data };
        }
      })
    };

    // Processa a mensagem
    await processCampaignMessageHandler(req as any, res as any);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error processing message ${message.messageId}:`, errorMessage);
    
    // Atualiza o status da mensagem para falha
    await supabaseAdmin
      .from('messages')
      .update({ status: 'failed', error: errorMessage })
      .eq('id', message.messageId);
  }
}

// Função principal do worker
export async function startWorker() {
  console.log('Starting campaign worker...');
  
  // Conecta ao Redis
  await redisQueue.connect();
  
  // Loop principal do worker
  while (true) {
    try {
      // Tenta obter uma mensagem da fila
      const message = await redisQueue.dequeue();
      
      if (message) {
        console.log(`Processing message ${message.messageId}`);
        await processMessage(message);
      } else {
        // Se não houver mensagens, aguarda um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error in worker loop:', error);
      // Em caso de erro, aguarda um pouco antes de continuar
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Inicia o worker se este arquivo for executado diretamente
// Verificação de execução direta sem usar require
const isMainModule = process.argv[1] === __filename;
if (isMainModule) {
  startWorker().catch(console.error);
}
