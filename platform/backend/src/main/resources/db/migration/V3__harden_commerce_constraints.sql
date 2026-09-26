-- Harden invariants that are shared by checkout, payment and inventory flows.
-- CHECK constraints are added NOT VALID so the migration can be deployed before
-- legacy rows are audited; PostgreSQL still enforces them for new/updated rows.

alter table customer_orders add column idempotency_key varchar(160);

update customer_orders
set idempotency_key = id
where idempotency_key is null;

alter table customer_orders
  alter column idempotency_key set not null,
  add constraint uq_customer_orders_idempotency_key unique (idempotency_key);

-- Business uniqueness rules.
create unique index ux_coupons_code_ci
  on coupons (lower(code));

create unique index ux_product_categories_one_primary
  on product_categories (product_id)
  where is_primary;

create unique index ux_payments_provider_payment_id
  on payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create unique index ux_inventory_reservations_active_order_item
  on inventory_reservations (order_id, inventory_item_id)
  where status = 'active';

-- Index the referencing side of frequently traversed foreign keys and queues.
create index idx_user_roles_role
  on user_roles (role_id, user_id);

create index idx_product_categories_category
  on product_categories (category_id, sort_order, product_id);

create index idx_product_media_product_sort
  on product_media (product_id, sort_order, id);

create index idx_product_media_variant
  on product_media (variant_id)
  where variant_id is not null;

create index idx_inventory_movements_reference
  on inventory_movements (reference_type, reference_id, created_at desc)
  where reference_id is not null;

create index idx_inventory_operation_items_operation
  on inventory_operation_items (operation_id, created_at, id);

create index idx_carts_user
  on carts (user_id, updated_at desc)
  where user_id is not null;

create index idx_carts_expiry
  on carts (expires_at)
  where expires_at is not null;

create index idx_order_items_order_created
  on order_items (order_id, created_at, id);

create index idx_order_status_history_order_created
  on order_status_history (order_id, created_at, id);

create index idx_inventory_reservations_order
  on inventory_reservations (order_id, status, created_at);

create index idx_payments_order
  on payments (order_id, created_at desc);

create index idx_payment_events_payment
  on payment_events (payment_id, created_at)
  where payment_id is not null;

create index idx_payment_events_unprocessed
  on payment_events (created_at, id)
  where processed_at is null;

create index idx_coupons_promotion
  on coupons (promotion_id, status);

create index idx_order_promotions_order
  on order_promotions (order_id, created_at, id);

-- Catalog states and numeric values.
alter table categories
  add constraint ck_categories_status
    check (status in ('active', 'inactive', 'archived')) not valid,
  add constraint ck_categories_sort_order_nonnegative
    check (sort_order >= 0) not valid;

alter table product_categories
  add constraint ck_product_categories_sort_order_nonnegative
    check (sort_order >= 0) not valid;

alter table product_variants
  add constraint ck_product_variants_status
    check (status in ('active', 'inactive', 'archived')) not valid,
  add constraint ck_product_variants_compare_price
    check (compare_at_price_cents is null or compare_at_price_cents >= price_cents) not valid,
  add constraint ck_product_variants_cost_nonnegative
    check (cost_cents is null or cost_cents >= 0) not valid,
  add constraint ck_product_variants_weight_nonnegative
    check (weight_grams is null or weight_grams >= 0) not valid;

alter table product_media
  add constraint ck_product_media_type
    check (media_type in ('image', 'video')) not valid,
  add constraint ck_product_media_sort_order_nonnegative
    check (sort_order >= 0) not valid;

alter table warehouses
  add constraint ck_warehouses_status
    check (status in ('active', 'inactive', 'archived')) not valid;

-- Inventory quantities, states and operation timestamps.
alter table inventory_items
  add constraint ck_inventory_items_version_positive
    check (version > 0) not valid;

alter table inventory_movements
  add constraint ck_inventory_movements_balance_nonnegative
    check (balance_after >= 0) not valid;

