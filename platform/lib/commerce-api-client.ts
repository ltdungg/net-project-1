export type ApiProblem = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> = {
  data: T | null;
  error: ApiProblem | null;
};

export class CommerceApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'CommerceApiError';
  }
}

const API_PREFIX = '/api/commerce';
let refreshInFlight: Promise<boolean> | null = null;

export function commerceUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_PREFIX}${normalized}`;
}

export async function commerceRaw(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = true,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('accept')) headers.set('accept', 'application/json');
  const requestUrl = path.startsWith(`${API_PREFIX}/`)
    ? path
    : commerceUrl(path);
  const response = await fetch(requestUrl, {
    ...init,
    credentials: 'include',
    cache: init.cache ?? 'no-store',
    headers,
  });

  if (
    response.status === 401 &&
    retryAfterRefresh &&
    ![
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/logout',
      '/auth/verify-email',
      '/auth/forgot-password',
      '/auth/reset-password',
    ].includes(
      (path.startsWith(API_PREFIX) ? path.slice(API_PREFIX.length) : path).split(
        '?',
      )[0] ?? path,
    )
  ) {
    const refreshed = await refreshSession();
    if (refreshed) return commerceRaw(path, init, false);
  }
  return response;
}

export async function commerceRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await commerceRaw(path, init);
  const payload = await readEnvelope<T>(response);
  if (!response.ok || payload.error || payload.data === null) {
    const problem = payload.error;
    throw new CommerceApiError(
      response.status,
      problem?.code ?? 'COMMERCE_API_ERROR',
      problem?.message ?? 'Không thể kết nối hệ thống. Vui lòng thử lại.',
      problem?.details,
    );
  }
  return payload.data;
}

export async function readEnvelope<T>(
  response: Response,
): Promise<ApiEnvelope<T>> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    return {
      data: null,
      error: {
        code: 'INVALID_API_RESPONSE',
        message: 'Máy chủ trả về dữ liệu không hợp lệ.',
      },
    };
  }
}

export function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('net:auth-changed'));
  }
}

async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(commerceUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
      .then((response) => {
        if (
          !response.ok &&
          (response.status === 401 || response.status === 403) &&
          typeof window !== 'undefined'
        ) {
          window.dispatchEvent(new Event('net:auth-expired'));
        }
        return response.ok;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}
