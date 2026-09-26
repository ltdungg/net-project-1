import { KeyRound, ShieldCheck, UserCog } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requireManagementRole } from '@/lib/admin-auth';

export default async function SettingsPage() {
  await requireManagementRole();
  return (
    <>
      <PageHeader
        title="Cài đặt hệ thống"
        description="Màn hình tổng quan cấu hình; chức năng lưu sẽ được nối ở giai đoạn tiếp theo."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold">
            <UserCog className="size-5 text-accent" /> Thông tin cửa hàng
          </h2>
          <div className="mt-6 grid gap-5">
            <div>
              <Label>Tên hiển thị</Label>
              <Input className="mt-2" defaultValue="NÉT Fashion" />
            </div>
            <div>
              <Label>Email hỗ trợ</Label>
              <Input className="mt-2" defaultValue="hello@netfashion.vn" />
            </div>
            <div>
              <Label>Ngưỡng miễn phí giao hàng</Label>
              <Input className="mt-2" defaultValue="799000" />
            </div>
            <Button className="w-fit" disabled>
              Chưa hỗ trợ lưu
            </Button>
          </div>
        </section>
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold">
            <ShieldCheck className="size-5 text-accent" /> Vai trò & quyền
          </h2>
          <div className="mt-6 space-y-3">
            {[
              ['Admin', 'Toàn quyền', 'Theo cấu hình'],
              ['Manager', 'Catalog, promotion, report', 'Theo cấu hình'],
              ['Staff', 'Order, inventory, customer', 'Theo dữ liệu'],
              ['Customer', 'Tài khoản và đơn của mình', 'Theo dữ liệu'],
            ].map(([role, scope, count]) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >
                <div>
                  <p className="font-semibold">{role}</p>
                  <p className="text-xs text-muted-foreground">{scope}</p>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-card p-6 shadow-sm xl:col-span-2">
          <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold">
            <KeyRound className="size-5 text-accent" /> Tích hợp
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ['Thanh toán', 'MockPay', 'Chỉ local'],
              ['Vận chuyển', 'Shipping adapter', 'Sandbox'],
              ['Email', 'Transactional provider', 'Chưa cấu hình'],
            ].map(([type, provider, status]) => (
              <div key={type} className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">{type}</p>
                <p className="mt-2 font-semibold">{provider}</p>
                <Badge
                  className="mt-3 bg-emerald-50 text-emerald-700"
                  variant="secondary"
                >
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
