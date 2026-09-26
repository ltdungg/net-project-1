import { formatVnd } from '@/lib/catalog-data';
import { commerceServerRequest } from '@/lib/commerce-api-server';

export type BackofficeOrder = {
  id: string;
  number: string;
  customer: string;
  email: string;
  total: number;
  status: string;
  payment: string;
  createdAt: string;
};

type ApiOrder = {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  grandTotalCents: number;
  createdAt: number;
};

export async function getBackofficeOrders(limit = 50) {
  const result = await commerceServerRequest<{ items: ApiOrder[] }>(
    `/admin/orders?limit=${Math.min(100, Math.max(1, limit))}`,
  );
  return result.items.map(
    (order): BackofficeOrder => ({
      id: order.id,
      number: order.orderNumber,
      customer: order.email,
      email: order.email,
      total: Number(order.grandTotalCents),
      status: order.status,
      payment: order.paymentStatus,
      createdAt: formatDateTime(order.createdAt),
    }),
  );
}

export async function getBackofficeCustomers(limit = 100) {
  const result = await commerceServerRequest<{
    items: {
      id: string;
      fullName: string | null;
      email: string;
      totalOrders: number;
      totalRevenueCents: number;
      lastOrderAt: number | null;
    }[];
  }>(`/admin/customers?limit=${Math.min(100, Math.max(1, limit))}`);
  return result.items.map((customer) => ({
    id: customer.id,
    name: customer.fullName || customer.email,
    email: customer.email,
    orders: Number(customer.totalOrders),
    spent: Number(customer.totalRevenueCents),
    segment:
      Number(customer.totalRevenueCents) >= 5_000_000
        ? 'VIP'
        : Number(customer.totalOrders) >= 2
          ? 'Trung thành'
          : 'Mới',
    lastOrder: customer.lastOrderAt
      ? new Intl.DateTimeFormat('vi-VN').format(new Date(customer.lastOrderAt))
      : '—',
  }));
}

export async function getBackofficePromotions() {
  const result = await commerceServerRequest<{
    items: {
      id: string;
      name: string;
      type: string;
      value: number;
      usageCount: number;
      usageLimit: number | null;
      startsAt: number;
      endsAt: number;
      status: string;
      code: string;
    }[];
  }>('/admin/promotions');
  const now = Date.now();
  return result.items.map((promotion) => ({
    ...promotion,
    typeLabel:
      promotion.type === 'percentage'
        ? `Giảm ${promotion.value}%`
        : promotion.type === 'free_shipping'
          ? 'Miễn phí giao hàng'
          : `Giảm ${formatVnd(promotion.value)}`,
    usage: `${promotion.usageCount} / ${promotion.usageLimit ?? '∞'}`,
    period: `${new Intl.DateTimeFormat('vi-VN').format(new Date(promotion.startsAt))}–${new Intl.DateTimeFormat('vi-VN').format(new Date(promotion.endsAt))}`,
    effectiveStatus:
      promotion.status !== 'active'
        ? promotion.status
        : promotion.startsAt > now
          ? 'scheduled'
          : promotion.endsAt < now
            ? 'archived'
            : 'active',
  }));
}

export async function getDashboardData() {
  const [overview, metrics, inventory, orders] = await Promise.all([
    commerceServerRequest<{
      kpis: {
        netRevenueCents: number;
        orders: number;
        paidOrders: number;
        averageOrderValueCents: number;
        paidCustomers: number;
      };
      salesDaily: { netRevenueCents: number }[];
    }>('/admin/reports/overview'),
    commerceServerRequest<{
      orders30d: number;
      revenue30dCents: number;
      lowStock: number;
      newCustomers30d: number;
    }>('/admin/metrics'),
    commerceServerRequest<{
      summary: { lowStock: number };
      items: {
        sku: string;
        product: string;
        size: string;
        color: string;
        onHand: number;
        reserved: number;
        available: number;
        reorderPoint: number;
      }[];
    }>('/admin/inventory'),
    getBackofficeOrders(8),
  ]);

  const dashboardMetrics = [
    {
      label: 'Doanh thu 30 ngày',
      value: formatVnd(Number(metrics.revenue30dCents)),
      delta: '30 ngày',
      tone: 'accent',
    },
    {
      label: 'Đơn hàng',
      value: new Intl.NumberFormat('vi-VN').format(metrics.orders30d),
      delta: `${overview.kpis.paidOrders} đã thu`,
      tone: 'primary',
    },
    {
      label: 'Khách mới',
      value: new Intl.NumberFormat('vi-VN').format(metrics.newCustomers30d),
      delta: '30 ngày',
      tone: 'primary',
    },
    {
      label: 'Giá trị đơn TB',
      value: formatVnd(Number(overview.kpis.averageOrderValueCents)),
      delta: 'Đơn đã thu',
      tone: 'primary',
    },
  ];

  const revenueSeries = overview.salesDaily
    .slice(-12)
    .map((item) => Math.round((Number(item.netRevenueCents) / 1_000_000) * 10) / 10);
  while (revenueSeries.length < 12) revenueSeries.unshift(0);

  return {
    metrics: dashboardMetrics,
    revenueSeries,
    lowStock: inventory.items
      .filter((item) => item.available <= item.reorderPoint)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        variant: `${item.color} / ${item.size}`,
        reorder: item.reorderPoint,
      })),
    orders,
  };
}

function formatDateTime(value: number) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
