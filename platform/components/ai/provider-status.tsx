'use client';

import { useEffect, useState } from 'react';
import { commerceRequest } from '@/lib/commerce-api-client';

export function AiProviderStatus({ admin = false }: { admin?: boolean }) {
  const [status, setStatus] = useState<
    'loading' | 'configured' | 'rules' | 'unavailable'
  >('loading');

  useEffect(() => {
    const controller = new AbortController();
    void commerceRequest<{ provider: 'gemini'; configured: boolean }>(
      '/ai/status',
      {
        signal: controller.signal,
      },
    )
      .then((result) => {
        if (!controller.signal.aborted)
          setStatus(result.configured ? 'configured' : 'rules');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('unavailable');
      });
    return () => controller.abort();
  }, []);

  const labels = {
    loading: 'Đang kiểm tra Gemini…',
    configured: 'Gemini · đã cấu hình',
    rules: admin
      ? 'Gemini chưa được cấu hình · đang dùng chế độ cơ bản'
      : 'Chế độ tư vấn cơ bản',
    unavailable: 'Chưa kiểm tra được trạng thái Gemini',
  };

  return (
    <output className="block text-xs leading-5 text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${status === 'configured' ? 'bg-emerald-600' : 'bg-muted-foreground/50'}`}
        />
        {labels[status]}
      </span>
      {admin && status === 'rules' && (
        <span className="mt-1 block">
          Cấu hình GEMINI_API_KEY ở máy chủ để bật tư vấn và tạo dashboard bằng
          Gemini.
        </span>
      )}
    </output>
  );
}
