import { Kafka } from 'kafkajs';
import { IssueCardUseCase } from './application/use-cases/issue-card.use-case.js';
import { type Config } from './infrastructure/config/env.config.js';
import { CardController } from './infrastructure/http/controllers/card.controller.js';
import { UuidIdGenerator } from './infrastructure/id/uuid-id-generator.js';
import { PinoLogger } from './infrastructure/logging/pino.logger.js';
import { KafkaEventPublisher } from './infrastructure/messaging/kafka-event.publisher.js';
import { InMemoryCardRequestRepository } from './infrastructure/persistence/in-memory-card-request.repository.js';

export interface Container {
  controller: CardController;
  publisher: KafkaEventPublisher;
  logger: PinoLogger;
  config: Config;
}

export function buildContainer(config: Config): Container {
  const logger = new PinoLogger('card-issuer', config.LOG_LEVEL);

  const kafka = new Kafka({
    clientId: config.KAFKA_CLIENT_ID_ISSUER,
    brokers: config.KAFKA_BROKERS.split(',').map((b) => b.trim()),
  });

  const repository = new InMemoryCardRequestRepository();
  const publisher = new KafkaEventPublisher(kafka, logger);
  const idGenerator = new UuidIdGenerator();

  const useCase = new IssueCardUseCase(repository, publisher, idGenerator, logger);
  const controller = new CardController(useCase, logger);

  return { controller, publisher, logger, config };
}
