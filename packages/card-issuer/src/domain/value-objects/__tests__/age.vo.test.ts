import { describe, expect, it } from 'vitest';
import { Age } from '../age.vo.js';
import { ValidationError } from '../../errors/validation.error.js';

describe('Age', () => {
  it('accepts age 18', () => {
    expect(Age.create(18).value).toBe(18);
  });

  it('accepts age 120', () => {
    expect(Age.create(120).value).toBe(120);
  });

  it('rejects age 17', () => {
    expect(() => Age.create(17)).toThrow(ValidationError);
  });

  it('rejects age 121', () => {
    expect(() => Age.create(121)).toThrow(ValidationError);
  });

  it('rejects negative age', () => {
    expect(() => Age.create(-1)).toThrow(ValidationError);
  });

  it('rejects non-integer age', () => {
    expect(() => Age.create(18.5)).toThrow(ValidationError);
  });

  it('rejects NaN', () => {
    expect(() => Age.create(NaN)).toThrow(ValidationError);
  });

  it('rejects Infinity', () => {
    expect(() => Age.create(Infinity)).toThrow(ValidationError);
  });

  it('rejects non-number value', () => {
    expect(() => Age.create('18' as unknown as number)).toThrow(ValidationError);
  });
});
