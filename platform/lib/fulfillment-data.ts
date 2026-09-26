import { commerceServerRequest } from '@/lib/commerce-api-server';
import type {
  FulfillmentDetail,
  FulfillmentPage,
} from '@/lib/fulfillment-contract';

export * from '@/lib/fulfillment-contract';

export async function getFulfillments(options: {
  search?: string;
  status?: string;
  carrier?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const query = new URLSearchParams();
  if (options.search) query.set('search', options.search);
  if (options.status) query.set('status', options.status);
  if (options.carrier) query.set('carrier', options.carrier);
  query.set('limit', String(Math.min(100, Math.max(1, options.limit ?? 25))));
  query.set('offset', String(Math.max(0, options.offset ?? 0)));
  return commerceServerRequest<FulfillmentPage>(
    `/admin/fulfillments?${query}`,
  );
}

export function getFulfillment(id: string) {
  return commerceServerRequest<FulfillmentDetail>(
    `/admin/fulfillments/${encodeURIComponent(id)}`,
  );
}
