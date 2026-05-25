import { type CardNumber } from '../value-objects/card-number.vo.js';
import { type CVV } from '../value-objects/cvv.vo.js';

export interface CardDetailsProps {
  number: CardNumber;
  cvv: CVV;
  expiryMonth: number;
  expiryYear: number;
  brand: 'VISA';
}

export class CardDetails {
  private constructor(private readonly props: CardDetailsProps) {}

  static create(props: CardDetailsProps): CardDetails {
    return new CardDetails(props);
  }

  get number(): CardNumber {
    return this.props.number;
  }

  get cvv(): CVV {
    return this.props.cvv;
  }

  get expiryMonth(): number {
    return this.props.expiryMonth;
  }

  get expiryYear(): number {
    return this.props.expiryYear;
  }

  get brand(): 'VISA' {
    return this.props.brand;
  }

  get expiryFormatted(): string {
    const month = this.props.expiryMonth.toString().padStart(2, '0');
    return `${month}/${String(this.props.expiryYear).slice(-2)}`;
  }
}
