export const dashboardMetrics = [
  {
    label: 'Doanh thu 30 ngày',
    value: '486,2 tr',
    delta: '+18,4%',
    tone: 'accent',
  },
  { label: 'Đơn hàng', value: '748', delta: '+12,1%', tone: 'primary' },
  {
    label: 'Tỷ lệ chuyển đổi',
    value: '3,42%',
    delta: '+0,38đ',
    tone: 'primary',
  },
  { label: 'Giá trị đơn TB', value: '650K', delta: '+4,7%', tone: 'primary' },
];

export const revenueSeries = [
  42, 58, 51, 74, 68, 88, 82, 96, 78, 104, 112, 128,
];

export const adminOrders = [
  {
    id: 'ord-001',
    number: 'NET-260831-A82F1C',
    customer: 'Nguyễn Minh Anh',
    email: 'minhanh@example.com',
    total: 2_080_000,
    status: 'processing',
    payment: 'paid',
    createdAt: '31/08/2026 · 09:42',
  },
  {
    id: 'ord-002',
    number: 'NET-260831-B17D4A',
    customer: 'Trần Quốc Nam',
    email: 'quocnam@example.com',
    total: 1_540_000,
    status: 'confirmed',
    payment: 'cod_pending',
    createdAt: '31/08/2026 · 09:18',
  },
  {
    id: 'ord-003',
    number: 'NET-260831-C94E2B',
    customer: 'Lê Hải Yến',
    email: 'haiyen@example.com',
    total: 890_000,
    status: 'ready_to_ship',
    payment: 'paid',
    createdAt: '31/08/2026 · 08:55',
  },
  {
    id: 'ord-004',
    number: 'NET-260830-D11A7E',
    customer: 'Phạm Tuấn Vũ',
    email: 'tuanvu@example.com',
    total: 690_000,
    status: 'shipped',
    payment: 'paid',
    createdAt: '30/08/2026 · 21:06',
  },
  {
    id: 'ord-005',
    number: 'NET-260830-E62B8F',
    customer: 'Đặng Khánh Linh',
    email: 'khanhlinh@example.com',
    total: 2_980_000,
    status: 'pending_payment',
    payment: 'pending',
    createdAt: '30/08/2026 · 20:34',
  },
];

export const inventoryRows = [
  {
    sku: 'NET-ALM-S',
    product: 'Áo linen cổ V Mộc',
    variant: 'Đất nung / S',
    onHand: 18,
    reserved: 4,
    safety: 2,
    reorder: 5,
  },
  {
    sku: 'NET-ALM-M',
    product: 'Áo linen cổ V Mộc',
    variant: 'Đất nung / M',
    onHand: 8,
    reserved: 3,
    safety: 2,
    reorder: 5,
  },
  {
    sku: 'NET-DMA-M',
    product: 'Đầm midi An',
    variant: 'Xanh rừng / M',
    onHand: 5,
    reserved: 2,
    safety: 2,
    reorder: 5,
  },
  {
    sku: 'NET-SMT-L',
    product: 'Sơ mi resort Trầm',
    variant: 'Than / L',
    onHand: 4,
    reserved: 1,
    safety: 2,
    reorder: 5,
  },
  {
    sku: 'NET-QCV-M',
    product: 'Quần chinos Vững',
    variant: 'Cát / M',
    onHand: 16,
    reserved: 5,
    safety: 2,
    reorder: 5,
  },
];

export const customers = [
  {
    name: 'Nguyễn Minh Anh',
    email: 'minhanh@example.com',
    orders: 8,
    spent: 7_920_000,
    segment: 'VIP',
    lastOrder: '31/08/2026',
  },
  {
    name: 'Lê Hải Yến',
    email: 'haiyen@example.com',
    orders: 5,
    spent: 4_650_000,
    segment: 'Trung thành',
    lastOrder: '31/08/2026',
  },
  {
    name: 'Trần Quốc Nam',
    email: 'quocnam@example.com',
    orders: 2,
    spent: 2_230_000,
    segment: 'Mới',
    lastOrder: '31/08/2026',
  },
  {
    name: 'Phạm Tuấn Vũ',
    email: 'tuanvu@example.com',
    orders: 4,
    spent: 3_480_000,
    segment: 'Trung thành',
    lastOrder: '30/08/2026',
  },
];

export const promotions = [
  {
    name: 'Chào NÉT',
    code: 'CHAONET',
    type: 'Giảm 10%',
    usage: '284 / 1.000',
    period: '01/08–31/12/2026',
    status: 'active',
  },
  {
    name: 'Miễn phí giao hàng',
    code: 'FREESHIP',
    type: 'Tối đa 35K',
    usage: '621 / 2.000',
    period: '01/08–30/09/2026',
    status: 'active',
  },
  {
    name: 'Mid-season',
    code: 'MID20',
    type: 'Giảm 20%',
    usage: '—',
    period: '15/09–22/09/2026',
    status: 'scheduled',
  },
];

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_payment: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    ready_to_ship: 'Chờ lấy hàng',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
    returned: 'Hoàn trả',
    failed: 'Giao thất bại',
    fulfilled: 'Hoàn tất giao hàng',
    partially_fulfilled: 'Giao một phần',
    reserved: 'Đã giữ tồn',
    disabled: 'Đã khóa',
    pending: 'Chờ xử lý',
    paid: 'Đã thanh toán',
    cod_pending: 'COD',
    active: 'Đang chạy',
    scheduled: 'Đã lên lịch',
    draft: 'Bản nháp',
    archived: 'Lưu trữ',
  };
  return labels[status] ?? status;
}
