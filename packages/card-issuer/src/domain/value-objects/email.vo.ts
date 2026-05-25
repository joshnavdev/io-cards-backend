import { ValidationError } from '../errors/validation.error.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = 254;

export class Email {
  private constructor(public readonly value: string) {}

  static create(value: string): Email {
    if (typeof value !== 'string') {
      throw new ValidationError('Email must be a string');
    }
    const normalized = value.trim().toLowerCase();
    if (normalized.length === 0) {
      throw new ValidationError('Email cannot be empty');
    }
    if (normalized.length > MAX_LENGTH) {
      throw new ValidationError(`Email must be at most ${String(MAX_LENGTH)} characters`);
    }
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new ValidationError('Email format is invalid');
    }
    return new Email(normalized);
  }
}
