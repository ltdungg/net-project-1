-- Read-only integrity checks. The same checks run before the seed transaction commits.
DO $$
BEGIN
  IF (SELECT count(*) FROM customer_orders WHERE id LIKE 'demo-v1-order-%') <> 72 THEN
    RAISE EXCEPTION 'Expected 72 demo orders';
  END IF;
  IF (SELECT count(*) FROM users WHERE id LIKE 'demo-v1-%') <> 27 THEN
    RAISE EXCEPTION 'Expected 27 demo users';
  END IF;
  IF EXISTS (
    SELECT 1 FROM customer_orders o
    WHERE o.id LIKE 'demo-v1-order-%' AND (
      o.subtotal_cents <> (SELECT sum(unit_price_cents*quantity) FROM order_items WHERE order_id=o.id)
      OR o.discount_total_cents <> coalesce((SELECT sum(discount_cents) FROM order_promotions WHERE order_id=o.id),0)
      OR o.grand_total_cents <> (SELECT sum(amount_cents) FROM payments WHERE order_id=o.id)
      OR o.grand_total_cents <> o.subtotal_cents-o.discount_total_cents+o.shipping_total_cents+o.tax_total_cents
    )
  ) THEN RAISE EXCEPTION 'Order amounts do not reconcile'; END IF;
  IF EXISTS (
    SELECT 1 FROM inventory_items ii WHERE warehouse_id='demo-v1-warehouse'
    AND (ii.reserved <> coalesce((SELECT sum(quantity) FROM inventory_reservations WHERE inventory_item_id=ii.id AND status='active'),0)
      OR ii.on_hand <> coalesce((SELECT sum(quantity_delta) FROM inventory_movements WHERE inventory_item_id=ii.id),0)
      OR ii.on_hand < ii.reserved)
  ) THEN RAISE EXCEPTION 'Inventory balance or reservations do not reconcile'; END IF;
  IF EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id LIKE 'demo-v1-order-%'
    AND oi.quantity <> coalesce((SELECT sum(quantity) FROM fulfillment_items WHERE order_item_id=oi.id),0)
  ) THEN RAISE EXCEPTION 'Fulfillment items do not cover the order'; END IF;
  IF EXISTS (
    SELECT 1 FROM fulfillment_items fi JOIN fulfillments f ON f.id=fi.fulfillment_id
    LEFT JOIN inventory_reservations r ON r.id=fi.reservation_id
    JOIN order_items oi ON oi.id=fi.order_item_id
    LEFT JOIN inventory_items ii ON ii.id=r.inventory_item_id
    WHERE f.id LIKE 'demo-v1-%'
    AND (r.id IS NULL OR r.quantity<>fi.quantity OR r.order_id<>f.order_id
      OR oi.order_id<>f.order_id OR oi.variant_id<>ii.variant_id OR f.warehouse_id<>ii.warehouse_id)
  ) THEN RAISE EXCEPTION 'Shipment/reservation relationship is inconsistent'; END IF;
  IF EXISTS (
    SELECT 1 FROM customer_orders o JOIN payments p ON p.order_id=o.id
    WHERE o.id LIKE 'demo-v1-order-%' AND (
      (o.payment_status='paid' AND (p.status<>'succeeded' OR p.captured_at IS NULL))
      OR (o.payment_status='cod_pending' AND (p.status<>'pending' OR p.method<>'cod'))
      OR (o.payment_status IN ('pending','failed','cancelled','refunded') AND o.payment_status<>p.status)
    )
  ) THEN RAISE EXCEPTION 'Payment/order status mismatch'; END IF;
END $$;

SELECT json_build_object(
  'customers', (SELECT count(*) FROM users WHERE id LIKE 'demo-v1-customer-%'),
  'employees', (SELECT count(*) FROM users WHERE id IN ('demo-v1-admin-001','demo-v1-manager-001','demo-v1-staff-001')),
  'orders', (SELECT count(*) FROM customer_orders WHERE id LIKE 'demo-v1-order-%'),
  'shipments', (SELECT count(*) FROM fulfillments WHERE id LIKE 'demo-v1-fulfillment-%'),
  'wishlistItems', (SELECT count(*) FROM wishlist_items WHERE user_id LIKE 'demo-v1-customer-%'),
  'dashboards', (SELECT count(*) FROM admin_ai_dashboards WHERE id LIKE 'demo-v1-%'),
  'segments', (SELECT json_object_agg(segment_code,n) FROM (
    SELECT segment_code,count(*) n FROM admin_customer_segments WHERE id LIKE 'demo-v1-customer-%' GROUP BY segment_code
  ) segments),
  'integrity', 'passed'
);
