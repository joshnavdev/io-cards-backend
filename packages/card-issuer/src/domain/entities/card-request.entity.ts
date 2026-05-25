import { type CardStatus } from '@io/shared';
import { type DocumentNumber } from '../value-objects/document-number.vo.js';
import { type Email } from '../value-objects/email.vo.js';
import { type Age } from '../value-objects/age.vo.js';
import { type Currency } from '../value-objects/currency.vo.js';
import { type CardType } from '../value-objects/card-type.vo.js';
import { BusinessRuleError } from '../errors/business-rule.error.js';

export interface CardRequestCustomer {
  documentNumber: DocumentNumber;
  email: Email;
  age: Age;
  fullName: string;
}

export interface CardRequestProduct {
  type: CardType;
  currency: Currency;
}

export interface CardRequestProps {
  id: string;
  requestId: string;
  customer: CardRequestCustomer;
  product: CardRequestProduct;
  status: CardStatus;
  forceError: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CardRequest {
  private constructor(private readonly props: CardRequestProps) {}

  static create(input: {
    id: string;
    requestId: string;
    customer: CardRequestCustomer;
    product: CardRequestProduct;
    forceError: boolean;
    now?: Date;
  }): CardRequest {
    const now = input.now ?? new Date();
    return new CardRequest({
      id: input.id,
      requestId: input.requestId,
      customer: input.customer,
      product: input.product,
      status: 'PENDING',
      forceError: input.forceError,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: CardRequestProps): CardRequest {
    return new CardRequest({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get requestId(): string {
    return this.props.requestId;
  }

  get status(): CardStatus {
    return this.props.status;
  }

  get customer(): CardRequestCustomer {
    return this.props.customer;
  }

  get product(): CardRequestProduct {
    return this.props.product;
  }

  get forceError(): boolean {
    return this.props.forceError;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  isIssued(): boolean {
    return this.props.status === 'ISSUED';
  }

  isFailed(): boolean {
    return this.props.status === 'FAILED';
  }

  markAsIssued(now: Date = new Date()): void {
    if (this.props.status !== 'PENDING') {
      throw new BusinessRuleError(
        `Cannot mark as ISSUED: current status is ${this.props.status}`,
      );
    }
    this.props.status = 'ISSUED';
    this.props.updatedAt = now;
  }

  markAsFailed(now: Date = new Date()): void {
    if (this.props.status !== 'PENDING') {
      throw new BusinessRuleError(
        `Cannot mark as FAILED: current status is ${this.props.status}`,
      );
    }
    this.props.status = 'FAILED';
    this.props.updatedAt = now;
  }

  toSnapshot(): Readonly<CardRequestProps> {
    return { ...this.props };
  }
}
