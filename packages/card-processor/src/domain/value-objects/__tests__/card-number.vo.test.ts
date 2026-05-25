import { describe, expect, it } from 'vitest';
import { CardNumber, isLuhnValid, computeLuhnCheckDigit } from '../card-number.vo.js';
import { ValidationError } from '../../errors/validation.error.js';

describe('isLuhnValid', () => {
  it('returns true for valid numbers', () => {
    expect(isLuhnValid('4532015112830366')).toBe(true);
    expect(isLuhnValid('4111111111111111')).toBe(true);
  });

  it('returns false for invalid numbers', () => {
    expect(isLuhnValid('4111111111111112')).toBe(false);
    expect(isLuhnValid('1234567890123456')).toBe(false);
  });

  it('returns false for non-numeric strings', () => {
    expect(isLuhnValid('abcd')).toBe(false);
  });
});

describe('computeLuhnCheckDigit', () => {
  it('produces a digit that makes the number Luhn-valid', () => {
    const partial = '411111111111111';
    const check = computeLuhnCheckDigit(partial);
    expect(isLuhnValid(`${partial}${String(check)}`)).toBe(true);
  });

  it('throws on non-numeric input', () => {
    expect(() => computeLuhnCheckDigit('abc')).toThrow();
  });
});

describe('CardNumber', () => {
  it('accepts a valid Luhn number', () => {
    const cn = CardNumber.create('4532015112830366');
    expect(cn.value).toBe('4532015112830366');
  });

  it('rejects too short', () => {
    expect(() => CardNumber.create('411111111111')).toThrow(ValidationError);
  });

  it('rejects too long', () => {
    expect(() => CardNumber.create('41111111111111111111')).toThrow(ValidationError);
  });

  it('rejects non-digit', () => {
    expect(() => CardNumber.create('411111111111111A')).toThrow(ValidationError);
  });

  it('rejects Luhn invalid', () => {
    expect(() => CardNumber.create('4111111111111112')).toThrow(ValidationError);
  });

  it('masks correctly', () => {
    const cn = CardNumber.create('4111111111111111');
    expect(cn.masked).toBe('**** **** **** 1111');
    expect(cn.last4).toBe('1111');
  });
});
