import { TOPICS } from '@io/shared';
import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { IssueCardUseCase } from '../../../application/use-cases/issue-card.use-case.js';
import { CardController } from '../controllers/card.controller.js';
import { buildServer } from '../server.js';
import {
  MockCardRequestRepository,
  MockEventPublisher,
  NoopLogger,
  SequentialIdGenerator,
} from '../../../__tests__/mocks.js';

interface IssueResponse {
  status: 'PENDING';
  requestId: string;
}

interface ErrorResponse {
  code: string;
  message: string;
}

const validBody = {
  customer: {
    documentType: 'DNI',
    documentNumber: '12345678',
    fullName: 'Juan Perez',
    age: 25,
    email: 'juan@example.com',
  },
  product: { type: 'VISA', currency: 'PEN' },
  forceError: false,
};

function buildApp() {
  const repository = new MockCardRequestRepository();
  const publisher = new MockEventPublisher();
  const idGenerator = new SequentialIdGenerator();
  const logger = new NoopLogger();
  const useCase = new IssueCardUseCase(repository, publisher, idGenerator, logger);
  const controller = new CardController(useCase, logger);
  const app = buildServer({ controller, logger, corsOrigin: '*' });
  return { app, repository, publisher };
}

describe('POST /cards/issue (integration)', () => {
  let sut: ReturnType<typeof buildApp>;

  beforeEach(() => {
    sut = buildApp();
  });

  it('returns 202 with requestId on valid payload', async () => {
    const res = await request(sut.app).post('/cards/issue').send(validBody);
    expect(res.status).toBe(202);
    const body = res.body as IssueResponse;
    expect(body.status).toBe('PENDING');
    expect(typeof body.requestId).toBe('string');
    expect(sut.publisher.published).toHaveLength(1);
    expect(sut.publisher.published[0]?.topic).toBe(TOPICS.CARD_REQUESTED);
  });

  it('returns 400 on invalid documentNumber (not 8 digits)', async () => {
    const res = await request(sut.app)
      .post('/cards/issue')
      .send({ ...validBody, customer: { ...validBody.customer, documentNumber: '123' } });
    expect(res.status).toBe(400);
    expect((res.body as ErrorResponse).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 on missing required field', async () => {
    const res = await request(sut.app).post('/cards/issue').send({ customer: {} });
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid email', async () => {
    const res = await request(sut.app)
      .post('/cards/issue')
      .send({ ...validBody, customer: { ...validBody.customer, email: 'not-an-email' } });
    expect(res.status).toBe(400);
  });

  it('returns 409 when customer already has a PENDING request', async () => {
    await request(sut.app).post('/cards/issue').send(validBody).expect(202);
    const res = await request(sut.app).post('/cards/issue').send(validBody);
    expect(res.status).toBe(409);
    expect((res.body as ErrorResponse).code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('GET /health returns 200', async () => {
    const res = await request(sut.app).get('/health');
    expect(res.status).toBe(200);
    expect((res.body as { status: string }).status).toBe('ok');
  });

  it('does not leak stack trace in 500 responses', async () => {
    sut.publisher.shouldFail = true;
    const res = await request(sut.app).post('/cards/issue').send(validBody);
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/\.ts:\d+/);
  });

  it('rejects body larger than 10kb', async () => {
    const huge = { ...validBody, customer: { ...validBody.customer, fullName: 'x'.repeat(11000) } };
    const res = await request(sut.app).post('/cards/issue').send(huge);
    expect([400, 413, 500]).toContain(res.status);
  });
});