alter table inventory_operations
  add constraint ck_inventory_operations_status
    check (status in ('draft', 'posted', 'cancelled')) not valid,
  add constraint ck_inventory_operations_posted_time
    check (
      (status = 'posted' and posted_at is not null)
      or (status <> 'posted')
    ) not valid;

alter table inventory_operation_items
  add constraint ck_inventory_operation_items_expected_nonnegative
    check (expected_quantity is null or expected_quantity >= 0) not valid,
  add constraint ck_inventory_operation_items_actual_nonnegative
    check (actual_quantity is null or actual_quantity >= 0) not valid,
  add constraint ck_inventory_operation_items_cost_nonnegative
    check (unit_cost_cents is null or unit_cost_cents >= 0) not valid;

alter table inventory_reservations
  add constraint ck_inventory_reservations_status
    check (status in ('active', 'released', 'expired', 'consumed', 'returned', 'cancelled')) not valid,
  add constraint ck_inventory_reservations_expiry
    check (expires_at > created_at) not valid,
  add constraint ck_inventory_reservations_release_time
    check (released_at is null or released_at >= created_at) not valid;

-- Cart and order financial invariants.
alter table carts
  add constraint ck_carts_owner
    check (user_id is not null or guest_token is not null) not valid,
  add constraint ck_carts_currency
    check (currency ~ '^[A-Z]{3}$') not valid,
  add constraint ck_carts_expiry
    check (expires_at is null or expires_at > created_at) not valid;

alter table cart_items
  add constraint ck_cart_items_unit_price_nonnegative
    check (unit_price_cents >= 0) not valid;

alter table customer_orders
  add constraint ck_customer_orders_status
    check (status in (
      'pending_payment', 'confirmed', 'processing', 'ready_to_ship', 'packed', 'shipped',
      'delivered', 'cancelled', 'returned', 'refunded'
    )) not valid,
  add constraint ck_customer_orders_payment_status
    check (payment_status in (
      'pending', 'cod_pending', 'authorized', 'paid', 'failed',
      'cancelled', 'partially_refunded', 'refunded'
    )) not valid,
  add constraint ck_customer_orders_fulfillment_status
    check (fulfillment_status in (
      'unfulfilled', 'reserved', 'partially_fulfilled', 'shipped', 'fulfilled',
      'returned', 'cancelled'
    )) not valid,
  add constraint ck_customer_orders_currency
    check (currency ~ '^[A-Z]{3}$') not valid,
  add constraint ck_customer_orders_source
    check (source in ('web', 'mobile', 'admin', 'api', 'import')) not valid,
  add constraint ck_customer_orders_amounts_nonnegative
    check (
      subtotal_cents >= 0
      and discount_total_cents >= 0
      and shipping_total_cents >= 0
      and tax_total_cents >= 0
      and grand_total_cents >= 0
    ) not valid,
  add constraint ck_customer_orders_discount_within_subtotal
    check (discount_total_cents <= subtotal_cents) not valid,
  add constraint ck_customer_orders_total_equation
    check (
      grand_total_cents = subtotal_cents - discount_total_cents
        + shipping_total_cents + tax_total_cents
    ) not valid,
  add constraint ck_customer_orders_placed_time
    check (placed_at is null or placed_at >= created_at) not valid,
  add constraint ck_customer_orders_cancelled_time
    check (cancelled_at is null or cancelled_at >= created_at) not valid;

alter table order_items
  add constraint ck_order_items_quantity_positive
    check (quantity > 0) not valid,
  add constraint ck_order_items_amounts_nonnegative
    check (
      unit_price_cents >= 0
      and discount_cents >= 0
      and total_cents >= 0
    ) not valid,
  add constraint ck_order_items_discount_within_line
    check (discount_cents <= unit_price_cents * quantity) not valid,
  add constraint ck_order_items_total_equation
    check (total_cents = unit_price_cents * quantity - discount_cents) not valid;

