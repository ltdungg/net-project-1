import { NextResponse } from 'next/server';
import { z, type ZodError } from 'zod';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, error: null }, init);
}

export function fail(
  code: string,
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json(
    { data: null, error: { code, message, details } },
    { status },
  );
}

export function validationFail(error: ZodError) {
  return fail(
    'VALIDATION_ERROR',
    'Dữ liệu gửi lên chưa hợp lệ.',
    422,
    z.treeifyError(error),
  );
}

export function correlationId(request: Request) {
  return request.headers.get('x-correlation-id') ?? crypto.randomUUID();
}
