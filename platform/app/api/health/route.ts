import { env } from 'cloudflare:workers';

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const base = new URL(env.COMMERCE_API_URL || 'http://127.0.0.1:8080');
    const response = await fetch(new URL('/api/health', base), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(4_000),
      cache: 'no-store',
    });
    const payload = (await response.json()) as {
      data?: { status?: string; service?: string; runtime?: string };
    };
    if (!response.ok || payload.data?.status !== 'ok') throw new Error();
    return Response.json({
      data: {
        status: 'healthy',
        frontend: 'ok',
        backend: payload.data,
        checkedAt,
      },
      error: null,
    });
  } catch {
    return Response.json(
      {
        data: {
          status: 'degraded',
          frontend: 'ok',
          backend: 'unavailable',
          checkedAt,
        },
        error: {
          code: 'COMMERCE_API_UNAVAILABLE',
          message: 'Backend thương mại điện tử không khả dụng.',
        },
      },
      { status: 503 },
    );
  }
}
