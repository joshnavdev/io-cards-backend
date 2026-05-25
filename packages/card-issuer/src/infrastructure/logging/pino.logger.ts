import pino, { type Logger as PinoBaseLogger } from 'pino';
import { type LogContext, type Logger } from '../../domain/ports/logger.port.js';

const REDACT_PATHS = [
  'cardNumber',
  'cvv',
  '*.cardNumber',
  '*.cvv',
  '*.*.cardNumber',
  '*.*.cvv',
  'data.cardNumber',
  'data.cvv',
  'data.*.cardNumber',
  'data.*.cvv',
  'data.card.cardNumber',
  'data.card.cvv',
];

export class PinoLogger implements Logger {
  private readonly pino: PinoBaseLogger;

  constructor(serviceName: string, level = 'info', child?: PinoBaseLogger) {
    this.pino =
      child ??
      pino({
        name: serviceName,
        level,
        redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      });
  }

  info(message: string, context?: LogContext): void {
    this.pino.info(context ?? {}, message);
  }

  warn(message: string, context?: LogContext): void {
    this.pino.warn(context ?? {}, message);
  }

  error(message: string, context?: LogContext): void {
    this.pino.error(context ?? {}, message);
  }

  debug(message: string, context?: LogContext): void {
    this.pino.debug(context ?? {}, message);
  }

  child(bindings: LogContext): Logger {
    const childPino = this.pino.child(bindings);
    return new PinoLogger('', '', childPino);
  }
}
