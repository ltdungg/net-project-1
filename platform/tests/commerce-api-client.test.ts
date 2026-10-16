import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CommerceApiError,
  commerceRaw,
  commerceRequest,
  commerceUrl,
  readEnvelope,
} from '../lib/commerce-api-client';

const envelope = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ data, error: null }), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('commerce API client', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it('normalizes relative API paths', () => {
    expect(commerceUrl('products')).toBe('/api/commerce/products');
    expect(commerceUrl('/products')).toBe('/api/commerce/products');
  });

  it('adds safe defaults and unwraps a successful envelope', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(envelope({ id: 'p-1' }));
    await expect(commerceRequest<{ id: string }>('/products/p-1')).resolves.toEqual({ id: 'p-1' });
    expect(fetch).toHaveBeenCalledWith('/api/commerce/products/p-1', expect.objectContaining({ credentials: 'include', cache: 'no-store' }));
    const init = vi.mocked(fetch).mock.calls[0]![1]!;
    expect(new Headers(init.headers).get('accept')).toBe('application/json');
  });

  it('refreshes once after a protected 401 and retries the original request', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(envelope(null, 401))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(envelope({ id: 'order-1' }));
    const response = await commerceRaw('/orders');
    expect(response.status).toBe(200);
    expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
      '/api/commerce/orders', '/api/commerce/auth/refresh', '/api/commerce/orders',
    ]);
  });

  it('does not recursively refresh authentication endpoints', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(envelope(null, 401));
    expect((await commerceRaw('/auth/login')).status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent refresh requests', async () => {
    let refreshCalls = 0;
    let protectedCalls = 0;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        await Promise.resolve();
        return new Response(null, { status: 204 });
      }
      protectedCalls += 1;
      return protectedCalls <= 2 ? envelope(null, 401) : envelope({ ok: true });
    });

    const [first, second] = await Promise.all([commerceRaw('/orders'), commerceRaw('/account/profile')]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(refreshCalls).toBe(1);
  });

  it('turns malformed and error envelopes into stable client errors', async () => {
    const malformed = await readEnvelope(new Response('not-json'));
    expect(malformed.error?.code).toBe('INVALID_API_RESPONSE');

    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ data: null, error: { code: 'OUT_OF_STOCK', message: 'Het hang', details: { sku: 'A' } } }), { status: 409 }));
    await expect(commerceRequest('/orders', { method: 'POST' })).rejects.toEqual(
      expect.objectContaining<Partial<CommerceApiError>>({ status: 409, code: 'OUT_OF_STOCK', message: 'Het hang' }),
    );
  });
});
