import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const workerEnv = vi.hoisted(() => ({
  COMMERCE_API_URL: 'http://backend.test:8080',
  COMMERCE_PUBLIC_ORIGIN: 'https://shop.test',
}));

vi.mock('cloudflare:workers', () => ({ env: workerEnv }));

import { DELETE, GET, PATCH, POST, PUT } from '../app/api/commerce/[...path]/route';

const context = (...path: string[]) => ({ params: Promise.resolve({ path }) });

describe('commerce BFF proxy', () => {
  beforeEach(() => {
    workerEnv.COMMERCE_API_URL = 'http://backend.test:8080';
    workerEnv.COMMERCE_PUBLIC_ORIGIN = 'https://shop.test';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['POST', POST], ['PUT', PUT], ['PATCH', PATCH], ['DELETE', DELETE],
  ] as const)('rejects cross-site %s even when a valid-looking cookie and role are supplied', async (method, handler) => {
    const response = await handler(new Request('https://shop.test/api/commerce/account/profile', {
      method,
      headers: { origin: 'https://shop.test', 'sec-fetch-site': 'cross-site',
        cookie: 'net_access_token=forged', 'x-role': 'admin' },
    }), context('account', 'profile'));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ data: null, error: { code: 'ORIGIN_FORBIDDEN' } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['https://shop.test.evil.test', 'https://evil.test', 'http://shop.test', 'https://shop.test:444', 'null'])
    ('rejects origin %s before forwarding any mutation', async (origin) => {
      const response = await POST(new Request('https://shop.test/api/commerce/orders', {
        method: 'POST', headers: { origin }, body: '{}',
      }), context('orders'));
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: 'ORIGIN_FORBIDDEN' } });
      expect(fetch).not.toHaveBeenCalled();
    });

  it.each([['auth', 'me'], ['account', 'addresses'], ['account', 'wishlist'], ['orders'], ['orders', 'victim']])
    ('does not accept forged identity headers as credentials for %j', async (...path) => {
      const response = await GET(new Request(`https://shop.test/api/commerce/${path.join('/')}`, {
        headers: { 'x-user-id': 'victim', 'x-role': 'admin',
          'oai-authenticated-user-id': 'victim', cookie: 'other_net_access_token=fake' },
      }), context(...path));
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ error: { code: 'AUTH_REQUIRED' } });
      expect(fetch).not.toHaveBeenCalled();
    });

  it('forwards backend authorization denial and drops spoofed identity/role headers', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      data: null, error: { code: 'FORBIDDEN', message: 'Denied' },
    }), { status: 403, headers: { 'content-type': 'application/json' } }));
    const response = await GET(new Request('https://shop.test/api/commerce/admin/orders', {
      headers: { authorization: 'Bearer signed-customer-token', 'x-user-id': 'victim', 'x-role': 'admin',
        'oai-authenticated-user-email': 'owner@example.com' },
    }), context('admin', 'orders'));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ data: null, error: { code: 'FORBIDDEN' } });
    const headers = new Headers(vi.mocked(fetch).mock.calls[0]![1]?.headers);
    expect(headers.get('authorization')).toBe('Bearer signed-customer-token');
    for (const name of ['x-user-id', 'x-role', 'oai-authenticated-user-email']) {
      expect(headers.has(name)).toBe(false);
    }
  });

  it('rejects empty/traversal paths before contacting the backend', async () => {
    expect((await GET(new Request('https://shop.test/api/commerce'), context())).status).toBe(400);
    expect((await GET(new Request('https://shop.test/api/commerce/x'), context('..'))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('blocks untrusted mutations and protected reads without credentials', async () => {
    const mutation = await POST(
      new Request('https://shop.test/api/commerce/orders', { method: 'POST' }),
      context('orders'),
    );
    expect(mutation.status).toBe(403);
    expect(((await mutation.json()) as { error: { code: string } }).error.code).toBe('ORIGIN_FORBIDDEN');

    const protectedRead = await GET(
      new Request('https://shop.test/api/commerce/account/profile'),
      context('account', 'profile'),
    );
    expect(protectedRead.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows guest tracking and forwards its signed header and query', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: 'order-1' }, error: null }), {
        headers: { 'content-type': 'application/json' },
      }),
    );
    const response = await GET(
      new Request('https://shop.test/api/commerce/orders/order-1/guest?view=compact', {
        headers: { 'x-guest-order-token': 'signed-token', 'x-secret': 'drop-me' },
      }),
      context('orders', 'order-1', 'guest'),
    );
    expect(response.status).toBe(200);
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBeInstanceOf(URL);
    expect((url as URL).href).toBe('http://backend.test:8080/api/orders/order-1/guest?view=compact');
    const headers = new Headers(init?.headers);
    expect(headers.get('x-guest-order-token')).toBe('signed-token');
    expect(headers.has('x-secret')).toBe(false);
  });

  it('allows signed-provider webhooks without browser origin and forwards raw bytes', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await POST(
      new Request('https://shop.test/api/commerce/payments/webhook', {
        method: 'POST',
        headers: { 'x-provider-signature': 'hmac', 'content-type': 'application/json' },
        body: '{"event":"paid"}',
      }),
      context('payments', 'webhook'),
    );
    expect(response.status).toBe(204);
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(new Headers(init?.headers).get('x-provider-signature')).toBe('hmac');
    expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe('{"event":"paid"}');
  });

  it('rewrites backend cookies, redirects and JSON asset URLs', async () => {
    const upstreamHeaders = new Headers({
      'content-type': 'application/json',
      location: 'http://backend.test:8080/api/assets/photo.jpg',
      etag: 'backend-etag',
    });
    upstreamHeaders.append('set-cookie', 'net_access_token=abc; Path=/api/auth; HttpOnly');
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('{"url":"/api/assets/photo.jpg"}', { status: 201, headers: upstreamHeaders }),
    );
    const response = await POST(
      new Request('https://shop.test/api/commerce/auth/login', {
        method: 'POST',
        headers: { origin: 'https://shop.test', 'sec-fetch-site': 'same-origin' },
        body: '{}',
      }),
      context('auth', 'login'),
    );
    expect(response.status).toBe(201);
    expect(response.headers.get('location')).toBe('/api/commerce/assets/photo.jpg');
    expect(response.headers.get('set-cookie')).toContain('Path=/api/commerce/auth');
    expect(response.headers.has('etag')).toBe(false);
    expect(await response.text()).toContain('/api/commerce/assets/photo.jpg');
  });

  it('maps invalid configuration and transport failures to stable errors', async () => {
    workerEnv.COMMERCE_API_URL = 'file:///tmp/backend';
    expect((await GET(new Request('https://shop.test/api/commerce/products'), context('products'))).status).toBe(503);

    workerEnv.COMMERCE_API_URL = 'http://backend.test:8080';
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    const unavailable = await GET(new Request('https://shop.test/api/commerce/products'), context('products'));
    expect(unavailable.status).toBe(502);
    expect(((await unavailable.json()) as { error: { code: string } }).error.code).toBe('COMMERCE_API_UNAVAILABLE');
  });
});
