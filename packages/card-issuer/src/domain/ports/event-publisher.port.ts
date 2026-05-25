import { type CloudEvent } from '@io/shared';

export interface EventPublisher {
  publish<T>(topic: string, event: CloudEvent<T>): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
