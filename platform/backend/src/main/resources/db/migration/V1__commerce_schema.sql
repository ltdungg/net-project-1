create table roles (
  id varchar(64) primary key,
  code varchar(32) not null unique,
  name varchar(100) not null,
  description text
);

create table users (
  id varchar(64) primary key,
  external_auth_id varchar(160) unique,
  email varchar(254) not null,
  password_hash varchar(100),
  full_name varchar(100),
  phone varchar(20),
  status varchar(24) not null default 'active' check (status in ('active','blocked','deleted')),
  marketing_consent boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index ux_users_email on users(lower(email));

create table user_roles (
  user_id varchar(64) not null references users(id) on delete cascade,
  role_id varchar(64) not null references roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key(user_id, role_id)
);

create table refresh_tokens (
  id varchar(64) primary key,
  user_id varchar(64) not null references users(id) on delete cascade,
  token_hash varchar(100) not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_refresh_tokens_user on refresh_tokens(user_id, expires_at);

create table addresses (
  id varchar(64) primary key,
  user_id varchar(64) not null references users(id) on delete cascade,
  label varchar(50) not null,
  recipient_name varchar(100) not null,
  phone varchar(20) not null,
  line1 varchar(255) not null,
  ward varchar(100),
  district varchar(100) not null,
  city varchar(100) not null,
  postal_code varchar(20),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_addresses_user on addresses(user_id, is_default desc, created_at);
create unique index ux_addresses_one_default on addresses(user_id) where is_default;

create table categories (
  id varchar(64) primary key,
  parent_id varchar(64) references categories(id) on delete set null,
  slug varchar(120) not null unique,
  name varchar(120) not null,
  description text,
  sort_order integer not null default 0,
  status varchar(24) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id varchar(64) primary key,
  slug varchar(180) not null unique,
  name varchar(200) not null,
  subtitle varchar(255),
  description text not null,
  material varchar(255),
  status varchar(24) not null default 'draft' check (status in ('draft','active','archived')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_status_published on products(status, published_at desc);

create table product_categories (
  product_id varchar(64) not null references products(id) on delete cascade,
  category_id varchar(64) not null references categories(id) on delete cascade,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  primary key(product_id, category_id)
);

create table product_variants (
  id varchar(64) primary key,
  product_id varchar(64) not null references products(id) on delete cascade,
  sku varchar(100) not null unique,
  barcode varchar(100),
  size varchar(50) not null,
  color varchar(100) not null,
  color_hex varchar(20),
  price_cents bigint not null check (price_cents >= 0),
  compare_at_price_cents bigint,
  cost_cents bigint,
  weight_grams integer,
  status varchar(24) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_product_variants_product on product_variants(product_id, status);

create table product_media (
  id varchar(64) primary key,
  product_id varchar(64) not null references products(id) on delete cascade,
  variant_id varchar(64) references product_variants(id) on delete set null,
  storage_key varchar(500) not null,
  public_url varchar(1000),
  media_type varchar(30) not null default 'image',
  alt_text varchar(255) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table warehouses (
  id varchar(64) primary key,
  code varchar(50) not null unique,
  name varchar(150) not null,
  address varchar(500),
  status varchar(24) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inventory_items (
  id varchar(64) primary key,
  warehouse_id varchar(64) not null references warehouses(id),
  variant_id varchar(64) not null references product_variants(id),
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= on_hand),
  safety_stock integer not null default 0 check (safety_stock >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(warehouse_id, variant_id)
);
create index idx_inventory_items_variant on inventory_items(variant_id);

create table inventory_movements (
  id varchar(64) primary key,
  inventory_item_id varchar(64) not null references inventory_items(id),
  type varchar(40) not null,
  quantity_delta integer not null,
  balance_after integer not null,
  reference_type varchar(60),
  reference_id varchar(64),
  reason varchar(500) not null,
  idempotency_key varchar(160) unique,
  actor_user_id varchar(64) references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_inventory_movements_item_created on inventory_movements(inventory_item_id, created_at desc);

create table inventory_operations (
  id varchar(64) primary key,
  operation_number varchar(100) not null unique,
  type varchar(30) not null check (type in ('receipt','transfer','stocktake','adjustment')),
  status varchar(30) not null default 'posted',
  source_warehouse_id varchar(64) references warehouses(id),
  destination_warehouse_id varchar(64) references warehouses(id),
  reference_number varchar(120),
  idempotency_key varchar(160) not null unique,
  reason varchar(500) not null,
  notes text,
  created_by varchar(64) references users(id) on delete set null,
  posted_by varchar(64) references users(id) on delete set null,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inventory_operation_items (
  id varchar(64) primary key,
  operation_id varchar(64) not null references inventory_operations(id) on delete cascade,
  variant_id varchar(64) not null references product_variants(id),
  source_inventory_item_id varchar(64) references inventory_items(id),
  destination_inventory_item_id varchar(64) references inventory_items(id),
  quantity integer not null,
  expected_quantity integer,
  actual_quantity integer,
  variance integer,
  unit_cost_cents bigint,
  note text,
  created_at timestamptz not null default now()
);

create table carts (
  id varchar(64) primary key,
  user_id varchar(64) references users(id) on delete set null,
  guest_token varchar(160) unique,
  currency varchar(3) not null default 'VND',
  coupon_code varchar(60),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id varchar(64) primary key,
  cart_id varchar(64) not null references carts(id) on delete cascade,
  variant_id varchar(64) not null references product_variants(id),
  quantity integer not null default 1 check (quantity between 1 and 10),
  unit_price_cents bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, variant_id)
);

create table customer_orders (
  id varchar(64) primary key,
  order_number varchar(100) not null unique,
  user_id varchar(64) references users(id) on delete set null,
  email varchar(254) not null,
  phone varchar(20) not null,
  status varchar(40) not null default 'pending_payment',
  payment_status varchar(40) not null default 'pending',
  fulfillment_status varchar(40) not null default 'unfulfilled',
  currency varchar(3) not null default 'VND',
  subtotal_cents bigint not null,
  discount_total_cents bigint not null default 0,
  shipping_total_cents bigint not null default 0,
  tax_total_cents bigint not null default 0,
  grand_total_cents bigint not null,
  shipping_address_json jsonb not null,
  billing_address_json jsonb,
  customer_note text,
  source varchar(30) not null default 'web',
  placed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_user_created on customer_orders(user_id, created_at desc);
create index idx_orders_status_created on customer_orders(status, created_at desc);

create table order_items (
  id varchar(64) primary key,
  order_id varchar(64) not null references customer_orders(id) on delete cascade,
  variant_id varchar(64) references product_variants(id) on delete set null,
  sku varchar(100) not null,
  product_name varchar(200) not null,
  variant_name varchar(200) not null,
  image_url varchar(1000),
  quantity integer not null,
  unit_price_cents bigint not null,
  discount_cents bigint not null default 0,
  total_cents bigint not null,
  created_at timestamptz not null default now()
);

create table order_status_history (
  id varchar(64) primary key,
  order_id varchar(64) not null references customer_orders(id) on delete cascade,
  from_status varchar(40),
  to_status varchar(40) not null,
  reason varchar(500),
  actor_user_id varchar(64) references users(id) on delete set null,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

create table inventory_reservations (
  id varchar(64) primary key,
  inventory_item_id varchar(64) not null references inventory_items(id),
  order_id varchar(64) not null references customer_orders(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  status varchar(30) not null default 'active',
  expires_at timestamptz not null,
  released_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_inventory_reservations_expiry on inventory_reservations(status, expires_at);

create table payments (
  id varchar(64) primary key,
  order_id varchar(64) not null references customer_orders(id),
  provider varchar(60) not null,
  provider_payment_id varchar(160),
  method varchar(40) not null,
  status varchar(40) not null default 'pending',
  amount_cents bigint not null,
  currency varchar(3) not null default 'VND',
  idempotency_key varchar(160) not null unique,
  failure_code varchar(100),
  failure_message varchar(500),
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_events (
  id varchar(64) primary key,
  payment_id varchar(64) references payments(id) on delete set null,
  provider varchar(60) not null,
  provider_event_id varchar(160) not null,
  event_type varchar(80) not null,
  signature_valid boolean not null default false,
  payload_json jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);

create table promotions (
  id varchar(64) primary key,
  name varchar(160) not null,
  description text,
  type varchar(30) not null check (type in ('percentage','fixed','free_shipping')),
  value bigint not null,
  min_subtotal_cents bigint not null default 0,
  max_discount_cents bigint,
  usage_limit integer,
  usage_count integer not null default 0,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status varchar(30) not null default 'draft',
  rules_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coupons (
  id varchar(64) primary key,
  promotion_id varchar(64) not null references promotions(id) on delete cascade,
  code varchar(60) not null unique,
  usage_limit integer,
  usage_limit_per_customer integer not null default 1,
  usage_count integer not null default 0,
  status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_promotions (
  id varchar(64) primary key,
  order_id varchar(64) not null references customer_orders(id) on delete cascade,
  promotion_id varchar(64) references promotions(id) on delete set null,
  coupon_id varchar(64) references coupons(id) on delete set null,
  name_snapshot varchar(160) not null,
  discount_cents bigint not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id varchar(64) primary key,
  actor_user_id varchar(64) references users(id) on delete set null,
  action varchar(120) not null,
  entity_type varchar(80) not null,
  entity_id varchar(64),
  before_json jsonb,
  after_json jsonb,
  ip_hash varchar(160),
  user_agent varchar(500),
  correlation_id varchar(100) not null,
  created_at timestamptz not null default now()
);
create index idx_audit_entity on audit_logs(entity_type, entity_id, created_at desc);

create table outbox_events (
  id varchar(64) primary key,
  aggregate_type varchar(80) not null,
  aggregate_id varchar(64) not null,
  event_type varchar(120) not null,
  payload_json jsonb not null,
  status varchar(30) not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index idx_outbox_pending on outbox_events(status, available_at);
