import { ExternalServiceError } from '../errors/external-service.error.js';
import { type ExternalCardService } from '../ports/external-card-service.port.js';

export interface ExternalServiceSimulatorOptions {
  randomFn?: () => number;
  delay?: (ms: number) => Promise<void>;
  minLatencyMs?: number;
  maxLatencyMs?: number;
  failureRate?: number;
}

export class ExternalServiceSimulator implements ExternalCardService {
  private readonly random: () => number;
  private readonly delay: (ms: number) => Promise<void>;
  private readonly minLatency: number;
  private readonly maxLatency: number;
  private readonly failureRate: number;

  constructor(options: ExternalServiceSimulatorOptions = {}) {
    this.random = options.randomFn ?? Math.random;
    this.delay =
      options.delay ??
      ((ms): Promise<void> =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, ms);
        }));
    this.minLatency = options.minLatencyMs ?? 200;
    this.maxLatency = options.maxLatencyMs ?? 500;
    this.failureRate = options.failureRate ?? 0.3;
  }

  async process(input: { requestId: string; forceError: boolean }): Promise<void> {
    const range = this.maxLatency - this.minLatency;
    const latency = this.minLatency + Math.floor(this.random() * range);
    await this.delay(latency);

    if (input.forceError) {
      throw new ExternalServiceError('External service forced error (forceError: true)');
    }

    if (this.random() < this.failureRate) {
      throw new ExternalServiceError('External service transient failure');
    }
  }
}
