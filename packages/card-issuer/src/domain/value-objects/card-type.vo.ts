import { type CardProductType } from '@io/shared';
import { ValidationError } from '../errors/validation.error.js';

const ALLOWED: readonly CardProductType[] = ['VISA'];

export class CardType {
  private constructor(public readonly value: CardProductType) {}

  static create(value: string): CardType {
    if (typeof value !== 'string') {
      throw new ValidationError('CardType must be a string');
    }
    const upper = value.toUpperCase();
    if (!ALLOWED.includes(upper as CardProductType)) {
      throw new ValidationError(`CardType must be one of: ${ALLOWED.join(', ')}`);
    }
    return new CardType(upper as CardProductType);
  }
}
