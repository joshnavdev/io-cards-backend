import { type Kafka } from 'kafkajs';
import { Kafka as KafkaCtor } from 'kafkajs';
import { ProcessCardUseCase } from './application/use-cases/process-card.use-case.js';
import { CardDataGenerator } from './domain/services/card-data-generator.js';
import { ExternalServiceSimulator } from './domain/services/external-service-simulator.js';
import { type Config } from './infrastructure/config/env.config.js';
import { UuidIdGenerator } from './infrastructure/id/uuid-id-generator.js';
import { PinoLogger } from './infrastructure/logging/pino.logger.js';
import { KafkaEventConsumer } from './infrastructure/messaging/kafka-event.consumer.js';
import { KafkaEventPublisher } from './infrastructure/messaging/kafka-event.publisher.js';

export interface Container {
  kafka: Kafka;
  consumer: KafkaEventConsumer;
  publisher: KafkaEventPublisher;
  logger: PinoLogger;
}

export function buildContainer(config: Config): Container {
  const logger = new PinoLogger('card-processor', config.LOG_LEVEL);

  const kafka = new KafkaCtor({
    clientId: config.KAFKA_CLIENT_ID_PROCESSOR,
    brokers: config.KAFKA_BROKERS.split(',').map((b) => b.trim()),
  });

  const publisher = new KafkaEventPublisher(kafka, logger);
  const idGenerator = new UuidIdGenerator();
  const cardDataGenerator = new CardDataGenerator();
  const externalService = new ExternalServiceSimulator();

  const useCase = new ProcessCardUseCase({
    externalService,
    cardDataGenerator,
    publisher,
    idGenerator,
    logger,
  });

  const consumer = new KafkaEventConsumer({
    kafka,
    groupId: config.KAFKA_GROUP_ID,
    logger,
    handler: (payload) => useCase.execute(payload),
  });

  return { kafka, consumer, publisher, logger };
}
