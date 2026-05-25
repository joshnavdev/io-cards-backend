import {
  type CardRequestedPayload,
  type CloudEvent,
  EVENT_TYPES,
  TOPICS,
} from '@io/shared';
import { CardRequest } from '../../domain/entities/card-request.entity.js';
import { BusinessRuleError } from '../../domain/errors/business-rule.error.js';
import {
  type CardRequestRepository,
  type EventPublisher,
  type IdGenerator,
  type Logger,
} from '../../domain/ports/index.js';
import { Age } from '../../domain/value-objects/age.vo.js';
import { CardType } from '../../domain/value-objects/card-type.vo.js';
import { Currency } from '../../domain/value-objects/currency.vo.js';
import { DocumentNumber } from '../../domain/value-objects/document-number.vo.js';
import { Email } from '../../domain/value-objects/email.vo.js';

export interface IssueCardInput {
  customer: {
    documentType: 'DNI';
    documentNumber: string;
    fullName: string;
    age: number;
    email: string;
  };
  product: {
    type: 'VISA';
    currency: string;
  };
  forceError: boolean;
}

export interface IssueCardOutput {
  requestId: string;
  status: 'PENDING';
}

export class IssueCardUseCase {
  constructor(
    private readonly repository: CardRequestRepository,
    private readonly publisher: EventPublisher,
    private readonly idGenerator: IdGenerator,
    private readonly logger: Logger,
  ) {}

  async execute(input: IssueCardInput): Promise<IssueCardOutput> {
    const documentNumber = DocumentNumber.create(input.customer.documentNumber);
    const email = Email.create(input.customer.email);
    const age = Age.create(input.customer.age);
    const currency = Currency.create(input.product.currency);
    const cardType = CardType.create(input.product.type);

    const existing = await this.repository.findByDocumentNumber(documentNumber);
    if (existing && (existing.isPending() || existing.isIssued())) {
      this.logger.warn('Customer already has an active card request', {
        documentNumber: documentNumber.value,
        existingStatus: existing.status,
        existingRequestId: existing.requestId,
      });
      throw new BusinessRuleError(
        `Customer already has a card with status ${existing.status}`,
      );
    }

    const requestId = this.idGenerator.generate();
    const id = this.idGenerator.generate();

    const cardRequest = CardRequest.create({
      id,
      requestId,
      customer: {
        documentNumber,
        email,
        age,
        fullName: input.customer.fullName,
      },
      product: {
        type: cardType,
        currency,
      },
      forceError: input.forceError,
    });

    await this.repository.save(cardRequest);

    const eventId = this.idGenerator.generate();
    const event: CloudEvent<CardRequestedPayload> = {
      id: eventId,
      source: requestId,
      specversion: '1.0',
      type: EVENT_TYPES.CARD_REQUESTED,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        requestId,
        customer: {
          documentType: 'DNI',
          documentNumber: documentNumber.value,
          fullName: input.customer.fullName,
          age: age.value,
          email: email.value,
        },
        product: {
          type: cardType.value,
          currency: currency.value,
        },
        forceError: input.forceError,
        requestedAt: cardRequest.createdAt.toISOString(),
      },
    };

    await this.publisher.publish(TOPICS.CARD_REQUESTED, event);

    this.logger.info('Card requested event published', {
      requestId,
      eventId,
      topic: TOPICS.CARD_REQUESTED,
    });

    return { requestId, status: 'PENDING' };
  }
}
