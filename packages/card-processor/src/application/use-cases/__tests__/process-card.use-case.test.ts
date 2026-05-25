import { type CardRequestedPayload, TOPICS } from '@io/shared';
import { describe, expect, it } from 'vitest';
import { ProcessCardUseCase } from '../process-card.use-case.js';
import { CardDataGenerator } from '../../../domain/services/card-data-generator.js';
import { ExternalServiceError } from '../../../domain/errors/external-service.error.js';
import {
  MockEventPublisher,
  NoopLogger,
  ScriptedExternalService,
  SequentialIdGenerator,
} from '../../../__tests__/mocks.js';

const noWait = (): Promise<void> => Promise.resolve();

const samplePayload: CardRequestedPayload = {
  requestId: 'req-1',
  customer: {
    documentType: 'DNI',
    documentNumber: '12345678',
    fullName: 'Juan Perez',
    age: 25,
    email: 'juan@example.com',
  },
  product: { type: 'VISA', currency: 'PEN' },
  forceError: false,
  requestedAt: new Date().toISOString(),
};

function buildSut(externalService: ScriptedExternalService) {
  const publisher = new MockEventPublisher();
  const idGenerator = new SequentialIdGenerator('event');
  const logger = new NoopLogger();
  const cardDataGenerator = new CardDataGenerator();
  const useCase = new ProcessCardUseCase({
    externalService,
    cardDataGenerator,
    publisher,
    idGenerator,
    logger,
    delay: noWait,
  });
  return { useCase, publisher };
}

describe('ProcessCardUseCase', () => {
  it('publishes io.cards.issued.v1 on first-attempt success', async () => {
    const ext = new ScriptedExternalService(['ok']);
    const { useCase, publisher } = buildSut(ext);
    await useCase.execute(samplePayload);
    expect(publisher.published).toHaveLength(1);
    const [first] = publisher.published;
    expect(first?.topic).toBe(TOPICS.CARDS_ISSUED);
    expect(first?.event.type).toBe('io.cards.issued.v1');
    expect(first?.event.source).toBe('req-1');
  });

  it('publishes io.cards.issued.v1 after one retry succeeds', async () => {
    const ext = new ScriptedExternalService([new ExternalServiceError('boom'), 'ok']);
    const { useCase, publisher } = buildSut(ext);
    await useCase.execute(samplePayload);
    expect(ext.callCount).toBe(2);
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0]?.topic).toBe(TOPICS.CARDS_ISSUED);
  });

  it('publishes to DLQ after 3 failures', async () => {
    const ext = new ScriptedExternalService([
      new ExternalServiceError('e1'),
      new ExternalServiceError('e2'),
      new ExternalServiceError('e3'),
    ]);
    const { useCase, publisher } = buildSut(ext);
    await useCase.execute(samplePayload);
    expect(ext.callCount).toBe(3);
    expect(publisher.published).toHaveLength(1);
    const [dlq] = publisher.published;
    expect(dlq?.topic).toBe(TOPICS.CARD_REQUESTED_DLQ);
    expect(dlq?.event.type).toBe('io.card.requested.failed.v1');
    const data = dlq?.event.data as {
      attempts: number;
      errorHistory: { errorMessage: string }[];
      originalEvent: { requestId: string };
    };
    expect(data.attempts).toBe(3);
    expect(data.errorHistory).toHaveLength(3);
    expect(data.errorHistory.map((h) => h.errorMessage)).toEqual(['e1', 'e2', 'e3']);
    expect(data.originalEvent.requestId).toBe('req-1');
  });

  it('forceError causes DLQ', async () => {
    const ext = new ScriptedExternalService([
      new ExternalServiceError('forced'),
      new ExternalServiceError('forced'),
      new ExternalServiceError('forced'),
    ]);
    const { useCase, publisher } = buildSut(ext);
    await useCase.execute({ ...samplePayload, forceError: true });
    expect(publisher.published[0]?.topic).toBe(TOPICS.CARD_REQUESTED_DLQ);
  });

  it('issued payload contains masked card data', async () => {
    const ext = new ScriptedExternalService(['ok']);
    const { useCase, publisher } = buildSut(ext);
    await useCase.execute(samplePayload);
    const event = publisher.published[0]?.event;
    const data = event?.data as { card: { maskedNumber: string; last4: string; expiry: string } };
    expect(data.card.maskedNumber).toMatch(/^\*{4} \*{4} \*{4} \d{4}$/);
    expect(data.card.last4).toMatch(/^\d{4}$/);
    expect(data.card.expiry).toMatch(/^\d{2}\/\d{2}$/);
  });
});
