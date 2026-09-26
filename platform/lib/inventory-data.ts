import { commerceServerRequest } from '@/lib/commerce-api-server';

export type InventoryWarehouse = {
  id: string;
  code: string;
  name: string;
  address: string | null;
};

export type InventoryRow = {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  variantId: string;
  sku: string;
  product: string;
  size: string;
  color: string;
  onHand: number;
  reserved: number;
  safetyStock: number;
  reorderPoint: number;
  available: number;
  atp: number;
  version: number;
  updatedAt: number;
};

export type InventoryOperationRow = {
  id: string;
  operationNumber: string;
  type: string;
  status: string;
  sourceWarehouse: string | null;
  destinationWarehouse: string | null;
  referenceNumber: string | null;
  reason: string;
  itemCount: number;
  totalQuantity: number;
  postedAt: number | null;
  createdAt: number;
};

export type InventoryMovementRow = {
  id: string;
  sku: string;
  product: string;
  warehouseCode: string;
  type: string;
  quantityDelta: number;
  balanceAfter: number;
  reason: string;
  referenceId: string | null;
  createdAt: number;
};

export type InventoryDashboard = {
  summary: {
    totalOnHand: number;
    totalReserved: number;
    totalAvailable: number;
    totalAtp: number;
    lowStock: number;
    outOfStock: number;
    skuCount: number;
    warehouseCount: number;
  };
  warehouses: InventoryWarehouse[];
  items: InventoryRow[];
  operations: InventoryOperationRow[];
  movements: InventoryMovementRow[];
};

export async function getInventoryDashboard(): Promise<InventoryDashboard> {
  return commerceServerRequest<InventoryDashboard>('/admin/inventory');
}

export function inventoryOperationNumber(type: string, now = new Date()) {
  const prefix: Record<string, string> = {
    receipt: 'RCV',
    transfer: 'TRF',
    stocktake: 'CNT',
    adjustment: 'ADJ',
  };
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  return `${prefix[type] ?? 'INV'}-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export function inventoryTypeLabel(type: string) {
  return {
    receipt: 'Nhập kho',
    transfer: 'Chuyển kho',
    stocktake: 'Kiểm kê',
    adjustment: 'Điều chỉnh',
  }[type] ?? type;
}
