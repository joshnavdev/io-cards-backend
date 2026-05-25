import { type CardRequest } from '../../domain/entities/card-request.entity.js';
import { type CardRequestRepository } from '../../domain/ports/card-request.repository.port.js';
import { type DocumentNumber } from '../../domain/value-objects/document-number.vo.js';

export class InMemoryCardRequestRepository implements CardRequestRepository {
  private byDocument = new Map<string, CardRequest>();
  private byRequestId = new Map<string, CardRequest>();

  save(request: CardRequest): Promise<void> {
    this.byDocument.set(request.customer.documentNumber.value, request);
    this.byRequestId.set(request.requestId, request);
    return Promise.resolve();
  }

  findByDocumentNumber(documentNumber: DocumentNumber): Promise<CardRequest | null> {
    return Promise.resolve(this.byDocument.get(documentNumber.value) ?? null);
  }

  findByRequestId(requestId: string): Promise<CardRequest | null> {
    return Promise.resolve(this.byRequestId.get(requestId) ?? null);
  }
}
