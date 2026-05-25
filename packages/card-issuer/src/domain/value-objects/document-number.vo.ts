import { ValidationError } from '../errors/validation.error.js';

const DNI_PATTERN = /^\d{8}$/;

export class DocumentNumber {
  private constructor(public readonly value: string) {}

  static create(value: string): DocumentNumber {
    if (typeof value !== 'string') {
      throw new ValidationError('DocumentNumber must be a string');
    }
    if (!DNI_PATTERN.test(value)) {
      throw new ValidationError('DocumentNumber (DNI) must be exactly 8 digits');
    }
    return new DocumentNumber(value);
  }

  equals(other: DocumentNumber): boolean {
    return this.value === other.value;
  }
}
