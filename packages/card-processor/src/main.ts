import { buildContainer } from './container.js';
import { loadConfig } from './infrastructure/config/env.config.js';
import { ensureTopics } from './infrastructure/messaging/ensure-topics.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const { kafka, consumer, publisher, logger } = buildContainer(config);

  await ensureTopics(kafka, logger);
  await publisher.connect();
  void consumer.start();

  logger.info('card-processor running');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('Shutdown signal received', { signal });
    await consumer.stop();
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
  console.error('[card-processor] fatal error:', error);
  process.exit(1);
});
