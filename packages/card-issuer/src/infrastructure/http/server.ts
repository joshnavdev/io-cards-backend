import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { type CardController } from './controllers/card.controller.js';
import { buildErrorHandler } from './middlewares/error-handler.middleware.js';
import { buildCardRouter } from './routes/card.routes.js';
import { type Logger } from '../../domain/ports/logger.port.js';

export interface ServerOptions {
  controller: CardController;
  logger: Logger;
  corsOrigin: string;
}

export function buildServer(options: ServerOptions): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: options.corsOrigin === '*' ? true : options.corsOrigin.split(','),
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  app.use(buildCardRouter(options.controller));
  app.use(buildErrorHandler(options.logger));

  return app;
}
