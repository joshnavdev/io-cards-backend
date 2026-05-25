import { ValidationError } from '../errors/validation.error.js';

const MIN_AGE = 18;
const MAX_AGE = 120;

export class Age {
  private constructor(public readonly value: number) {}

  static create(value: number): Age {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new ValidationError('Age must be a finite number');
    }
    if (!Number.isInteger(value)) {
      throw new ValidationError('Age must be an integer');
    }
    if (value < MIN_AGE) {
      throw new ValidationError(`Age must be at least ${String(MIN_AGE)}`);
    }
    if (value > MAX_AGE) {
      throw new ValidationError(`Age must be at most ${String(MAX_AGE)}`);
    }
    return new Age(value);
  }
}
