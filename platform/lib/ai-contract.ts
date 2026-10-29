import type { CatalogProduct } from '@/lib/catalog-data';

export type AiMode = 'ai' | 'rules' | 'fallback' | 'saved';
export type Recommendation = { product: CatalogProduct; reason: string };
export type ShopperReply = {
  answer: string;
  items: Recommendation[];
  mode: AiMode;
  generatedAt: string;
};
export const widgetLabels = {
  revenue: 'Doanh thu đã thanh toán',
  orders: 'Tổng đơn hàng',
  average_order: 'Giá trị đơn trung bình',
  items_sold: 'Sản phẩm đã bán',
  sales_daily: 'Doanh thu theo ngày',
  top_products: 'Sản phẩm bán chạy',
  low_stock: 'Tồn kho cần bổ sung',
} as const;
export type WidgetId = keyof typeof widgetLabels;
export type DashboardPlan = {
  title: string;
  days: number;
  widgets: WidgetId[];
};
export type AiDashboard = {
  id?: string;
  plan: DashboardPlan;
  mode: AiMode;
  generatedAt: string;
  lowStock: number;
  report: {
    period: { from: string; to: string; days: number; timeZone: string };
    kpis: {
      netRevenueCents: number;
      orders: number;
      paidOrders: number;
      averageOrderValueCents: number;
      itemsSold: number;
      paidCustomers: number;
    };
    salesDaily: {
      date: string;
      orders: number;
      paidOrders: number;
      netRevenueCents: number;
    }[];
    topProducts: {
      productId: string | null;
      productName: string;
      quantity: number;
      itemRevenueCents: number;
    }[];
  };
};

const RECENT_KEY = 'net:recent-products';
export function recentProductIds(): string[] {
  try {
    const stored: unknown = JSON.parse(
      sessionStorage.getItem(RECENT_KEY) ?? '[]',
    );
    return Array.isArray(stored)
      ? stored
          .filter(
            (id): id is string => typeof id === 'string' && id.length <= 64,
          )
          .slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
export function rememberProduct(id: string) {
  try {
    sessionStorage.setItem(
      RECENT_KEY,
      JSON.stringify(
        [id, ...recentProductIds().filter((item) => item !== id)].slice(0, 20),
      ),
    );
  } catch {
    /* Recommendations also work when browser storage is disabled. */
  }
}
