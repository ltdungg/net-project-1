export const FULFILLMENT_STATUSES = [
  'pending',
  'processing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'failed',
  'returned',
  'cancelled',
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const fulfillmentLabels = {
  pending: 'Chờ xử lý',
  processing: 'Đang chuẩn bị',
  ready_to_ship: 'Sẵn sàng bàn giao',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  failed: 'Giao thất bại',
  returned: 'Hoàn về',
  cancelled: 'Đã hủy',
} satisfies Record<FulfillmentStatus, string>;

export type FulfillmentSummary = {
  id: string;
  shipmentNumber: string;
  status: FulfillmentStatus;
  carrier: string | null;
  serviceCode: string | null;
  trackingNumber: string | null;
  deliveryAttempts: number;
  lastFailureReason: string | null;
  version: number;
  estimatedDeliveryAt: number | null;
  updatedAt: number;
  orderId: string;
  orderNumber: string;
  email: string;
  phone: string;
  paymentStatus: string;
  grandTotalCents: number;
  warehouseCode: string | null;
  warehouseName: string | null;
  totalQuantity: number;
};

export type FulfillmentPage = {
  items: FulfillmentSummary[];
  summary: {
    total: number;
    waiting: number;
    readyToShip: number;
    inTransit: number;
    exceptions: number;
    deliveredToday: number;
  };
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type FulfillmentDetail = Omit<FulfillmentSummary, 'totalQuantity'> & {
  orderStatus: string;
  fulfillmentStatus: string;
  warehouseId: string | null;
  providerReference: string | null;
  shippingCostCents: number;
  address: {
    recipientName?: string;
    phone?: string;
    line1?: string;
    ward?: string | null;
    district?: string;
    province?: string;
  } | null;
  shippedAt: number | null;
  deliveredAt: number | null;
  notes: string | null;
  createdAt: number;
  items: Array<{
    id: string;
    sku: string;
    productName: string;
    variantName: string;
    imageUrl: string | null;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    reservationStatus: string | null;
  }>;
  events: Array<{
    id: string;
    fromStatus: FulfillmentStatus | null;
    toStatus: FulfillmentStatus;
    reason: string | null;
    actorUserId: string | null;
    metadata: unknown;
    createdAt: number;
  }>;
  nextStatuses: FulfillmentStatus[];
};
