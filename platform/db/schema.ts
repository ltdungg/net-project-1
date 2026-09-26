import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
};

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    externalAuthId: text('external_auth_id').notNull(),
    email: text('email').notNull(),
    fullName: text('full_name'),
    phone: text('phone'),
    avatarUrl: text('avatar_url'),
    status: text('status').notNull().default('active'),
    marketingConsent: integer('marketing_consent', { mode: 'boolean' })
      .notNull()
      .default(false),
    lastLoginAt: integer('last_login_at'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_users_external_auth_id').on(table.externalAuthId),
    uniqueIndex('ux_users_email').on(table.email),
    index('idx_users_status_created_at').on(table.status, table.createdAt),
  ],
);

export const addresses = sqliteTable(
  'addresses',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').notNull().default('Nhà'),
    recipientName: text('recipient_name').notNull(),
    phone: text('phone').notNull(),
    line1: text('line1').notNull(),
    ward: text('ward'),
    district: text('district').notNull(),
    province: text('province').notNull(),
    postalCode: text('postal_code'),
    isDefault: integer('is_default', { mode: 'boolean' })
      .notNull()
      .default(false),
    ...timestamps,
  },
  (table) => [
    index('idx_addresses_user_default').on(table.userId, table.isDefault),
  ],
);

export const roles = sqliteTable(
  'roles',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    ...timestamps,
  },
  (table) => [uniqueIndex('ux_roles_code').on(table.code)],
);

export const userRoles = sqliteTable(
  'user_roles',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    assignedBy: text('assigned_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    assignedAt: integer('assigned_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index('idx_user_roles_role_id').on(table.roleId),
  ],
);

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    parentId: text('parent_id'),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    imageKey: text('image_key'),
    sortOrder: integer('sort_order').notNull().default(0),
    status: text('status').notNull().default('active'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_categories_slug').on(table.slug),
    index('idx_categories_parent_sort').on(table.parentId, table.sortOrder),
  ],
);

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    subtitle: text('subtitle'),
    description: text('description').notNull(),
    material: text('material'),
    careInstructions: text('care_instructions'),
    sizeGuide: text('size_guide'),
    status: text('status').notNull().default('draft'),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    publishedAt: integer('published_at'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_products_slug').on(table.slug),
    index('idx_products_status_published').on(table.status, table.publishedAt),
    index('idx_products_featured').on(table.featured, table.status),
  ],
);

export const productCategories = sqliteTable(
  'product_categories',
  {
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    isPrimary: integer('is_primary', { mode: 'boolean' })
      .notNull()
      .default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index('idx_product_categories_category').on(
      table.categoryId,
      table.sortOrder,
    ),
  ],
);

export const productVariants = sqliteTable(
  'product_variants',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    barcode: text('barcode'),
    size: text('size').notNull(),
    color: text('color').notNull(),
    colorHex: text('color_hex'),
    priceCents: integer('price_cents').notNull(),
    compareAtPriceCents: integer('compare_at_price_cents'),
    costCents: integer('cost_cents'),
    weightGrams: integer('weight_grams'),
    status: text('status').notNull().default('active'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_product_variants_sku').on(table.sku),
    index('idx_product_variants_product_status').on(
      table.productId,
      table.status,
    ),
  ],
);

export const productMedia = sqliteTable(
  'product_media',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: text('variant_id').references(() => productVariants.id, {
      onDelete: 'set null',
    }),
    storageKey: text('storage_key').notNull(),
    publicUrl: text('public_url'),
    mediaType: text('media_type').notNull().default('image'),
    altText: text('alt_text').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index('idx_product_media_product_sort').on(
      table.productId,
      table.sortOrder,
    ),
  ],
);

export const warehouses = sqliteTable(
  'warehouses',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    address: text('address'),
    status: text('status').notNull().default('active'),
    ...timestamps,
  },
  (table) => [uniqueIndex('ux_warehouses_code').on(table.code)],
);

