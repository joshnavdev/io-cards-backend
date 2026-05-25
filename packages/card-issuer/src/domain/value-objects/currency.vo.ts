import { type CurrencyCode } from '@io/shared';
import { ValidationError } from '../errors/validation.error.js';

const ALLOWED: readonly CurrencyCode[] = ['PEN', 'USD'];

export class Currency {
  private constructor(public readonly value: CurrencyCode) {}

  static create(value: string): Currency {
    if (typeof value !== 'string') {
      throw new ValidationError('Currency must be a string');
    }
    const upper = value.toUpperCase();
    if (!ALLOWED.includes(upper as CurrencyCode)) {
      throw new ValidationError(`Currency must be one of: ${ALLOWED.join(', ')}`);
    }
    return new Currency(upper as CurrencyCode);
  }
}
