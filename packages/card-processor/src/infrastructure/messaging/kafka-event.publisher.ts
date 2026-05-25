import { type CloudEvent } from '@io/shared';
import { type Kafka, type Producer } from 'kafkajs';
import { type EventPublisher } from '../../domain/ports/event-publisher.port.js';
import { type Logger } from '../../domain/ports/logger.port.js';

export class KafkaEventPublisher implements EventPublisher {
  private readonly producer: Producer;
  private connected = false;

  constructor(
    kafka: Kafka,
    private readonly logger: Logger,
  ) {
    this.producer = kafka.producer({ allowAutoTopicCreation: true });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.producer.connect();
    this.connected = true;
    this.logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await this.producer.disconnect();
    this.connected = false;
    this.logger.info('Kafka producer disconnected');
  }

  async publish<T>(topic: string, event: CloudEvent<T>): Promise<void> {
    if (!this.connected) {
      throw new Error('KafkaEventPublisher is not connected');
    }
    await this.producer.send({
      topic,
      messages: [
        {
          key: event.source,
          value: JSON.stringify(event),
          headers: {
            'ce-id': event.id,
            'ce-source': event.source,
            'ce-specversion': event.specversion,
            'ce-type': event.type,
            'ce-time': event.time,
            'content-type': event.datacontenttype,
          },
        },
      ],
    });
    this.logger.debug('Event published', {
      topic,
      eventId: event.id,
      eventType: event.type,
      source: event.source,
    });
  }
}
