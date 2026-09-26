import { env } from 'cloudflare:workers';
import { headers as requestHeaders } from 'next/headers';

import type { ApiEnvelope } from '@/lib/commerce-api-client';

export async function commerceServerRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const incoming = await requestHeaders();
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  const cookie = incoming.get('cookie');
  const authorization = incoming.get('authorization');
  const correlationId = incoming.get('x-correlation-id');
  if (cookie) headers.set('cookie', cookie);
  if (authorization) headers.set('authorization', authorization);
  if (correlationId) headers.set('x-correlation-id', correlationId);

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = new URL(env.COMMERCE_API_URL || 'http://127.0.0.1:8080');
  const response = await fetch(new URL(`/api${normalized}`, base), {
    ...init,
    headers,
    cache: init.cache ?? 'no-store',
  });
  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || envelope.error || envelope.data === null) {
    throw new Error(envelope.error?.message ?? `Commerce API ${response.status}`);
  }
  return envelope.data;
}
