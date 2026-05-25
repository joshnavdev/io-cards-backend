import { AppError } from './app.error.js';

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
}
