import { type CardRequest } from '../entities/card-request.entity.js';
import { type DocumentNumber } from '../value-objects/document-number.vo.js';

export interface CardRequestRepository {
  save(request: CardRequest): Promise<void>;
  findByDocumentNumber(documentNumber: DocumentNumber): Promise<CardRequest | null>;
  findByRequestId(requestId: string): Promise<CardRequest | null>;
}
