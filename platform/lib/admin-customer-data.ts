import { commerceServerRequest } from '@/lib/commerce-api-server';

export const CUSTOMER_SEGMENTS = [
  'at_risk',
  'vip',
  'loyal',
  'new',
  'potential',
  'prospect',
] as const;

export type CustomerSegmentCode = (typeof CUSTOMER_SEGMENTS)[number];
export type CustomerStatus = 'active' | 'disabled' | 'pending';

export const customerStatusLabels: Record<CustomerStatus, string> = {
  active: 'Đang hoạt động',
  disabled: 'Đã vô hiệu hóa',
  pending: 'Chờ xác minh',
};

export type CustomerSummary = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  status: CustomerStatus;
  marketingConsent: boolean;
  lastLoginAt: number | null;
  createdAt: number;
  totalOrders: number;
  paidOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenueCents: number;
  lastOrderAt: number | null;
  lastPaidOrderAt: number | null;
  segmentCode: CustomerSegmentCode;
  segmentLabel: string;
};

export type CustomerPage = {
  items: CustomerSummary[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type SegmentSummary = {
  code: CustomerSegmentCode;
  label: string;
  description: string;
  customers: number;
  revenueCents: number;
  paidOrders: number;
};

export type SegmentDashboard = {
  items: SegmentSummary[];
  totalCustomers: number;
  calculatedAt: number;
  ruleVersion: string;
};

export type CustomerDetail = {
  profile: {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    status: CustomerStatus;
    marketingConsent: boolean;
    lastLoginAt: number | null;
    createdAt: number;
    updatedAt: number;
    roles: string[];
  };
  segment: {
    code: CustomerSegmentCode;
    label: string;
    description: string;
    calculatedAt: number;
    ruleVersion: string;
  };
  addresses: {
    items: Array<{
      id: string;
      label: string;
      recipientName: string;
      phone: string;
      line1: string;
      ward: string | null;
      district: string;
      province: string;
      postalCode: string | null;
      isDefault: boolean;
    }>;
    total: number;
  };
  statistics: {
    totalOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    paidOrders: number;
    totalRevenueCents: number;
    averageOrderValueCents: number;
    lastOrderAt: number | null;
    lastPaidOrderAt: number | null;
  };
  orderHistory: {
    items: Array<{
      id: string;
      orderNumber: string;
      status: string;
      paymentStatus: string;
      fulfillmentStatus: string;
      grandTotalCents: number;
      placedAt: number | null;
      createdAt: number;
    }>;
    total: number;
  };
};

export async function getCustomerDirectory(options: {
  search?: string;
  status?: string;
  segment?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const query = new URLSearchParams();
  if (options.search) query.set('search', options.search);
  if (options.status) query.set('status', options.status);
  if (options.segment) query.set('segment', options.segment);
  query.set('limit', String(Math.min(100, Math.max(1, options.limit ?? 25))));
  query.set('offset', String(Math.max(0, options.offset ?? 0)));
  return commerceServerRequest<CustomerPage>(`/admin/customers?${query}`);
}

export function getCustomerSegments() {
  return commerceServerRequest<SegmentDashboard>('/admin/customers/segments');
}

export function getAdminCustomer(id: string) {
  return commerceServerRequest<CustomerDetail>(
    `/admin/customers/${encodeURIComponent(id)}`,
  );
}
