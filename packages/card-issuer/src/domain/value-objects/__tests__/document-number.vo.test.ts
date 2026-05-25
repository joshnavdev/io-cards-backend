import { describe, expect, it } from 'vitest';
import { DocumentNumber } from '../document-number.vo.js';
import { ValidationError } from '../../errors/validation.error.js';

describe('DocumentNumber', () => {
  describe('create', () => {
    it('accepts valid 8-digit DNI', () => {
      const dni = DocumentNumber.create('12345678');
      expect(dni.value).toBe('12345678');
    });

    it('rejects DNI with less than 8 digits', () => {
      expect(() => DocumentNumber.create('1234567')).toThrow(ValidationError);
    });

    it('rejects DNI with more than 8 digits', () => {
      expect(() => DocumentNumber.create('123456789')).toThrow(ValidationError);
    });

    it('rejects DNI with non-digit characters', () => {
      expect(() => DocumentNumber.create('1234567A')).toThrow(ValidationError);
    });

    it('rejects empty string', () => {
      expect(() => DocumentNumber.create('')).toThrow(ValidationError);
    });

    it('rejects non-string value', () => {
      expect(() => DocumentNumber.create(12345678 as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('equals', () => {
    it('returns true for same value', () => {
      const a = DocumentNumber.create('12345678');
      const b = DocumentNumber.create('12345678');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different values', () => {
      const a = DocumentNumber.create('12345678');
      const b = DocumentNumber.create('87654321');
      expect(a.equals(b)).toBe(false);
    });
  });
});
