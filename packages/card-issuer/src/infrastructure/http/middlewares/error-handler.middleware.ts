import { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../../domain/errors/app.error.js';
import { type Logger } from '../../../domain/ports/logger.port.js';

export function buildErrorHandler(logger: Logger) {
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof ZodError) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Request body is invalid',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    if (err instanceof AppError) {
      logger.warn('Application error', {
        code: err.code,
        statusCode: err.statusCode,
        path: req.path,
      });
      res.status(err.statusCode).json(err.toJSON());
      return;
    }

    logger.error('Unhandled error', {
      path: req.path,
      message: err instanceof Error ? err.message : 'unknown',
    });
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  };
}
