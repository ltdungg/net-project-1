export type PaymentConfig = {
  provider: 'mockpay';
  mockEnabled: boolean;
  sepaySandboxEnabled: boolean;
};
export type SepayPaymentState = {
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  expired: boolean;
  expiresAt: string;
  checkedAt: string;
};
export type SepayPaymentSession = SepayPaymentState & {
  provider: 'sepay_sandbox';
  amountVnd: number;
  transferContent: string;
  qrUrl: string;
  bank: { name: string; accountNumber: string; accountHolder: string };
};

/** Guest tokens belong in a header, never in URLs, browser history or referrers. */
export function orderAccess(
  orderId: string,
  guestToken: string,
  signedIn: boolean,
) {
  const path = `/orders/${encodeURIComponent(orderId)}`;
  if (guestToken)
    return {
      path: `${path}/guest`,
      headers: { 'x-guest-order-token': guestToken },
    };
  return signedIn ? { path, headers: undefined } : null;
}

export function paymentStatusLabel(status: string) {
  return (
    (
      {
        pending: 'Chờ thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thanh toán thất bại',
        refunded: 'Đã hoàn tiền',
        cod_pending: 'Thanh toán khi nhận hàng',
        cancelled: 'Đã hủy',
      } as Record<string, string>
    )[status] ?? status
  );
}
