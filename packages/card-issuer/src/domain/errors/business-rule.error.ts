import { AppError } from './app.error.js';

export class BusinessRuleError extends AppError {
  readonly statusCode = 409;
  readonly code = 'BUSINESS_RULE_VIOLATION';
}
