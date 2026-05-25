export const TOPICS = {
  CARD_REQUESTED: 'io.card.requested.v1',
  CARDS_ISSUED: 'io.cards.issued.v1',
  CARD_REQUESTED_DLQ: 'io.card.requested.v1.dlq',
} as const;

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];

export const EVENT_TYPES = {
  CARD_REQUESTED: 'io.card.requested.v1',
  CARDS_ISSUED: 'io.cards.issued.v1',
  CARD_REQUEST_FAILED: 'io.card.requested.failed.v1',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
