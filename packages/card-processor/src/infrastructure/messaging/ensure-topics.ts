import { TOPICS } from '@io/shared';
import { type Kafka } from 'kafkajs';
import { type Logger } from '../../domain/ports/logger.port.js';

export async function ensureTopics(kafka: Kafka, logger: Logger): Promise<void> {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const existing = new Set(await admin.listTopics());
    const required = [TOPICS.CARD_REQUESTED, TOPICS.CARDS_ISSUED, TOPICS.CARD_REQUESTED_DLQ];
    const toCreate = required
      .filter((topic) => !existing.has(topic))
      .map((topic) => ({ topic, numPartitions: 1, replicationFactor: 1 }));

    if (toCreate.length > 0) {
      await admin.createTopics({ topics: toCreate, waitForLeaders: true });
      logger.info('Topics created', { topics: toCreate.map((t) => t.topic) });
    } else {
      logger.info('All topics already exist');
    }
  } finally {
    await admin.disconnect();
  }
}
