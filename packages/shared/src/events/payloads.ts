import { type Customer, type Product } from '../types/card.js';

export interface CardRequestedPayload {
  requestId: string;
  customer: Customer;
  product: Product;
  forceError: boolean;
  requestedAt: string;
}

export interface CardIssuedPayload {
  requestId: string;
  customer: Customer;
  product: Product;
  card: {
    maskedNumber: string;
    expiry: string;
    last4: string;
  };
  issuedAt: string;
}

export interface RetryAttempt {
  attempt: number;
  errorMessage: string;
  failedAt: string;
}

export interface CardRequestFailedPayload {
  requestId: string;
  originalEvent: CardRequestedPayload;
  attempts: number;
  errorHistory: RetryAttempt[];
  finalErrorMessage: string;
  failedAt: string;
}
