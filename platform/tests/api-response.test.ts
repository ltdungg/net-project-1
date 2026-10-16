import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { correlationId, fail, ok, validationFail } from '../lib/api-response';

describe('API response helpers', () => {
  it('creates success and failure envelopes with the requested status', async () => {
    const success = ok({ id: 'order-1' }, { status: 201 });
    expect(success.status).toBe(201);
    expect(await success.json()).toEqual({ data: { id: 'order-1' }, error: null });

    const failure = fail('NOT_FOUND', 'Khong tim thay', 404, { id: 'missing' });
    expect(failure.status).toBe(404);
    expect(await failure.json()).toEqual({
      data: null,
      error: { code: 'NOT_FOUND', message: 'Khong tim thay', details: { id: 'missing' } },
    });
  });

  it('maps zod issues by field and preserves the first issue', async () => {
    const schema = z.object({ name: z.string().min(3), count: z.number().min(1) });
    const parsed = schema.safeParse({ name: '', count: 0 });
    expect(parsed.success).toBe(false);
    if (parsed.success) throw new Error('expected validation failure');
    const response = validationFail(parsed.error);
    expect(response.status).toBe(422);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('uses a supplied correlation ID and generates one when absent', () => {
    expect(correlationId(new Request('http://local', { headers: { 'x-correlation-id': 'trace-1' } }))).toBe('trace-1');
    expect(correlationId(new Request('http://local'))).toMatch(/^[0-9a-f-]{36}$/);
  });
});
