import { AppError } from './app.error.js';

export interface RetryAttemptError {
  attempt: number;
  message: string;
  failedAt: string;
}

export class MaxRetriesExceededError extends AppError {
  readonly code = 'MAX_RETRIES_EXCEEDED';

  constructor(
    message: string,
    public readonly attempts: number,
    public readonly history: readonly RetryAttemptError[],
  ) {
    super(message);
  }
}
