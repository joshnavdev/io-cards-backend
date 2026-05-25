import {
  type CardRequestedPayload,
  type CloudEvent,
  TOPICS,
} from '@io/shared';
import { type Consumer, type Kafka } from 'kafkajs';
import { type Logger } from '../../domain/ports/logger.port.js';

export interface KafkaEventConsumerOptions {
  kafka: Kafka;
  groupId: string;
  logger: Logger;
  handler: (payload: CardRequestedPayload) => Promise<void>;
}

export class KafkaEventConsumer {
  private readonly consumer: Consumer;
  private readonly logger: Logger;
  private readonly handler: (payload: CardRequestedPayload) => Promise<void>;
  private connected = false;

  constructor(options: KafkaEventConsumerOptions) {
    this.consumer = options.kafka.consumer({ groupId: options.groupId });
    this.logger = options.logger;
    this.handler = options.handler;
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    this.connected = true;
    await this.consumer.subscribe({ topic: TOPICS.CARD_REQUESTED, fromBeginning: false });
    this.logger.info('Kafka consumer subscribed', { topic: TOPICS.CARD_REQUESTED });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value?.toString('utf-8');
        if (!value) {
          this.logger.warn('Received empty message', { topic, partition });
          return;
        }
        try {
          const event = JSON.parse(value) as CloudEvent<CardRequestedPayload>;
          await this.handler(event.data);
        } catch (error: unknown) {
          this.logger.error('Failed to process message', {
            topic,
            partition,
            offset: message.offset,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      },
    });
  }

  async stop(): Promise<void> {
    if (!this.connected) return;
    await this.consumer.disconnect();
    this.connected = false;
    this.logger.info('Kafka consumer disconnected');
  }
}
