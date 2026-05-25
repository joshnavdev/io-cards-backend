import {
  type CardIssuedPayload,
  type CardRequestFailedPayload,
  type CardRequestedPayload,
  type CloudEvent,
  EVENT_TYPES,
  TOPICS,
} from '@io/shared';
import { type CardDataGenerator } from '../../domain/services/card-data-generator.js';
import { MaxRetriesExceededError } from '../../domain/errors/max-retries-exceeded.error.js';
import {
  type EventPublisher,
  type ExternalCardService,
  type IdGenerator,
  type Logger,
} from '../../domain/ports/index.js';
import {
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
  retryWithBackoff,
} from '../../infrastructure/retry/retry-with-backoff.js';

export interface ProcessCardUseCaseDeps {
  externalService: ExternalCardService;
  cardDataGenerator: CardDataGenerator;
  publisher: EventPublisher;
  idGenerator: IdGenerator;
  logger: Logger;
  retryConfig?: RetryConfig;
  delay?: (ms: number) => Promise<void>;
}

export class ProcessCardUseCase {
  private readonly retryConfig: RetryConfig;
  private readonly delay: ((ms: number) => Promise<void>) | undefined;

  constructor(private readonly deps: ProcessCardUseCaseDeps) {
    this.retryConfig = deps.retryConfig ?? DEFAULT_RETRY_CONFIG;
    this.delay = deps.delay;
  }

  async execute(payload: CardRequestedPayload): Promise<void> {
    const log = this.deps.logger.child({ requestId: payload.requestId });
    log.info('Processing card request', {
      documentNumber: payload.customer.documentNumber,
      forceError: payload.forceError,
    });

    try {
      const result = await retryWithBackoff(
        async () =>
          this.deps.externalService.process({
            requestId: payload.requestId,
            forceError: payload.forceError,
          }),
        this.retryConfig,
        this.delay ? { delay: this.delay } : {},
      );

      const card = this.deps.cardDataGenerator.generate();

      const issuedEvent: CloudEvent<CardIssuedPayload> = {
        id: this.deps.idGenerator.generate(),
        source: payload.requestId,
        specversion: '1.0',
        type: EVENT_TYPES.CARDS_ISSUED,
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        data: {
          requestId: payload.requestId,
          customer: payload.customer,
          product: payload.product,
          card: {
            maskedNumber: card.number.masked,
            expiry: card.expiryFormatted,
            last4: card.number.last4,
          },
          issuedAt: new Date().toISOString(),
        },
      };

      await this.deps.publisher.publish(TOPICS.CARDS_ISSUED, issuedEvent);
      log.info('Card issued successfully', {
        attempts: result.attempts,
        cardLast4: card.number.last4,
      });
    } catch (error: unknown) {
      if (error instanceof MaxRetriesExceededError) {
        log.warn('All retries failed, publishing to DLQ', {
          attempts: error.attempts,
        });
        await this.publishToDlq(payload, error);
        return;
      }
      log.error('Unexpected processing error', {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async publishToDlq(
    payload: CardRequestedPayload,
    error: MaxRetriesExceededError,
  ): Promise<void> {
    const failedEvent: CloudEvent<CardRequestFailedPayload> = {
      id: this.deps.idGenerator.generate(),
      source: payload.requestId,
      specversion: '1.0',
      type: EVENT_TYPES.CARD_REQUEST_FAILED,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        requestId: payload.requestId,
        originalEvent: payload,
        attempts: error.attempts,
        errorHistory: error.history.map((h) => ({
          attempt: h.attempt,
          errorMessage: h.message,
          failedAt: h.failedAt,
        })),
        finalErrorMessage: error.message,
        failedAt: new Date().toISOString(),
      },
    };
    await this.deps.publisher.publish(TOPICS.CARD_REQUESTED_DLQ, failedEvent);
  }
}
