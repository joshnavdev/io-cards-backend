import { type CloudEvent } from '@io/shared';
import {
  type EventPublisher,
  type ExternalCardService,
  type IdGenerator,
  type Logger,
  type LogContext,
} from '../domain/ports/index.js';

export interface PublishedRecord {
  topic: string;
  event: CloudEvent;
}

export class MockEventPublisher implements EventPublisher {
  readonly published: PublishedRecord[] = [];

  publish<T>(topic: string, event: CloudEvent<T>): Promise<void> {
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

export class NoopLogger implements Logger {
  info(_message: string, _context?: LogContext): void {
    // intentional noop
  }
  warn(_message: string, _context?: LogContext): void {
    // intentional noop
  }
  error(_message: string, _context?: LogContext): void {
    // intentional noop
  }
  debug(_message: string, _context?: LogContext): void {
    // intentional noop
  }
  child(_bindings: LogContext): Logger {
    return this;
  }
}

export class ScriptedExternalService implements ExternalCardService {
  private callIndex = 0;
  constructor(private readonly outcomes: ('ok' | Error)[]) {}

  process(_input: { requestId: string; forceError: boolean }): Promise<void> {
    const idx = this.callIndex;
    this.callIndex += 1;
    const outcome = this.outcomes[idx];
    if (outcome === undefined) {
      return Promise.reject(new Error(`unexpected call #${String(idx + 1)}`));
    }
    if (outcome instanceof Error) {
      return Promise.reject(outcome);
    }
    return Promise.resolve();
  }

  get callCount(): number {
    return this.callIndex;
  }
}
