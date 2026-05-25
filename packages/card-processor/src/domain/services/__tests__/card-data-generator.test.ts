import { describe, expect, it } from 'vitest';
import { CardDataGenerator } from '../card-data-generator.js';
import { isLuhnValid } from '../../value-objects/card-number.vo.js';

describe('CardDataGenerator', () => {
  it('generates a Luhn-valid 16-digit VISA number', () => {
    const generator = new CardDataGenerator();
    for (let i = 0; i < 50; i += 1) {
      const card = generator.generate();
      expect(card.number.value.length).toBe(16);
      expect(card.number.value.startsWith('4')).toBe(true);
      expect(isLuhnValid(card.number.value)).toBe(true);
    }
  });

  it('generates a 3-digit CVV', () => {
    const generator = new CardDataGenerator();
    for (let i = 0; i < 20; i += 1) {
      const card = generator.generate();
      expect(card.cvv.value).toMatch(/^\d{3}$/);
    }
  });

  it('sets expiry to current month + 5 years', () => {
    const fixedNow = new Date('2026-05-15T00:00:00Z');
    const generator = new CardDataGenerator({ now: () => fixedNow });
    const card = generator.generate();
    expect(card.expiryYear).toBe(2031);
    expect(card.expiryMonth).toBe(5);
    expect(card.expiryFormatted).toBe('05/31');
  });

  it('uses provided random function', () => {
    let counter = 0;
    const generator = new CardDataGenerator({
      randomIntFn: () => {
        counter += 1;
        return counter % 10;
      },
    });
    const card = generator.generate();
    expect(isLuhnValid(card.number.value)).toBe(true);
  });
});