alter table order_status_history
  add constraint ck_order_status_history_from_status
    check (
      from_status is null or from_status in (
        'pending_payment', 'confirmed', 'processing', 'ready_to_ship', 'packed', 'shipped',
        'delivered', 'cancelled', 'returned', 'refunded'
      )
    ) not valid,
  add constraint ck_order_status_history_to_status
    check (to_status in (
      'pending_payment', 'confirmed', 'processing', 'ready_to_ship', 'packed', 'shipped',
      'delivered', 'cancelled', 'returned', 'refunded'
    )) not valid;

-- Payment, promotion and asynchronous processing invariants.
alter table payments
  add constraint ck_payments_method
    check (method in ('cod', 'online', 'card', 'bank_transfer', 'e_wallet')) not valid,
  add constraint ck_payments_status
    check (status in (
      'pending', 'authorized', 'succeeded', 'paid', 'failed', 'cancelled',
      'partially_refunded', 'refunded'
    )) not valid,
  add constraint ck_payments_amount_nonnegative
    check (amount_cents >= 0) not valid,
  add constraint ck_payments_currency
    check (currency ~ '^[A-Z]{3}$') not valid,
  add constraint ck_payments_provider_payment_id_not_blank
    check (provider_payment_id is null or btrim(provider_payment_id) <> '') not valid,
  add constraint ck_payments_captured_time
    check (captured_at is null or captured_at >= created_at) not valid;

alter table payment_events
  add constraint ck_payment_events_provider_event_id_not_blank
    check (btrim(provider_event_id) <> '') not valid,
  add constraint ck_payment_events_processed_time
    check (processed_at is null or processed_at >= created_at) not valid;

alter table promotions
  add constraint ck_promotions_status
    check (status in ('draft', 'active', 'inactive', 'expired', 'archived')) not valid,
  add constraint ck_promotions_time_window
    check (ends_at > starts_at) not valid,
  add constraint ck_promotions_value
    check (
      (type = 'percentage' and value between 0 and 100)
      or (type = 'fixed' and value >= 0)
      or (type = 'free_shipping' and value = 0)
    ) not valid,
  add constraint ck_promotions_amounts_nonnegative
    check (
      min_subtotal_cents >= 0
      and (max_discount_cents is null or max_discount_cents >= 0)
    ) not valid,
  add constraint ck_promotions_usage_limit_positive
    check (usage_limit is null or usage_limit > 0) not valid,
  add constraint ck_promotions_usage_count
    check (
      usage_count >= 0
      and (usage_limit is null or usage_count <= usage_limit)
    ) not valid;

alter table coupons
  add constraint ck_coupons_status
    check (status in ('active', 'inactive', 'exhausted', 'expired', 'archived')) not valid,
  add constraint ck_coupons_code_not_blank
    check (btrim(code) <> '') not valid,
  add constraint ck_coupons_usage_limit_positive
    check (usage_limit is null or usage_limit > 0) not valid,
  add constraint ck_coupons_usage_per_customer_positive
    check (usage_limit_per_customer > 0) not valid,
  add constraint ck_coupons_usage_count
    check (
      usage_count >= 0
      and (usage_limit is null or usage_count <= usage_limit)
    ) not valid;

alter table order_promotions
  add constraint ck_order_promotions_discount_nonnegative
    check (discount_cents >= 0) not valid;

alter table refresh_tokens
  add constraint ck_refresh_tokens_expiry
    check (expires_at > created_at) not valid,
  add constraint ck_refresh_tokens_revoked_time
    check (revoked_at is null or revoked_at >= created_at) not valid;

alter table outbox_events
  add constraint ck_outbox_events_status
    check (status in ('pending', 'processing', 'processed', 'failed', 'dead_letter')) not valid,
  add constraint ck_outbox_events_attempts_nonnegative
    check (attempts >= 0) not valid,
  add constraint ck_outbox_events_processed_time
    check (processed_at is null or processed_at >= created_at) not valid;
