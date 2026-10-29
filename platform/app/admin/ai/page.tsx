import { Sparkles } from 'lucide-react';
import { AiWorkspace } from './ai-workspace';
import { commerceServerRequest } from '@/lib/commerce-api-server';

export default async function AdminAiPage() {
  const user = await commerceServerRequest<{ roles: string[] }>('/auth/me');
  const canBuild = user.roles.some((role) =>
    ['admin', 'manager'].includes(role),
  );
  return (
    <>
      <div className="mb-7">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          <Sparkles className="size-4" /> Trợ lý vận hành
        </p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          NÉT AI Copilot
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Dùng Gemini để hỏi về hoạt động cửa hàng hoặc mô tả dashboard bạn muốn
          tạo. Số liệu được lấy từ hệ thống; bạn có thể xem trước và lưu
          dashboard để dùng lại.
        </p>
      </div>
      <AiWorkspace canBuild={canBuild} />
    </>
  );
}
