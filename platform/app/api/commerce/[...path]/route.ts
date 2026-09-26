import { env } from 'cloudflare:workers';

import { fail } from '@/lib/api-response';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'authorization',
  'content-type',
  'cookie',
  'cf-connecting-ip',
  'idempotency-key',
  'if-none-match',
  'range',
  'x-correlation-id',
  'x-guest-order-token',
  'x-payment-signature',
  'x-provider-signature',
];
const FORWARDED_RESPONSE_HEADERS = [
  'cache-control',
  'content-disposition',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'location',
  'x-correlation-id',
];

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  const { path } = await context.params;
  if (!path.length || path.some((segment) => !segment || segment === '..')) {
    return fail('INVALID_API_PATH', 'Đường dẫn API không hợp lệ.', 400);
  }

  const relativePath = path.join('/');
  if (
    !SAFE_METHODS.has(request.method) &&
    !isSignedProviderWebhook(relativePath, request.method) &&
    !hasTrustedBrowserOrigin(request)
  ) {
    return fail(
      'ORIGIN_FORBIDDEN',
      'Nguồn gửi yêu cầu không được phép.',
      403,
    );
  }
  if (requiresMemberCookie(relativePath, request.method) && !hasAccessToken(request)) {
    return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.', 401);
  }

  let upstreamUrl: URL;
  try {
    const base = new URL(
      env.COMMERCE_API_URL || 'http://127.0.0.1:8080',
    );
    if (!['http:', 'https:'].includes(base.protocol)) throw new Error();
    upstreamUrl = new URL(
      `/api/${path.map(encodeURIComponent).join('/')}`,
      base,
    );
    upstreamUrl.search = new URL(request.url).search;
  } catch {
    return fail(
      'COMMERCE_API_CONFIG_INVALID',
      'Địa chỉ backend chưa được cấu hình hợp lệ.',
      503,
    );
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has('cf-connecting-ip')) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) headers.set('cf-connecting-ip', forwarded.split(',')[0]!.trim());
  }
  if (!SAFE_METHODS.has(request.method)) {
    headers.set(
      'origin',
      env.COMMERCE_PUBLIC_ORIGIN || new URL(request.url).origin,
    );
    headers.set('sec-fetch-site', 'same-origin');
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: SAFE_METHODS.has(request.method)
        ? undefined
        : await request.arrayBuffer(),
      redirect: 'manual',
    });
  } catch {
    return fail(
      'COMMERCE_API_UNAVAILABLE',
      'Backend thương mại điện tử đang tạm thời không khả dụng.',
      502,
    );
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const location = responseHeaders.get('location');
  if (location) {
    responseHeaders.set(
      'location',
      rewriteUpstreamLocation(location, upstreamUrl),
    );
  }
  responseHeaders.set('x-content-type-options', 'nosniff');

  for (const cookie of setCookies(upstream.headers)) {
    responseHeaders.append('set-cookie', rewriteCookiePath(cookie));
  }

  let responseBody: BodyInit | null = upstream.body;
  if ((upstream.headers.get('content-type') ?? '').includes('application/json')) {
    responseBody = (await upstream.text()).replaceAll(
      '"/api/assets/',
      '"/api/commerce/assets/',
    );
    responseHeaders.delete('content-length');
    responseHeaders.delete('etag');
  }

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

function isSignedProviderWebhook(path: string, method: string) {
  return method === 'POST' && path === 'payments/webhook';
}

function hasTrustedBrowserOrigin(request: Request) {
  const expected = env.COMMERCE_PUBLIC_ORIGIN || new URL(request.url).origin;
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}

function requiresMemberCookie(path: string, method: string) {
  if (method === 'GET' && /^orders\/[^/]+\/guest$/.test(path)) return false;
  return (
    path === 'auth/me' ||
    path.startsWith('account/') ||
    (method === 'GET' && (path === 'orders' || path.startsWith('orders/')))
  );
}

function hasAccessToken(request: Request) {
  if (request.headers.get('authorization')?.startsWith('Bearer ')) return true;
  return /(?:^|;\s*)net_access_token=/.test(
    request.headers.get('cookie') ?? '',
  );
}

function setCookies(headers: Headers): string[] {
  const enhanced = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof enhanced.getSetCookie === 'function') return enhanced.getSetCookie();
  const combined = headers.get('set-cookie');
  if (!combined) return [];
  return combined.split(/,(?=\s*[^;,=]+=[^;,]+)/g);
}

function rewriteCookiePath(cookie: string) {
  return cookie.replace(/Path=\/api\/auth(?=;|$)/i, 'Path=/api/commerce/auth');
}

function rewriteUpstreamLocation(location: string, upstreamUrl: URL) {
  try {
    const target = new URL(location, upstreamUrl);
    if (
      target.origin === upstreamUrl.origin &&
      (target.pathname === '/api' || target.pathname.startsWith('/api/'))
    ) {
      return `/api/commerce${target.pathname.slice(4)}${target.search}${target.hash}`;
    }
  } catch {
    // Preserve an opaque Location value returned by an external provider.
  }
  return location;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
