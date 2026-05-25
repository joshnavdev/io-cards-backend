import { ValidationError } from '../errors/validation.error.js';

export class CVV {
  private constructor(public readonly value: string) {}

  static create(value: string): CVV {
    if (typeof value !== 'string') {
      throw new ValidationError('CVV must be a string');
    }
    if (!/^\d{3}$/.test(value)) {
      throw new ValidationError('CVV must be exactly 3 digits');
    }
    return new CVV(value);
  }

  readonly masked = '***';
}
