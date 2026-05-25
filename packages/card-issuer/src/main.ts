import { buildContainer } from './container.js';
import { loadConfig } from './infrastructure/config/env.config.js';
import { buildServer } from './infrastructure/http/server.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const { controller, publisher, logger } = buildContainer(config);

  await publisher.connect();

  const app = buildServer({
    controller,
    logger,
    corsOrigin: config.CORS_ORIGIN,
  });

  const server = app.listen(config.PORT, () => {
    logger.info('card-issuer listening', { port: config.PORT });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('Shutdown signal received', { signal });
    server.close();
    await publisher.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

bootstrap().catch((error: unknown) => {
  console.error('[card-issuer] fatal error:', error);
  process.exit(1);
});
