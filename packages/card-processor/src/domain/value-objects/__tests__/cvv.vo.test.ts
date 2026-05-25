import { describe, expect, it } from 'vitest';
import { CVV } from '../cvv.vo.js';
import { ValidationError } from '../../errors/validation.error.js';

describe('CVV', () => {
  it('accepts 3 digits', () => {
    const cvv = CVV.create('123');
    expect(cvv.value).toBe('123');
  });

  it('accepts 000', () => {
    expect(CVV.create('000').value).toBe('000');
  });

  it('rejects 2 digits', () => {
    expect(() => CVV.create('12')).toThrow(ValidationError);
  });

  it('rejects 4 digits', () => {
    expect(() => CVV.create('1234')).toThrow(ValidationError);
  });

  it('rejects non-digit', () => {
    expect(() => CVV.create('12a')).toThrow(ValidationError);
  });

  it('masks to ***', () => {
    expect(CVV.create('123').masked).toBe('***');
  });
});
