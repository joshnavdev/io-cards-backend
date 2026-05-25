import { describe, expect, it } from 'vitest';
import { Currency } from '../currency.vo.js';
import { ValidationError } from '../../errors/validation.error.js';

describe('Currency', () => {
  it('accepts PEN', () => {
    expect(Currency.create('PEN').value).toBe('PEN');
  });

  it('accepts USD', () => {
    expect(Currency.create('USD').value).toBe('USD');
  });

  it('accepts lowercase and normalizes to uppercase', () => {
    expect(Currency.create('pen').value).toBe('PEN');
  });

  it('rejects unsupported currency', () => {
    expect(() => Currency.create('EUR')).toThrow(ValidationError);
  });

  it('rejects empty string', () => {
    expect(() => Currency.create('')).toThrow(ValidationError);
  });

  it('rejects non-string', () => {
    expect(() => Currency.create(123 as unknown as string)).toThrow(ValidationError);
  });
});
