import { type CloudEvent } from '@io/shared';
import { type CardRequest } from '../domain/entities/card-request.entity.js';
import {
  type CardRequestRepository,
  type EventPublisher,
  type IdGenerator,
  type Logger,
  type LogContext,
} from '../domain/ports/index.js';
import { type DocumentNumber } from '../domain/value-objects/document-number.vo.js';

export class MockCardRequestRepository implements CardRequestRepository {
  readonly saved: CardRequest[] = [];
  private byDni = new Map<string, CardRequest>();
  private byRequestId = new Map<string, CardRequest>();

  preload(request: CardRequest): void {
    this.byDni.set(request.customer.documentNumber.value, request);
    this.byRequestId.set(request.requestId, request);
  }

  save(request: CardRequest): Promise<void> {
    this.saved.push(request);
    this.byDni.set(request.customer.documentNumber.value, request);
    this.byRequestId.set(request.requestId, request);
    return Promise.resolve();
  }

  findByDocumentNumber(documentNumber: DocumentNumber): Promise<CardRequest | null> {
    return Promise.resolve(this.byDni.get(documentNumber.value) ?? null);
  }

  findByRequestId(requestId: string): Promise<CardRequest | null> {
    return Promise.resolve(this.byRequestId.get(requestId) ?? null);
  }
}

export interface PublishedRecord {
  topic: string;
  event: CloudEvent;
}

export class MockEventPublisher implements EventPublisher {
  readonly published: PublishedRecord[] = [];
  shouldFail = false;

  publish<T>(topic: string, event: CloudEvent<T>): Promise<void> {
    if (this.shouldFail) {
      return Promise.reject(new Error('publish failed (mock)'));
    }
    this.published.push({ topic, event });
    return Promise.resolve();
  }

  connect(): Promise<void> {
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;
  constructor(private readonly prefix = 'id') {}

  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${String(this.counter)}`;
  }
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: LogContext;
}

export class NoopLogger implements Logger {
  readonly entries: LogEntry[] = [];

  info(message: string, context?: LogContext): void {
    this.push('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.push('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.push('error', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.push('debug', message, context);
  }

  child(_bindings: LogContext): Logger {
    return this;
  }

  private push(level: LogEntry['level'], message: string, context?: LogContext): void {
    const entry: LogEntry = { level, message };
    if (context !== undefined) {
      entry.context = context;
    }
    this.entries.push(entry);
  }
}
