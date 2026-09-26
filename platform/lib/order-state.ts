export const orderTransitions: Record<string, string[]> = {
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export function canTransition(from: string, to: string) {
  return orderTransitions[from]?.includes(to) ?? false;
}

export function calculateOrderTotals(subtotalCents: number, discountCents = 0) {
  const shippingCents = subtotalCents - discountCents >= 799_000 ? 0 : 35_000;
  const grandTotalCents =
    Math.max(0, subtotalCents - discountCents) + shippingCents;
  return { subtotalCents, discountCents, shippingCents, grandTotalCents };
}
