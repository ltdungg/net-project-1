// Explicit, local-only demo data. Never runs as a Flyway migration or on startup.
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const backend = resolve(here, '..');
const args = process.argv.slice(2);
const option = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const project = option('--project');
if (!project || !/^[a-z0-9][a-z0-9_-]+$/.test(project)) {
  console.error('Usage: node scripts/seed-demo.mjs --project <compose-project> [--context default] [--verify]');
  process.exit(1);
}
const context = option('--context') ?? 'default';
const compose = ['--context', context, 'compose', '-p', project];
function docker(command, input) {
  const result = spawnSync('docker', [...compose, ...command], {
    cwd: backend, input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Docker command failed');
  return result.stdout.trim();
}
function sql(query) {
  return docker(['exec', '-T', 'postgres', 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', 'net', '-d', 'net_commerce'], query);
}
const runtimeEnv = docker(['exec', '-T', 'api', 'printenv', 'APP_ENV']);
if (runtimeEnv !== 'local') throw new Error(`Refusing to seed APP_ENV=${runtimeEnv}; only local is supported.`);
const verifySql = readFileSync(resolve(here, 'verify-demo.sql'), 'utf8');
if (args.includes('--verify')) {
  console.log(sql(verifySql));
  process.exit(0);
}
if (sql("SELECT count(*) FROM audit_logs WHERE id='demo-v1-seeded';") === '1') {
  console.log('Demo data already exists; no records or passwords were changed.');
  console.log(sql(verifySql));
  process.exit(0);
}
const variants = JSON.parse(sql(`SELECT json_agg(v ORDER BY v.product_id,v.id) FROM (
  SELECT pv.id,pv.product_id,pv.sku,pv.size,pv.color,pv.price_cents,p.name,
    (SELECT public_url FROM product_media WHERE product_id=p.id ORDER BY sort_order,id LIMIT 1) image_url
  FROM product_variants pv JOIN products p ON p.id=pv.product_id
  WHERE pv.status='active' AND p.status='active'
) v;`));
if (!variants || variants.length < 10) throw new Error('Run the catalog migrations before seeding demo data.');
const backupDir = resolve(backend, '../work/demo-data');
mkdirSync(backupDir, { recursive: true });
const backupPath = resolve(backupDir, `before-demo-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`);
writeFileSync(backupPath, docker(['exec', '-T', 'postgres', 'pg_dump', '-U', 'net', '-d', 'net_commerce', '--no-owner', '--no-acl']), 'utf8');
console.log(`Database backup: ${backupPath}`);

const now = Date.now();
const day = 86400000;
const hour = 3600000;
const stamp = (time) => new Date(time).toISOString();
const id = (kind, number) => `demo-v1-${kind}-${String(number).padStart(3, '0')}`;
const quote = (value) => value == null ? 'NULL' : typeof value === 'number' ? String(value)
  : typeof value === 'boolean' ? String(value) : `'${String(value).replaceAll("'", "''")}'`;
const statements = [];
const insert = (table, row) => statements.push(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.values(row).map(quote).join(',')});`);
const json = JSON.stringify;
// BCrypt cost 12, for the documented local fixture password NetDemo2026! only.
const passwordHash = '$2a$12$../PaltV0EtIbr5nOobIrOI0Mt28LPAlbPIwV/Ej.Ua4DfoIXDmrO';
const names = ['Nguyễn Minh Anh', 'Trần Bảo Ngọc', 'Lê Quốc Huy', 'Phạm Thu Hà', 'Hoàng Gia Linh', 'Vũ Đức Minh',
  'Đặng Phương Thảo', 'Bùi Tuấn Kiệt', 'Đỗ Thanh Mai', 'Hồ Nhật Nam', 'Ngô Khánh Vy', 'Dương Hải Đăng',
  'Lý Ngọc Hân', 'Mai Thành Đạt', 'Phan Quỳnh Chi', 'Võ Anh Khoa', 'Nguyễn Yến Nhi', 'Trần Minh Châu',
  'Lê Hoàng Phúc', 'Phạm Tú Anh', 'Hoàng Bảo Trâm', 'Vũ Trung Hiếu', 'Đặng Thùy Dương', 'Bùi Quang Vinh'];
const locations = [
  { city: 'Thành phố Hồ Chí Minh', district: 'Quận 3', ward: 'Phường Võ Thị Sáu' },
  { city: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng' },
  { city: 'Đà Nẵng', district: 'Hải Châu', ward: 'Hòa Cường Bắc' },
  { city: 'Cần Thơ', district: 'Ninh Kiều', ward: 'An Khánh' },
];
const customers = names.map((name, i) => ({
  id: id('customer', i + 1), email: `customer${String(i + 1).padStart(2, '0')}@example.test`,
  full_name: name, phone: `090000${String(i + 1).padStart(4, '0')}`,
  created: now - (i >= 16 && i < 20 ? 7 + i % 4 : 170 + i) * day,
  ...locations[i % locations.length],
}));
const employees = [
  { id: id('admin', 1), email: 'demo.admin@example.test', full_name: 'Quản trị cửa hàng', roles: ['customer', 'staff', 'manager', 'admin'] },
  { id: id('manager', 1), email: 'demo.manager@example.test', full_name: 'Quản lý kinh doanh', roles: ['customer', 'staff', 'manager'] },
  { id: id('staff', 1), email: 'demo.staff@example.test', full_name: 'Nhân viên vận hành', roles: ['customer', 'staff'] },
];
for (const person of [...employees, ...customers]) {
  const created = stamp(person.created ?? now - 200 * day);
  insert('users', { id: person.id, email: person.email, password_hash: passwordHash, full_name: person.full_name,
    phone: person.phone ?? '0900000099', status: 'active', marketing_consent: false,
    email_verified_at: created, created_at: created, updated_at: created });
  for (const role of person.roles ?? ['customer']) insert('user_roles', { user_id: person.id, role_id: `role-${role}`, assigned_at: created });
}
const address = (c) => ({ recipientName: c.full_name, phone: c.phone,
  line1: `${12 + customers.indexOf(c) * 3} Đường Hoa Ban`, ward: c.ward, district: c.district, province: c.city });
for (const c of customers) insert('addresses', {
  id: id('address', customers.indexOf(c) + 1), user_id: c.id, label: 'Nhà riêng', recipient_name: c.full_name,
  phone: c.phone, line1: address(c).line1, ward: c.ward, district: c.district, city: c.city,
  is_default: true, created_at: stamp(c.created), updated_at: stamp(c.created),
});

const warehouse = 'demo-v1-warehouse';
insert('warehouses', { id: warehouse, code: 'HCM-DEMO', name: 'Kho trải nghiệm TP.HCM', address: 'Khu kho vận mẫu, Thành phố Hồ Chí Minh', status: 'active' });
insert('inventory_operations', { id: 'demo-v1-receipt', operation_number: 'DEMO-NK-001', type: 'receipt', status: 'posted',
  destination_warehouse_id: warehouse, reference_number: 'DEMO-NCC-001', idempotency_key: 'demo-v1-receipt',
  reason: 'Nhập hàng ban đầu cho bộ dữ liệu mẫu', created_by: employees[0].id, posted_by: employees[0].id,
  posted_at: stamp(now - 160 * day), created_at: stamp(now - 160 * day), updated_at: stamp(now - 160 * day) });
const inventory = new Map();
variants.forEach((v, i) => {
  const entry = { id: id('inventory', i + 1), onHand: 160, reserved: 0 };
  inventory.set(v.id, entry);
  insert('inventory_items', { id: entry.id, warehouse_id: warehouse, variant_id: v.id, on_hand: 160, reserved: 0,
    safety_stock: 2, reorder_point: 5, version: 1, created_at: stamp(now - 160 * day), updated_at: stamp(now - 160 * day) });
  insert('inventory_operation_items', { id: id('receipt-line', i + 1), operation_id: 'demo-v1-receipt', variant_id: v.id,
    destination_inventory_item_id: entry.id, quantity: 160, unit_cost_cents: Math.round(v.price_cents * 0.45), created_at: stamp(now - 160 * day) });
  insert('inventory_movements', { id: id('receipt-movement', i + 1), inventory_item_id: entry.id, type: 'receipt', quantity_delta: 160,
    balance_after: 160, reference_type: 'inventory_operation', reference_id: 'demo-v1-receipt', reason: 'Nhập hàng mẫu',
    idempotency_key: id('receipt-movement', i + 1), actor_user_id: employees[0].id, created_at: stamp(now - 160 * day) });
});

const promos = [
  { key: 'welcome', name: 'Ưu đãi khách hàng mới', code: 'DEMO10', type: 'percentage', value: 10, min: 500000, cap: 150000, status: 'active' },
  { key: 'weekend', name: 'Hẹn cuối tuần', code: 'DEMO100', type: 'fixed', value: 100000, min: 999000, cap: null, status: 'active' },
  { key: 'shipping', name: 'Giao hàng tận nhà', code: 'DEMOSHIP', type: 'free_shipping', value: 0, min: 0, cap: null, status: 'active' },
  { key: 'past', name: 'Mùa hè vừa qua', code: 'DEMOHE', type: 'percentage', value: 15, min: 800000, cap: 200000, status: 'expired' },
];
for (const p of promos) {
  insert('promotions', { id: `demo-v1-promo-${p.key}`, name: p.name, description: 'Chương trình trong bộ dữ liệu mẫu',
    type: p.type, value: p.value, min_subtotal_cents: p.min, max_discount_cents: p.cap, usage_limit: 1000,
    starts_at: stamp(now - 150 * day), ends_at: stamp(now + (p.status === 'expired' ? -30 : 90) * day), status: p.status });
  insert('coupons', { id: `demo-v1-coupon-${p.key}`, promotion_id: `demo-v1-promo-${p.key}`, code: p.code,
    usage_limit: 1000, usage_limit_per_customer: 20, status: p.status });
}

// Six customer segments: VIP, loyal, potential, at risk, new and prospect.
const orders = [];
for (let c = 0; c < 16; c++) {
  const count = c < 4 ? 8 : c < 8 ? 2 : 1;
  for (let repeat = 0; repeat < count; repeat++) {
    const n = orders.length + 1;
    orders.push({ n, c, state: 'delivered', created: now - (c >= 12 ? 105 + c : 5 + (n * 7) % 60) * day,
      method: n % 3 === 0 ? 'cod' : 'online', simple: c >= 4 });
  }
}
const states = ['confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded', 'pending_payment', 'cancelled', 'shipped', 'processing'];
for (let j = 0; j < 24; j++) {
  const slot = j % 12;
  orders.push({ n: orders.length + 1,
    c: j < 4 ? 16 + j : slot === 8 || slot === 9 ? 20 + (j >= 12 ? 2 : 0) + slot - 8 : j % 8,
    state: states[slot], created: now - (slot === 8 ? 0.015 : 1 + j % 9) * day,
    method: j < 4 || slot === 10 || slot === 11 ? 'cod' : 'online',
    failed: slot === 9, deliveryFailed: slot === 10, simple: false });
}
const productChoices = [...new Map(variants.map(v => [v.product_id, v])).values()];
const cheapChoices = variants.filter(v => v.price_cents <= 890000);
if (cheapChoices.length < 2) throw new Error('Demo segmentation needs at least two variants under 890,000 VND.');
const stateHours = { pending: 0, pending_payment: 0, confirmed: 0, processing: 1,
  ready_to_ship: 2, shipped: 3, delivered: 6, returned: 7, refunded: 8, failed: 7, cancelled: 8 };

for (const o of orders.sort((a, b) => a.created - b.created)) {
  const c = customers[o.c];
  const oid = id('order', o.n);
  const fid = id('fulfillment', o.n);
  const shipped = ['shipped', 'delivered', 'returned', 'refunded'].includes(o.state);
  const cancelled = o.state === 'cancelled';
  const pending = o.state === 'pending_payment';
  const paymentStatus = o.state === 'refunded' ? 'refunded' : cancelled ? (o.failed ? 'failed' : 'cancelled')
    : pending ? 'pending' : o.method === 'cod' && o.state !== 'delivered' ? 'cod_pending' : 'paid';
  const fulfillmentState = o.deliveryFailed ? 'failed' : o.state === 'refunded' ? 'returned'
    : ['confirmed', 'pending_payment'].includes(o.state) ? 'pending' : o.state;
  const orderState = o.deliveryFailed ? 'processing' : o.state;
  const fulfillStatus = cancelled ? 'cancelled' : ['returned', 'refunded'].includes(o.state) ? 'returned'
    : o.state === 'delivered' ? 'fulfilled' : o.deliveryFailed ? 'reserved' : shipped ? 'shipped' : 'reserved';
  const choices = o.simple ? cheapChoices : productChoices;
  const lines = [{ v: choices[(o.n * 3) % choices.length], qty: 1 }];
  if (!o.simple && o.n % 3 !== 0) lines.push({ v: productChoices[(o.n * 3 + 5) % productChoices.length], qty: o.n % 4 === 0 ? 2 : 1 });
  const subtotal = lines.reduce((sum, l) => sum + l.v.price_cents * l.qty, 0);
  const discounted = o.n % 4 === 0 && subtotal >= promos[0].min && !cancelled;
  const discount = discounted ? Math.min(Math.floor(subtotal * 0.1), 150000) : 0;
  const shipping = subtotal >= 799000 ? 0 : 35000;
  const total = subtotal - discount + shipping;
  const finished = pending ? o.created : o.created + 8 * hour;
  insert('customer_orders', { id: oid, order_number: `NET-DEMO-${String(o.n).padStart(4, '0')}`, user_id: c.id,
    email: c.email, phone: c.phone, status: orderState, payment_status: paymentStatus, fulfillment_status: fulfillStatus,
    subtotal_cents: subtotal, discount_total_cents: discount, shipping_total_cents: shipping, tax_total_cents: 0,
    grand_total_cents: total, shipping_address_json: json(address(c)), customer_note: o.n % 5 === 0 ? 'Vui lòng gọi trước khi giao hàng.' : null,
    source: 'web', placed_at: stamp(o.created), cancelled_at: cancelled ? stamp(finished) : null,
    created_at: stamp(o.created), updated_at: stamp(finished), idempotency_key: oid });
  insert('payments', { id: id('payment', o.n), order_id: oid, provider: o.method === 'cod' ? 'cod' : 'mockpay', method: o.method,
    status: paymentStatus === 'paid' ? 'succeeded' : paymentStatus === 'cod_pending' ? 'pending' : paymentStatus,
    amount_cents: total, idempotency_key: id('payment', o.n),
    failure_code: o.failed ? 'DEMO_DECLINED' : null, failure_message: o.failed ? 'Giao dịch mẫu bị từ chối' : null,
    captured_at: ['paid', 'refunded'].includes(paymentStatus) ? stamp(o.created + (o.method === 'cod' ? 6 * hour : 60000)) : null,
    provider_metadata_json: json({ demo: true }), created_at: stamp(o.created), updated_at: stamp(finished) });
  if (['paid', 'refunded', 'failed'].includes(paymentStatus)) insert('payment_events', { id: id('payment-event', o.n),
    payment_id: id('payment', o.n), provider: o.method === 'cod' ? 'cod' : 'mockpay', provider_event_id: id('payment-event', o.n),
    event_type: paymentStatus === 'paid' ? 'payment.succeeded' : `payment.${paymentStatus}`, signature_valid: false,
    payload_json: json({ demo: true, orderId: oid }), processed_at: stamp(finished), created_at: stamp(finished) });
  insert('fulfillments', { id: fid, shipment_number: `SHP-DEMO-${String(o.n).padStart(4, '0')}`, order_id: oid, warehouse_id: warehouse,
    status: fulfillmentState, carrier: shipped || o.state === 'ready_to_ship' ? 'Giao hàng nội địa' : null,
    tracking_number: shipped || o.state === 'ready_to_ship' ? `DEMO${String(o.n).padStart(10, '0')}` : null,
    shipping_cost_cents: 25000, address_snapshot_json: json(address(c)), estimated_delivery_at: cancelled ? null : stamp(o.created + 3 * day),
    shipped_at: shipped ? stamp(o.created + 3 * hour) : null, delivered_at: o.state === 'delivered' ? stamp(o.created + 6 * hour) : null,
    delivery_attempts: o.state === 'delivered' || o.deliveryFailed ? 1 : 0,
    last_failure_reason: o.deliveryFailed ? 'Khách hẹn giao lại vào ngày hôm sau.' : null,
    idempotency_key: fid, version: 1, created_at: stamp(o.created), updated_at: stamp(finished) });
  const orderTimeline = pending ? ['pending_payment'] : cancelled ? ['pending_payment', 'cancelled']
    : ['confirmed', ...(!['confirmed'].includes(o.state) ? ['processing'] : []),
      ...(['ready_to_ship', 'shipped', 'delivered', 'returned', 'refunded'].includes(o.state) ? ['ready_to_ship'] : []),
      ...(shipped ? ['shipped'] : []), ...(o.state === 'delivered' ? ['delivered'] : []),
      ...(['returned', 'refunded'].includes(o.state) ? ['returned'] : []), ...(o.state === 'refunded' ? ['refunded'] : []),
      ...(o.deliveryFailed ? ['processing'] : [])];
  orderTimeline.forEach((state, i) => insert('order_status_history', { id: `${oid}-h${i}`, order_id: oid,
    from_status: i === 0 ? null : orderTimeline[i - 1], to_status: state,
    reason: 'Lịch sử đơn hàng mẫu', actor_user_id: i === 0 ? c.id : employees[2].id,
    created_at: stamp(o.created + (o.deliveryFailed && i === orderTimeline.length - 1 ? 7 : stateHours[state]) * hour) }));
  const fulfillmentTimeline = ['pending', ...(!['confirmed', 'pending_payment', 'cancelled'].includes(o.state) ? ['processing'] : []),
    ...(['ready_to_ship', 'shipped', 'delivered', 'returned', 'refunded'].includes(o.state) ? ['ready_to_ship'] : []),
    ...(shipped ? ['shipped'] : []), ...(o.state === 'delivered' ? ['delivered'] : []),
    ...(['returned', 'refunded'].includes(o.state) ? ['returned'] : []), ...(cancelled ? ['cancelled'] : []), ...(o.deliveryFailed ? ['failed'] : [])];
  fulfillmentTimeline.forEach((state, i) => insert('fulfillment_events', { id: `${fid}-h${i}`, fulfillment_id: fid,
    from_status: i === 0 ? null : fulfillmentTimeline[i - 1], to_status: state,
    reason: state === 'failed' ? 'Khách hẹn giao lại.' : 'Lịch sử vận chuyển mẫu', actor_user_id: employees[2].id,
    created_at: stamp(o.created + stateHours[state] * hour) }));
  lines.forEach(({ v, qty }, i) => {
    const lineId = `${oid}-i${i}`;
    const reservationId = `${oid}-r${i}`;
    const stock = inventory.get(v.id);
    if (shipped) stock.onHand -= qty;
    else if (!cancelled) stock.reserved += qty;
    insert('order_items', { id: lineId, order_id: oid, variant_id: v.id, sku: v.sku, product_name: v.name,
      variant_name: `${v.color} / ${v.size}`, image_url: v.image_url, quantity: qty,
      unit_price_cents: v.price_cents, total_cents: v.price_cents * qty, created_at: stamp(o.created) });
    insert('inventory_reservations', { id: reservationId, inventory_item_id: stock.id, order_id: oid, quantity: qty,
      status: shipped ? 'consumed' : cancelled ? 'released' : 'active',
      expires_at: stamp(o.created + (pending ? 2 * hour : 30 * day)),
      released_at: shipped ? stamp(o.created + 3 * hour) : cancelled ? stamp(finished) : null, created_at: stamp(o.created) });
    insert('fulfillment_items', { id: `${fid}-i${i}`, fulfillment_id: fid, order_item_id: lineId, reservation_id: reservationId, quantity: qty, created_at: stamp(o.created) });
    insert('inventory_movements', { id: `${oid}-m${i}`, inventory_item_id: stock.id, type: shipped ? 'sale' : cancelled ? 'release' : 'reservation',
      quantity_delta: shipped ? -qty : 0, balance_after: stock.onHand, reference_type: 'fulfillment', reference_id: fid,
      reason: shipped ? 'Xuất hàng theo đơn mẫu' : cancelled ? 'Giải phóng tồn đơn hủy' : 'Giữ hàng cho đơn mẫu',
      idempotency_key: `${oid}-m${i}`, actor_user_id: employees[2].id, created_at: stamp(o.created + (shipped ? 3 * hour : 0)) });
  });
  if (discounted) insert('order_promotions', { id: `${oid}-promo`, order_id: oid, promotion_id: 'demo-v1-promo-welcome',
    coupon_id: 'demo-v1-coupon-welcome', name_snapshot: 'Ưu đãi khách hàng mới (DEMO10)', discount_cents: discount, created_at: stamp(o.created) });
}

// Keep stock ledger and reservations reconcilable, including six low-stock cases.
insert('inventory_operations', { id: 'demo-v1-stocktake', operation_number: 'DEMO-KK-001', type: 'stocktake', status: 'posted',
  source_warehouse_id: warehouse, idempotency_key: 'demo-v1-stocktake', reason: 'Kiểm kê dữ liệu mẫu cho cảnh báo nhập hàng',
  created_by: employees[0].id, posted_by: employees[0].id, posted_at: stamp(now), created_at: stamp(now), updated_at: stamp(now) });
variants.forEach((v, i) => {
  const stock = inventory.get(v.id);
  if (i < 6) {
    const actual = stock.reserved + i;
    insert('inventory_operation_items', { id: id('stocktake-line', i + 1), operation_id: 'demo-v1-stocktake', variant_id: v.id,
      source_inventory_item_id: stock.id, quantity: actual - stock.onHand, expected_quantity: stock.onHand,
      actual_quantity: actual, variance: actual - stock.onHand, note: 'Tình huống tồn kho thấp', created_at: stamp(now) });
    insert('inventory_movements', { id: id('stocktake-movement', i + 1), inventory_item_id: stock.id, type: 'stocktake',
      quantity_delta: actual - stock.onHand, balance_after: actual, reference_type: 'inventory_operation', reference_id: 'demo-v1-stocktake',
      reason: 'Điều chỉnh kiểm kê mẫu', idempotency_key: id('stocktake-movement', i + 1), actor_user_id: employees[0].id, created_at: stamp(now) });
    stock.onHand = actual;
  }
  statements.push(`UPDATE inventory_items SET on_hand=${stock.onHand},reserved=${stock.reserved},version=version+1,updated_at=${quote(stamp(now))} WHERE id=${quote(stock.id)};`);
});
statements.push(`UPDATE promotions SET usage_count=(SELECT count(*) FROM order_promotions WHERE promotion_id='demo-v1-promo-welcome') WHERE id='demo-v1-promo-welcome';`);
statements.push(`UPDATE coupons SET usage_count=(SELECT count(*) FROM order_promotions WHERE coupon_id='demo-v1-coupon-welcome') WHERE id='demo-v1-coupon-welcome';`);
customers.forEach((c, i) => {
  for (let j = 0; j < 3; j++) insert('wishlist_items', { user_id: c.id, product_id: productChoices[(i * 3 + j) % productChoices.length].product_id, created_at: stamp(now - (j + 1) * day) });
});
// The application uses a browser cart token; do not seed inaccessible user carts.
for (const employee of employees.slice(0, 2)) {
  insert('admin_ai_dashboards', { id: `${employee.id}-dashboard`, user_id: employee.id, title: 'Kinh doanh 30 ngày', days: 30,
    widgets: json(['revenue', 'orders', 'average_order', 'items_sold', 'sales_daily', 'top_products', 'low_stock']) });
  insert('admin_ai_dashboards', { id: `${employee.id}-stock`, user_id: employee.id, title: 'Bán chạy và nhập hàng', days: 7,
    widgets: json(['top_products', 'items_sold', 'low_stock']) });
}
insert('audit_logs', { id: 'demo-v1-seeded', actor_user_id: employees[0].id, action: 'demo.seeded', entity_type: 'demo_dataset',
  entity_id: 'demo-v1', after_json: json({ customers: 24, employees: 3, orders: 72, warehouse, createdAt: stamp(now) }),
  correlation_id: 'demo-v1-seed' });

// Advisory lock and marker make concurrent and repeated runs harmless.
const transaction = `BEGIN;
SELECT pg_advisory_xact_lock(hashtext('net-demo-v1'));
SELECT EXISTS(SELECT 1 FROM audit_logs WHERE id='demo-v1-seeded') AS already_seeded \\gset
\\if :already_seeded
\\echo Demo data already exists; skipping.
\\else
${statements.join('\n')}
${verifySql}
\\endif
COMMIT;
`;
console.log(sql(transaction));
console.log('Demo accounts: demo.admin@example.test, demo.manager@example.test, demo.staff@example.test, customer01@example.test');
console.log('Local fixture password: NetDemo2026!');
