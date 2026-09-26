import {
  CheckCircle2,
  CircleDollarSign,
  Download,
  RefreshCw,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatVnd } from '@/lib/catalog-data';
import { commerceServerRequest } from '@/lib/commerce-api-server';
import { requireManagementRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  await requireManagementRole();
  const finance = await commerceServerRequest<{
    summary: {
      totalPayments: number;
      successfulPayments: number;
      netCollectedCents: number;
      pendingOrAuthorizedCents: number;
    };
    paymentStatuses: { status: string; count: number; amountCents: number }[];
  }>('/admin/finance');
  const matchRate = Number(finance.summary.totalPayments)
    ? (Number(finance.summary.successfulPayments) / Number(finance.summary.totalPayments)) * 100
    : 100;
  return (
    <>
      <PageHeader
        title="Tài chính & đối soát"
        description="Đối chiếu đơn, payment attempt, webhook, refund và tiền về theo provider."
        action={
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw /> Đối soát lại
            </Button>
            <Button variant="outline">
              <Download /> Xuất CSV
            </Button>
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <CircleDollarSign className="size-5 text-accent" />
          <p className="mt-4 text-sm text-muted-foreground">Đã thu trong kỳ</p>
          <strong className="mt-1 block font-heading text-4xl">
            {formatVnd(Number(finance.summary.netCollectedCents))}
          </strong>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Chờ đối soát</p>
          <strong className="mt-3 block font-heading text-4xl">
            {formatVnd(Number(finance.summary.pendingOrAuthorizedCents))}
          </strong>
          <p className="mt-2 text-xs text-amber-700">
            {finance.paymentStatuses.filter((item) => ['pending', 'authorized'].includes(item.status)).reduce((sum, item) => sum + item.count, 0)} giao dịch
          </p>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <CheckCircle2 className="size-5 text-emerald-600" />
          <p className="mt-4 text-sm text-muted-foreground">Tỷ lệ khớp</p>
          <strong className="mt-1 block font-heading text-4xl">
            {matchRate.toFixed(2)}%
          </strong>
        </div>
      </section>
      <section className="mt-5 rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="font-heading text-2xl font-semibold">
          Tình trạng theo kênh
        </h2>
        <div className="mt-6 space-y-6">
          {finance.paymentStatuses.map((channel) => {
            const successRate = channel.status === 'succeeded' ? 100 : channel.status === 'failed' ? 0 : 50;
            return <div key={channel.status}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{channel.status}</span>
                <span>
                  {formatVnd(Number(channel.amountCents))} · {successRate}%
                </span>
              </div>
              <Progress value={successRate} className="mt-2" />
            </div>
          })}
          {!finance.paymentStatuses.length ? (
            <p className="text-sm text-muted-foreground">
              Chưa có giao dịch để đối soát.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
