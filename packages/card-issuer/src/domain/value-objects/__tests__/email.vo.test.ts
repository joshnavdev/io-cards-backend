import { describe, expect, it } from 'vitest';
import { Email } from '../email.vo.js';
import { ValidationError } from '../../errors/validation.error.js';

describe('Email', () => {
  it('accepts valid email and normalizes to lowercase', () => {
    const email = Email.create('User@Example.COM');
    expect(email.value).toBe('user@example.com');
  });

  it('trims whitespace', () => {
    const email = Email.create('  user@example.com  ');
    expect(email.value).toBe('user@example.com');
  });

  it('rejects email without @', () => {
    expect(() => Email.create('userexample.com')).toThrow(ValidationError);
  });

  it('rejects email without domain', () => {
    expect(() => Email.create('user@')).toThrow(ValidationError);
  });

  it('rejects email without TLD', () => {
    expect(() => Email.create('user@example')).toThrow(ValidationError);
  });

  it('rejects empty string', () => {
    expect(() => Email.create('   ')).toThrow(ValidationError);
  });

  it('rejects non-string value', () => {
    expect(() => Email.create(123 as unknown as string)).toThrow(ValidationError);
  });

  it('rejects email longer than 254 chars', () => {
    const long = `${'a'.repeat(250)}@a.co`;
    expect(() => Email.create(long)).toThrow(ValidationError);
  });
});
