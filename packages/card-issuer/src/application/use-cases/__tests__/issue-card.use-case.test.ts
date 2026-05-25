import { TOPICS } from '@io/shared';
import { describe, expect, it } from 'vitest';
import { IssueCardUseCase, type IssueCardInput } from '../issue-card.use-case.js';
import { CardRequest } from '../../../domain/entities/card-request.entity.js';
import { BusinessRuleError } from '../../../domain/errors/business-rule.error.js';
import { ValidationError } from '../../../domain/errors/validation.error.js';
import { Age } from '../../../domain/value-objects/age.vo.js';
import { CardType } from '../../../domain/value-objects/card-type.vo.js';
import { Currency } from '../../../domain/value-objects/currency.vo.js';
import { DocumentNumber } from '../../../domain/value-objects/document-number.vo.js';
import { Email } from '../../../domain/value-objects/email.vo.js';
import {
  MockCardRequestRepository,
  MockEventPublisher,
  NoopLogger,
  SequentialIdGenerator,
} from '../../../__tests__/mocks.js';

const validInput: IssueCardInput = {
  customer: {
    documentType: 'DNI',
    documentNumber: '12345678',
    fullName: 'Juan Perez',
    age: 25,
    email: 'juan@example.com',
  },
  product: { type: 'VISA', currency: 'PEN' },
  forceError: false,
};

function buildSut() {
  const repository = new MockCardRequestRepository();
  const publisher = new MockEventPublisher();
  const idGenerator = new SequentialIdGenerator();
  const logger = new NoopLogger();
  const useCase = new IssueCardUseCase(repository, publisher, idGenerator, logger);
  return { useCase, repository, publisher, logger };
}

describe('IssueCardUseCase', () => {
  it('returns requestId and PENDING status on success', async () => {
    const { useCase } = buildSut();
    const out = await useCase.execute(validInput);
    expect(out.status).toBe('PENDING');
    expect(out.requestId).toBeTypeOf('string');
    expect(out.requestId.length).toBeGreaterThan(0);
  });

  it('saves the request to the repository', async () => {
    const { useCase, repository } = buildSut();
    await useCase.execute(validInput);
    expect(repository.saved).toHaveLength(1);
    const [saved] = repository.saved;
    expect(saved?.customer.documentNumber.value).toBe('12345678');
  });

  it('publishes a CloudEvent to io.card.requested.v1', async () => {
    const { useCase, publisher } = buildSut();
    const out = await useCase.execute(validInput);
    expect(publisher.published).toHaveLength(1);
    const [first] = publisher.published;
    expect(first?.topic).toBe(TOPICS.CARD_REQUESTED);
    expect(first?.event.specversion).toBe('1.0');
    expect(first?.event.type).toBe('io.card.requested.v1');
    expect(first?.event.source).toBe(out.requestId);
    expect(first?.event.datacontenttype).toBe('application/json');
  });

  it('event payload echoes input data', async () => {
    const { useCase, publisher } = buildSut();
    await useCase.execute(validInput);
    const event = publisher.published[0]?.event;
    const data = event?.data as { customer: { documentNumber: string }; forceError: boolean };
    expect(data.customer.documentNumber).toBe('12345678');
    expect(data.forceError).toBe(false);
  });

  it('rejects invalid DNI with ValidationError', async () => {
    const { useCase } = buildSut();
    await expect(
      useCase.execute({ ...validInput, customer: { ...validInput.customer, documentNumber: 'abc' } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects underage customer', async () => {
    const { useCase } = buildSut();
    await expect(
      useCase.execute({ ...validInput, customer: { ...validInput.customer, age: 17 } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  describe('one-card-per-customer rule', () => {
    it('proceeds when no previous request exists', async () => {
      const { useCase, repository } = buildSut();
      await useCase.execute(validInput);
      expect(repository.saved).toHaveLength(1);
    });

    it('rejects when previous request is PENDING', async () => {
      const { useCase, repository } = buildSut();
      const existing = CardRequest.create({
        id: 'existing-id',
        requestId: 'existing-req',
        customer: {
          documentNumber: DocumentNumber.create('12345678'),
          email: Email.create('old@example.com'),
          age: Age.create(30),
          fullName: 'Old User',
        },
        product: { type: CardType.create('VISA'), currency: Currency.create('USD') },
        forceError: false,
      });
      repository.preload(existing);

      await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(BusinessRuleError);
    });

    it('rejects when previous request is ISSUED', async () => {
      const { useCase, repository } = buildSut();
      const existing = CardRequest.create({
        id: 'existing-id',
        requestId: 'existing-req',
        customer: {
          documentNumber: DocumentNumber.create('12345678'),
          email: Email.create('old@example.com'),
          age: Age.create(30),
          fullName: 'Old User',
        },
        product: { type: CardType.create('VISA'), currency: Currency.create('USD') },
        forceError: false,
      });
      existing.markAsIssued();
      repository.preload(existing);

      await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(BusinessRuleError);
    });

    it('allows resubmission when previous is FAILED', async () => {
      const { useCase, repository } = buildSut();
      const existing = CardRequest.create({
        id: 'existing-id',
        requestId: 'existing-req',
        customer: {
          documentNumber: DocumentNumber.create('12345678'),
          email: Email.create('old@example.com'),
          age: Age.create(30),
          fullName: 'Old User',
        },
        product: { type: CardType.create('VISA'), currency: Currency.create('USD') },
        forceError: false,
      });
      existing.markAsFailed();
      repository.preload(existing);

      const out = await useCase.execute(validInput);
      expect(out.status).toBe('PENDING');
      expect(repository.saved).toHaveLength(1);
    });
  });
});
