import { createClient } from 'redis';
import { promisify } from 'util';

// Tipos para as mensagens da fila
export interface CampaignMessage {
  messageId: string;
  userId: string;
  variables: Record<string, any>;
  delay?: number; // Atraso em segundos
}

class RedisQueue {
  private client: ReturnType<typeof createClient>;
  private queueName: string;
  private delayQueueName: string;
  private isConnected: boolean = false;

  constructor(queueName: string = 'campaign_messages') {
    this.queueName = queueName;
    this.delayQueueName = `${queueName}:delayed`;
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          // Reconectar após 1 segundo
          return 1000;
        }
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
    });
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
    return this;
  }

  async enqueue(message: CampaignMessage) {
    const { delay, ...msgData } = message;
    const msgString = JSON.stringify(msgData);
    
    if (delay && delay > 0) {
      // Para mensagens com atraso, usamos uma lista ordenada
      const score = Math.floor(Date.now() / 1000) + delay;
      await this.client.zAdd(this.delayQueueName, [
        { score, value: msgString }
      ]);
    } else {
      // Para mensagens sem atraso, usamos uma lista simples
      await this.client.rPush(this.queueName, msgString);
    }
  }

  async dequeue(): Promise<CampaignMessage | null> {
    // Primeiro verifica se há mensagens atrasadas prontas para processamento
    const now = Math.floor(Date.now() / 1000);
    const delayedMessages = await this.client.zRangeByScore(
      this.delayQueueName,
      0,
      now
    );

    if (delayedMessages.length > 0) {
      // Move a mensagem mais antiga para a fila principal
      const [message] = delayedMessages;
      await this.client.multi()
        .zRemRangeByRank(this.delayQueueName, 0, 0) // Remove a mensagem da fila de atraso
        .rPush(this.queueName, message) // Adiciona à fila principal
        .exec();
    }

    // Pega a próxima mensagem da fila principal
    const message = await this.client.lPop(this.queueName);
    return message ? JSON.parse(message) : null;
  }

  async getQueueLength() {
    return this.client.lLen(this.queueName);
  }

  async getDelayedCount() {
    return this.client.zCard(this.delayQueueName);
  }

  async close() {
    await this.client.quit();
    this.isConnected = false;
  }
}

// Exporta uma instância singleton
const redisQueue = new RedisQueue();

export default redisQueue;
