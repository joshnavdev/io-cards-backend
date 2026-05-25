export type DocumentType = 'DNI';
export type CardProductType = 'VISA';
export type CurrencyCode = 'PEN' | 'USD';

export type CardStatus = 'PENDING' | 'ISSUED' | 'FAILED';

export interface Customer {
  documentType: DocumentType;
  documentNumber: string;
  fullName: string;
  age: number;
  email: string;
}

export interface Product {
  type: CardProductType;
  currency: CurrencyCode;
}
