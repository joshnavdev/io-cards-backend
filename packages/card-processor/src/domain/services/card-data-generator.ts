import { randomInt } from 'node:crypto';
import { CardDetails } from '../entities/card-details.entity.js';
import { CardNumber, computeLuhnCheckDigit } from '../value-objects/card-number.vo.js';
import { CVV } from '../value-objects/cvv.vo.js';

const VISA_PREFIX = '4';
const TOTAL_LENGTH = 16;
const RANDOM_DIGITS = TOTAL_LENGTH - VISA_PREFIX.length - 1;

export interface CardDataGeneratorOptions {
  randomIntFn?: (min: number, max: number) => number;
  now?: () => Date;
}

export class CardDataGenerator {
  private readonly randomInt: (min: number, max: number) => number;
  private readonly now: () => Date;

  constructor(options: CardDataGeneratorOptions = {}) {
    this.randomInt = options.randomIntFn ?? ((min, max) => randomInt(min, max));
    this.now = options.now ?? (() => new Date());
  }

  generate(): CardDetails {
    const middle = this.generateRandomDigits(RANDOM_DIGITS);
    const numberWithoutCheck = `${VISA_PREFIX}${middle}`;
    const checkDigit = computeLuhnCheckDigit(numberWithoutCheck);
    const fullNumber = `${numberWithoutCheck}${String(checkDigit)}`;

    const cardNumber = CardNumber.create(fullNumber);
    const cvvValue = String(this.randomInt(0, 1000)).padStart(3, '0');
    const cvv = CVV.create(cvvValue);

    const today = this.now();
    const expiryYear = today.getFullYear() + 5;
    const expiryMonth = today.getMonth() + 1;

    return CardDetails.create({
      number: cardNumber,
      cvv,
      expiryMonth,
      expiryYear,
      brand: 'VISA',
    });
  }

  private generateRandomDigits(count: number): string {
    let result = '';
    for (let i = 0; i < count; i += 1) {
      result += String(this.randomInt(0, 10));
    }
    return result;
  }
}
