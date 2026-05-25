import {
  MaxRetriesExceededError,
  type RetryAttemptError,
} from '../../domain/errors/max-retries-exceeded.error.js';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  multiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  multiplier: 2,
};

export interface RetryResult<T> {
  value: T;
  attempts: number;
  errorHistory: readonly RetryAttemptError[];
}

export interface RetryDeps {
  delay?: (ms: number) => Promise<void>;
  now?: () => Date;
}

const defaultDelay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  deps: RetryDeps = {},
): Promise<RetryResult<T>> {
  const delay = deps.delay ?? defaultDelay;
  const now = deps.now ?? ((): Date => new Date());
  const history: RetryAttemptError[] = [];

  for (let attempt = 1; attempt <= config.maxRetries; attempt += 1) {
    try {
      const value = await fn(attempt);
      return { value, attempts: attempt, errorHistory: history };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      history.push({ attempt, message, failedAt: now().toISOString() });
      if (attempt < config.maxRetries) {
        const wait = config.baseDelayMs * Math.pow(config.multiplier, attempt - 1);
        await delay(wait);
      }
    }
  }

  throw new MaxRetriesExceededError(
    `Operation failed after ${String(config.maxRetries)} attempts`,
    config.maxRetries,
    history,
  );
}