export const inventoryItems = sqliteTable(
  'inventory_items',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    variantId: text('variant_id')
      .notNull()
      .references(() => productVariants.id),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    safetyStock: integer('safety_stock').notNull().default(0),
    reorderPoint: integer('reorder_point').notNull().default(0),
    version: integer('version').notNull().default(1),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_inventory_items_warehouse_variant').on(
      table.warehouseId,
      table.variantId,
    ),
    index('idx_inventory_items_variant').on(table.variantId),
  ],
);

export const inventoryMovements = sqliteTable(
  'inventory_movements',
  {
    id: text('id').primaryKey(),
    inventoryItemId: text('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    type: text('type').notNull(),
    quantityDelta: integer('quantity_delta').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    referenceType: text('reference_type'),
    referenceId: text('reference_id'),
    reason: text('reason').notNull(),
    idempotencyKey: text('idempotency_key'),
    actorUserId: text('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex('ux_inventory_movements_idempotency').on(table.idempotencyKey),
    index('idx_inventory_movements_item_created').on(
      table.inventoryItemId,
      table.createdAt,
    ),
  ],
);

export const inventoryReservations = sqliteTable(
  'inventory_reservations',
  {
    id: text('id').primaryKey(),
    inventoryItemId: text('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id),
    orderId: text('order_id').notNull(),
    quantity: integer('quantity').notNull(),
    status: text('status').notNull().default('active'),
    expiresAt: integer('expires_at').notNull(),
    releasedAt: integer('released_at'),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('idx_inventory_reservations_order').on(table.orderId),
    index('idx_inventory_reservations_expiry').on(
      table.status,
      table.expiresAt,
    ),
  ],
);

export const inventoryOperations = sqliteTable(
  'inventory_operations',
  {
    id: text('id').primaryKey(),
    operationNumber: text('operation_number').notNull(),
    type: text('type').notNull(),
    status: text('status').notNull().default('draft'),
    sourceWarehouseId: text('source_warehouse_id').references(
      () => warehouses.id,
      { onDelete: 'restrict' },
    ),
    destinationWarehouseId: text('destination_warehouse_id').references(
      () => warehouses.id,
      { onDelete: 'restrict' },
    ),
    referenceNumber: text('reference_number'),
    idempotencyKey: text('idempotency_key').notNull(),
    reason: text('reason').notNull(),
    notes: text('notes'),
    createdBy: text('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    postedBy: text('posted_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    postedAt: integer('posted_at'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_inventory_operations_number').on(table.operationNumber),
    uniqueIndex('ux_inventory_operations_idempotency').on(table.idempotencyKey),
    index('idx_inventory_operations_type_status_created').on(
      table.type,
      table.status,
      table.createdAt,
    ),
    index('idx_inventory_operations_source_created').on(
      table.sourceWarehouseId,
      table.createdAt,
    ),
    index('idx_inventory_operations_destination_created').on(
      table.destinationWarehouseId,
      table.createdAt,
    ),
  ],
);

export const inventoryOperationItems = sqliteTable(
  'inventory_operation_items',
  {
    id: text('id').primaryKey(),
    operationId: text('operation_id')
      .notNull()
      .references(() => inventoryOperations.id, { onDelete: 'cascade' }),
    variantId: text('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    sourceInventoryItemId: text('source_inventory_item_id').references(
      () => inventoryItems.id,
      { onDelete: 'restrict' },
    ),
    destinationInventoryItemId: text(
      'destination_inventory_item_id',
    ).references(() => inventoryItems.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    expectedQuantity: integer('expected_quantity'),
    actualQuantity: integer('actual_quantity'),
    variance: integer('variance'),
    unitCostCents: integer('unit_cost_cents'),
    note: text('note'),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('idx_inventory_operation_items_operation').on(table.operationId),
    index('idx_inventory_operation_items_variant').on(table.variantId),
  ],
);

export const carts = sqliteTable(
  'carts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    guestToken: text('guest_token'),
    currency: text('currency').notNull().default('VND'),
    couponCode: text('coupon_code'),
    expiresAt: integer('expires_at'),
    ...timestamps,
  },
  (table) => [
    index('idx_carts_user_updated').on(table.userId, table.updatedAt),
    uniqueIndex('ux_carts_guest_token').on(table.guestToken),
  ],
);

export const cartItems = sqliteTable(
  'cart_items',
  {
    id: text('id').primaryKey(),
    cartId: text('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    variantId: text('variant_id')
      .notNull()
      .references(() => productVariants.id),
    quantity: integer('quantity').notNull().default(1),
    unitPriceCents: integer('unit_price_cents').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_cart_items_cart_variant').on(table.cartId, table.variantId),
  ],
);

export const customerOrders = sqliteTable(
  'customer_orders',
  {
    id: text('id').primaryKey(),
    orderNumber: text('order_number').notNull(),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    status: text('status').notNull().default('pending_payment'),
    paymentStatus: text('payment_status').notNull().default('pending'),
    fulfillmentStatus: text('fulfillment_status')
      .notNull()
      .default('unfulfilled'),
    currency: text('currency').notNull().default('VND'),
    subtotalCents: integer('subtotal_cents').notNull(),
    discountTotalCents: integer('discount_total_cents').notNull().default(0),
    shippingTotalCents: integer('shipping_total_cents').notNull().default(0),
    taxTotalCents: integer('tax_total_cents').notNull().default(0),
    grandTotalCents: integer('grand_total_cents').notNull(),
    shippingAddressJson: text('shipping_address_json').notNull(),
    billingAddressJson: text('billing_address_json'),
    customerNote: text('customer_note'),
    source: text('source').notNull().default('web'),
    placedAt: integer('placed_at'),
    cancelledAt: integer('cancelled_at'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_customer_orders_order_number').on(table.orderNumber),
    index('idx_customer_orders_user_created').on(table.userId, table.createdAt),
    index('idx_customer_orders_status_created').on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => customerOrders.id, { onDelete: 'cascade' }),
    variantId: text('variant_id').references(() => productVariants.id, {
      onDelete: 'set null',
    }),
    sku: text('sku').notNull(),
    productName: text('product_name').notNull(),
    variantName: text('variant_name').notNull(),
    imageUrl: text('image_url'),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    discountCents: integer('discount_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index('idx_order_items_order').on(table.orderId)],
);

export const orderStatusHistory = sqliteTable(
  'order_status_history',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => customerOrders.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    reason: text('reason'),
    actorUserId: text('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    metadataJson: text('metadata_json'),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('idx_order_status_history_order_created').on(
      table.orderId,
      table.createdAt,
    ),
  ],
);

export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => customerOrders.id),
    provider: text('provider').notNull(),
    providerPaymentId: text('provider_payment_id'),
    method: text('method').notNull(),
    status: text('status').notNull().default('pending'),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('VND'),
    idempotencyKey: text('idempotency_key').notNull(),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    capturedAt: integer('captured_at'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_payments_idempotency_key').on(table.idempotencyKey),
    index('idx_payments_order_status').on(table.orderId, table.status),
    index('idx_payments_provider_id').on(
      table.provider,
      table.providerPaymentId,
    ),
  ],
);

export const paymentEvents = sqliteTable(
  'payment_events',
  {
    id: text('id').primaryKey(),
    paymentId: text('payment_id').references(() => payments.id, {
      onDelete: 'set null',
    }),
    provider: text('provider').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    eventType: text('event_type').notNull(),
    signatureValid: integer('signature_valid', { mode: 'boolean' })
      .notNull()
      .default(false),
    payloadJson: text('payload_json').notNull(),
    processedAt: integer('processed_at'),
    processingError: text('processing_error'),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex('ux_payment_events_provider_event').on(
      table.provider,
      table.providerEventId,
    ),
  ],
);

export const refunds = sqliteTable(
  'refunds',
  {
    id: text('id').primaryKey(),
    paymentId: text('payment_id')
      .notNull()
      .references(() => payments.id),
    orderId: text('order_id')
      .notNull()
      .references(() => customerOrders.id),
    amountCents: integer('amount_cents').notNull(),
    status: text('status').notNull().default('requested'),
    reason: text('reason').notNull(),
    providerRefundId: text('provider_refund_id'),
    requestedBy: text('requested_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    processedAt: integer('processed_at'),
    ...timestamps,
  },
  (table) => [
    index('idx_refunds_order_status').on(table.orderId, table.status),
  ],
);

export const fulfillments = sqliteTable(
  'fulfillments',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => customerOrders.id),
    warehouseId: text('warehouse_id').references(() => warehouses.id, {
      onDelete: 'set null',
    }),
    provider: text('provider'),
    trackingNumber: text('tracking_number'),
    trackingUrl: text('tracking_url'),
    status: text('status').notNull().default('pending'),
    shippingFeeCents: integer('shipping_fee_cents').notNull().default(0),
    shippedAt: integer('shipped_at'),
    deliveredAt: integer('delivered_at'),
    failedReason: text('failed_reason'),
    ...timestamps,
  },
  (table) => [
    index('idx_fulfillments_order').on(table.orderId),
    index('idx_fulfillments_tracking').on(table.provider, table.trackingNumber),
  ],
);

export const fulfillmentItems = sqliteTable(
  'fulfillment_items',
  {
    fulfillmentId: text('fulfillment_id')
      .notNull()
      .references(() => fulfillments.id, { onDelete: 'cascade' }),
    orderItemId: text('order_item_id')
      .notNull()
      .references(() => orderItems.id),
    quantity: integer('quantity').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.fulfillmentId, table.orderItemId] }),
  ],
);

export const promotions = sqliteTable(
  'promotions',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    type: text('type').notNull(),
    value: integer('value').notNull(),
    minSubtotalCents: integer('min_subtotal_cents').notNull().default(0),
    maxDiscountCents: integer('max_discount_cents'),
    usageLimit: integer('usage_limit'),
    usageCount: integer('usage_count').notNull().default(0),
    startsAt: integer('starts_at').notNull(),
    endsAt: integer('ends_at').notNull(),
    status: text('status').notNull().default('draft'),
    rulesJson: text('rules_json'),
    ...timestamps,
  },
  (table) => [
    index('idx_promotions_status_window').on(
      table.status,
      table.startsAt,
      table.endsAt,
    ),
  ],
);

