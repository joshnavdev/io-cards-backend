import { ValidationError } from '../errors/validation.error.js';

export function isLuhnValid(cardNumber: string): boolean {
  if (!/^\d+$/.test(cardNumber)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = cardNumber.length - 1; i >= 0; i -= 1) {
    let digit = Number(cardNumber.charAt(i));
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function computeLuhnCheckDigit(numberWithoutCheck: string): number {
  if (!/^\d+$/.test(numberWithoutCheck)) {
    throw new Error('numberWithoutCheck must contain only digits');
  }
  let sum = 0;
  let alternate = true;
  for (let i = numberWithoutCheck.length - 1; i >= 0; i -= 1) {
    let digit = Number(numberWithoutCheck.charAt(i));
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return (10 - (sum % 10)) % 10;
}

export class CardNumber {
  private constructor(public readonly value: string) {}

  static create(value: string): CardNumber {
    if (typeof value !== 'string') {
      throw new ValidationError('CardNumber must be a string');
    }
    if (!/^\d{13,19}$/.test(value)) {
      throw new ValidationError('CardNumber must be 13 to 19 digits');
    }
    if (!isLuhnValid(value)) {
      throw new ValidationError('CardNumber failed Luhn check');
    }
    return new CardNumber(value);
  }

  get masked(): string {
    const last4 = this.value.slice(-4);
    return `**** **** **** ${last4}`;
  }

  get last4(): string {
    return this.value.slice(-4);
  }
}
