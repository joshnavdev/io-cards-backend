import { describe, expect, it, vi } from 'vitest';
import { retryWithBackoff, type RetryConfig } from '../retry-with-backoff.js';
import { MaxRetriesExceededError } from '../../../domain/errors/max-retries-exceeded.error.js';

const fastConfig: RetryConfig = { maxRetries: 3, baseDelayMs: 1000, multiplier: 2 };
const noWait = (): Promise<void> => Promise.resolve();

describe('retryWithBackoff', () => {
  it('returns value on first attempt success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retryWithBackoff(fn, fastConfig, { delay: noWait });
    expect(result.value).toBe('ok');
    expect(result.attempts).toBe(1);
    expect(result.errorHistory).toHaveLength(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds on second attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom 1'))
      .mockResolvedValueOnce('ok');
    const result = await retryWithBackoff(fn, fastConfig, { delay: noWait });
    expect(result.value).toBe('ok');
    expect(result.attempts).toBe(2);
    expect(result.errorHistory).toHaveLength(1);
    expect(result.errorHistory[0]?.message).toBe('boom 1');
  });

  it('throws MaxRetriesExceededError after all attempts fail', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(retryWithBackoff(fn, fastConfig, { delay: noWait })).rejects.toBeInstanceOf(
      MaxRetriesExceededError,
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('history contains all 3 attempts on full failure', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('e1'))
      .mockRejectedValueOnce(new Error('e2'))
      .mockRejectedValueOnce(new Error('e3'));
    try {
      await retryWithBackoff(fn, fastConfig, { delay: noWait });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(MaxRetriesExceededError);
      const e = err as MaxRetriesExceededError;
      expect(e.attempts).toBe(3);
      expect(e.history).toHaveLength(3);
      expect(e.history.map((h) => h.message)).toEqual(['e1', 'e2', 'e3']);
    }
  });

  it('respects backoff delays (1s, 2s)', async () => {
    const delays: number[] = [];
    const captureDelay = (ms: number): Promise<void> => {
      delays.push(ms);
      return Promise.resolve();
    };
    const fn = vi.fn().mockRejectedValue(new Error('x'));
    await expect(
      retryWithBackoff(fn, fastConfig, { delay: captureDelay }),
    ).rejects.toBeInstanceOf(MaxRetriesExceededError);
    expect(delays).toEqual([1000, 2000]);
  });

  it('passes attempt number to fn', async () => {
    const attempts: number[] = [];
    const fn = vi.fn((n: number) => {
      attempts.push(n);
      if (n < 3) return Promise.reject(new Error('not yet'));
      return Promise.resolve('ok');
    });
    const result = await retryWithBackoff(fn, fastConfig, { delay: noWait });
    expect(attempts).toEqual([1, 2, 3]);
    expect(result.value).toBe('ok');
  });
});