export const coupons = sqliteTable(
  'coupons',
  {
    id: text('id').primaryKey(),
    promotionId: text('promotion_id')
      .notNull()
      .references(() => promotions.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    usageLimit: integer('usage_limit'),
    usageLimitPerCustomer: integer('usage_limit_per_customer')
      .notNull()
      .default(1),
    usageCount: integer('usage_count').notNull().default(0),
    status: text('status').notNull().default('active'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ux_coupons_code').on(table.code),
    index('idx_coupons_promotion').on(table.promotionId),
  ],
);

export const orderPromotions = sqliteTable(
  'order_promotions',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => customerOrders.id, { onDelete: 'cascade' }),
    promotionId: text('promotion_id').references(() => promotions.id, {
      onDelete: 'set null',
    }),
    couponId: text('coupon_id').references(() => coupons.id, {
      onDelete: 'set null',
    }),
    nameSnapshot: text('name_snapshot').notNull(),
    discountCents: integer('discount_cents').notNull(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index('idx_order_promotions_order').on(table.orderId)],
);

export const outboxEvents = sqliteTable(
  'outbox_events',
  {
    id: text('id').primaryKey(),
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: text('aggregate_id').notNull(),
    eventType: text('event_type').notNull(),
    payloadJson: text('payload_json').notNull(),
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    availableAt: integer('available_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    processedAt: integer('processed_at'),
    lastError: text('last_error'),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('idx_outbox_events_status_available').on(
      table.status,
      table.availableAt,
    ),
  ],
);

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    actorUserId: text('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    beforeJson: text('before_json'),
    afterJson: text('after_json'),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    correlationId: text('correlation_id').notNull(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('idx_audit_logs_entity_created').on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
    index('idx_audit_logs_actor_created').on(
      table.actorUserId,
      table.createdAt,
    ),
  ],
);

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type CustomerOrder = typeof customerOrders.$inferSelect;
export type InventoryOperation = typeof inventoryOperations.$inferSelect;
