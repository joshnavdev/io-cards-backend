import { describe, expect, it } from 'vitest';
import { CardType } from '../card-type.vo.js';
import { ValidationError } from '../../errors/validation.error.js';

describe('CardType', () => {
  it('accepts VISA', () => {
    expect(CardType.create('VISA').value).toBe('VISA');
  });

  it('accepts lowercase and normalizes to uppercase', () => {
    expect(CardType.create('visa').value).toBe('VISA');
  });

  it('rejects MASTERCARD', () => {
    expect(() => CardType.create('MASTERCARD')).toThrow(ValidationError);
  });

  it('rejects empty string', () => {
    expect(() => CardType.create('')).toThrow(ValidationError);
  });

  it('rejects non-string', () => {
    expect(() => CardType.create(true as unknown as string)).toThrow(ValidationError);
  });
});
