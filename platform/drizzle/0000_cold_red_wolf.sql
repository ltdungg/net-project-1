CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text DEFAULT 'Nhà' NOT NULL,
	`recipient_name` text NOT NULL,
	`phone` text NOT NULL,
	`line1` text NOT NULL,
	`ward` text,
	`district` text NOT NULL,
	`province` text NOT NULL,
	`postal_code` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_addresses_user_default` ON `addresses` (`user_id`,`is_default`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`before_json` text,
	`after_json` text,
	`ip_hash` text,
	`user_agent` text,
	`correlation_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_entity_created` ON `audit_logs` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_actor_created` ON `audit_logs` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_cart_items_cart_variant` ON `cart_items` (`cart_id`,`variant_id`);--> statement-breakpoint
CREATE TABLE `carts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`guest_token` text,
	`currency` text DEFAULT 'VND' NOT NULL,
	`coupon_code` text,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_carts_user_updated` ON `carts` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_carts_guest_token` ON `carts` (`guest_token`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`image_key` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_categories_slug` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_categories_parent_sort` ON `categories` (`parent_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`promotion_id` text NOT NULL,
	`code` text NOT NULL,
	`usage_limit` integer,
	`usage_limit_per_customer` integer DEFAULT 1 NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_coupons_code` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `idx_coupons_promotion` ON `coupons` (`promotion_id`);--> statement-breakpoint
CREATE TABLE `customer_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`status` text DEFAULT 'pending_payment' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`fulfillment_status` text DEFAULT 'unfulfilled' NOT NULL,
	`currency` text DEFAULT 'VND' NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`discount_total_cents` integer DEFAULT 0 NOT NULL,
	`shipping_total_cents` integer DEFAULT 0 NOT NULL,
	`tax_total_cents` integer DEFAULT 0 NOT NULL,
	`grand_total_cents` integer NOT NULL,
	`shipping_address_json` text NOT NULL,
	`billing_address_json` text,
	`customer_note` text,
	`source` text DEFAULT 'web' NOT NULL,
	`placed_at` integer,
	`cancelled_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_customer_orders_order_number` ON `customer_orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `idx_customer_orders_user_created` ON `customer_orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_customer_orders_status_created` ON `customer_orders` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `fulfillment_items` (
	`fulfillment_id` text NOT NULL,
	`order_item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	PRIMARY KEY(`fulfillment_id`, `order_item_id`),
	FOREIGN KEY (`fulfillment_id`) REFERENCES `fulfillments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fulfillments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`warehouse_id` text,
	`provider` text,
	`tracking_number` text,
	`tracking_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`shipping_fee_cents` integer DEFAULT 0 NOT NULL,
	`shipped_at` integer,
	`delivered_at` integer,
	`failed_reason` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `customer_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_fulfillments_order` ON `fulfillments` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_fulfillments_tracking` ON `fulfillments` (`provider`,`tracking_number`);--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`warehouse_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`on_hand` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`safety_stock` integer DEFAULT 0 NOT NULL,
	`reorder_point` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_inventory_items_warehouse_variant` ON `inventory_items` (`warehouse_id`,`variant_id`);--> statement-breakpoint
CREATE INDEX `idx_inventory_items_variant` ON `inventory_items` (`variant_id`);--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`inventory_item_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity_delta` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`reference_type` text,
	`reference_id` text,
	`reason` text NOT NULL,
	`idempotency_key` text,
	`actor_user_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_inventory_movements_idempotency` ON `inventory_movements` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_inventory_movements_item_created` ON `inventory_movements` (`inventory_item_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `inventory_reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`inventory_item_id` text NOT NULL,
	`order_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`expires_at` integer NOT NULL,
	`released_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_reservations_order` ON `inventory_reservations` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_inventory_reservations_expiry` ON `inventory_reservations` (`status`,`expires_at`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`variant_id` text,
	`sku` text NOT NULL,
	`product_name` text NOT NULL,
	`variant_name` text NOT NULL,
	`image_url` text,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `customer_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`promotion_id` text,
	`coupon_id` text,
	`name_snapshot` text NOT NULL,
	`discount_cents` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `customer_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_order_promotions_order` ON `order_promotions` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`reason` text,
	`actor_user_id` text,
	`metadata_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `customer_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_order_status_history_order_created` ON `order_status_history` (`order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` text PRIMARY KEY NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`processed_at` integer,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_outbox_events_status_available` ON `outbox_events` (`status`,`available_at`);--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text,
	`provider` text NOT NULL,
	`provider_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`signature_valid` integer DEFAULT false NOT NULL,
	`payload_json` text NOT NULL,
	`processed_at` integer,
	`processing_error` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_payment_events_provider_event` ON `payment_events` (`provider`,`provider_event_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_payment_id` text,
	`method` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'VND' NOT NULL,
	`idempotency_key` text NOT NULL,
	`failure_code` text,
	`failure_message` text,
	`captured_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `customer_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_payments_idempotency_key` ON `payments` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_payments_order_status` ON `payments` (`order_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_payments_provider_id` ON `payments` (`provider`,`provider_payment_id`);--> statement-breakpoint
CREATE TABLE `product_categories` (
	`product_id` text NOT NULL,
	`category_id` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`product_id`, `category_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_product_categories_category` ON `product_categories` (`category_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `product_media` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`storage_key` text NOT NULL,
	`public_url` text,
	`media_type` text DEFAULT 'image' NOT NULL,
	`alt_text` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_product_media_product_sort` ON `product_media` (`product_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sku` text NOT NULL,
	`barcode` text,
	`size` text NOT NULL,
	`color` text NOT NULL,
	`color_hex` text,
	`price_cents` integer NOT NULL,
	`compare_at_price_cents` integer,
	`cost_cents` integer,
	`weight_grams` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_product_variants_sku` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `idx_product_variants_product_status` ON `product_variants` (`product_id`,`status`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text,
	`description` text NOT NULL,
	`material` text,
	`care_instructions` text,
	`size_guide` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`published_at` integer,
	`seo_title` text,
	`seo_description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_products_slug` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_status_published` ON `products` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_products_featured` ON `products` (`featured`,`status`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`value` integer NOT NULL,
	`min_subtotal_cents` integer DEFAULT 0 NOT NULL,
	`max_discount_cents` integer,
	`usage_limit` integer,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`rules_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_promotions_status_window` ON `promotions` (`status`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`order_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`reason` text NOT NULL,
	`provider_refund_id` text,
	`requested_by` text,
	`processed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `customer_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_refunds_order_status` ON `refunds` (`order_id`,`status`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_roles_code` ON `roles` (`code`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`assigned_by` text,
	`assigned_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_user_roles_role_id` ON `user_roles` (`role_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`external_auth_id` text NOT NULL,
	`email` text NOT NULL,
	`full_name` text,
	`phone` text,
	`avatar_url` text,
	`status` text DEFAULT 'active' NOT NULL,
	`marketing_consent` integer DEFAULT false NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_users_external_auth_id` ON `users` (`external_auth_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_status_created_at` ON `users` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_warehouses_code` ON `warehouses` (`code`);
--> statement-breakpoint
INSERT OR IGNORE INTO roles (id, code, name, description) VALUES
  ('role-customer', 'customer', 'Khách hàng', 'Quản lý hồ sơ và đơn hàng của chính mình'),
  ('role-staff', 'staff', 'Nhân viên vận hành', 'Xử lý đơn, khách hàng và tồn kho'),
  ('role-manager', 'manager', 'Quản lý', 'Quản lý catalog, promotion và báo cáo'),
  ('role-admin', 'admin', 'Quản trị viên', 'Toàn quyền cấu hình hệ thống');
--> statement-breakpoint
INSERT OR IGNORE INTO categories (id, parent_id, slug, name, description, sort_order, status) VALUES
  ('cat-women', NULL, 'nu', 'Nữ', 'Thời trang nữ tối giản, dễ phối', 10, 'active'),
  ('cat-men', NULL, 'nam', 'Nam', 'Thời trang nam hiện đại', 20, 'active'),
  ('cat-accessories', NULL, 'phu-kien', 'Phụ kiện', 'Phụ kiện hoàn thiện trang phục', 30, 'active');
--> statement-breakpoint
INSERT OR IGNORE INTO products (
  id, slug, name, subtitle, description, material, status, featured, published_at
) VALUES
  ('prd-linen-blouse', 'ao-linen-co-v-moc', 'Áo linen cổ V Mộc', 'Nhẹ, thoáng và đứng phom vừa đủ', 'Thiết kế cổ V tối giản với đường vai thả tự nhiên.', '100% linen đã xử lý mềm', 'active', 1, unixepoch() * 1000),
  ('prd-wrap-dress', 'dam-midi-om-nhe-an', 'Đầm midi An', 'Chuyển động mềm, tôn dáng tự nhiên', 'Đầm midi cổ chéo với phần eo điều chỉnh linh hoạt.', 'Tencel pha linen', 'active', 1, unixepoch() * 1000),
  ('prd-wide-pants', 'quan-ong-rong-thanh', 'Quần ống rộng Thanh', 'Đường ly gọn, tỷ lệ chân dài hơn', 'Quần cạp vừa, hai ly trước và ống suông rộng.', 'Cotton twill pha Tencel', 'active', 1, unixepoch() * 1000),
  ('prd-resort-shirt', 'so-mi-resort-tram', 'Sơ mi resort Trầm', 'Thoải mái nhưng vẫn có cấu trúc', 'Sơ mi cổ camp, tay ngắn, đường vai cân đối.', 'Linen pha rayon', 'active', 1, unixepoch() * 1000),
  ('prd-chinos', 'quan-chinos-vung', 'Quần chinos Vững', 'Gọn từ công sở, thoải mái đến cuối tuần', 'Quần chinos dáng tapered, cạp giữa và co giãn nhẹ.', 'Cotton stretch 245gsm', 'active', 0, unixepoch() * 1000),
  ('prd-crossbody', 'tui-deo-cheo-net', 'Túi đeo chéo Nét', 'Gọn đồ cần thiết, bền qua nhiều mùa', 'Túi hộp có ngăn đệm, dây tăng chỉnh và khóa nam châm ẩn.', 'Da bò thuộc bán thực vật', 'active', 0, unixepoch() * 1000);
--> statement-breakpoint
INSERT OR IGNORE INTO product_categories (product_id, category_id, is_primary, sort_order) VALUES
  ('prd-linen-blouse', 'cat-women', 1, 10),
  ('prd-wrap-dress', 'cat-women', 1, 20),
  ('prd-wide-pants', 'cat-women', 1, 30),
  ('prd-resort-shirt', 'cat-men', 1, 10),
  ('prd-chinos', 'cat-men', 1, 20),
  ('prd-crossbody', 'cat-accessories', 1, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO product_variants (
  id, product_id, sku, size, color, color_hex, price_cents, compare_at_price_cents, status
) VALUES
  ('ALM-s', 'prd-linen-blouse', 'NET-ALM-S', 'S', 'Đất nung', '#a65f48', 790000, 890000, 'active'),
  ('ALM-m', 'prd-linen-blouse', 'NET-ALM-M', 'M', 'Đất nung', '#a65f48', 790000, 890000, 'active'),
  ('ALM-l', 'prd-linen-blouse', 'NET-ALM-L', 'L', 'Đất nung', '#a65f48', 790000, 890000, 'active'),
  ('DMA-s', 'prd-wrap-dress', 'NET-DMA-S', 'S', 'Xanh rừng', '#243e34', 1290000, NULL, 'active'),
  ('DMA-m', 'prd-wrap-dress', 'NET-DMA-M', 'M', 'Xanh rừng', '#243e34', 1290000, NULL, 'active'),
  ('DMA-l', 'prd-wrap-dress', 'NET-DMA-L', 'L', 'Xanh rừng', '#243e34', 1290000, NULL, 'active'),
  ('QTT-s', 'prd-wide-pants', 'NET-QTT-S', 'S', 'Kem ngà', '#e8dfcf', 890000, NULL, 'active'),
  ('QTT-m', 'prd-wide-pants', 'NET-QTT-M', 'M', 'Kem ngà', '#e8dfcf', 890000, NULL, 'active'),
  ('QTT-l', 'prd-wide-pants', 'NET-QTT-L', 'L', 'Kem ngà', '#e8dfcf', 890000, NULL, 'active'),
  ('SMT-s', 'prd-resort-shirt', 'NET-SMT-S', 'S', 'Than', '#303331', 690000, NULL, 'active'),
  ('SMT-m', 'prd-resort-shirt', 'NET-SMT-M', 'M', 'Than', '#303331', 690000, NULL, 'active'),
  ('SMT-l', 'prd-resort-shirt', 'NET-SMT-L', 'L', 'Than', '#303331', 690000, NULL, 'active'),
  ('QCV-s', 'prd-chinos', 'NET-QCV-S', 'S', 'Cát', '#cdb58f', 850000, NULL, 'active'),
  ('QCV-m', 'prd-chinos', 'NET-QCV-M', 'M', 'Cát', '#cdb58f', 850000, NULL, 'active'),
  ('QCV-l', 'prd-chinos', 'NET-QCV-L', 'L', 'Cát', '#cdb58f', 850000, NULL, 'active'),
  ('TDN-s', 'prd-crossbody', 'NET-TDN-S', 'One size', 'Nâu đậm', '#49362c', 1490000, NULL, 'active');
--> statement-breakpoint
INSERT OR IGNORE INTO product_media (
  id, product_id, storage_key, public_url, media_type, alt_text, sort_order
) VALUES
  ('media-alm', 'prd-linen-blouse', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Áo linen nữ màu đất nung', 0),
  ('media-dma', 'prd-wrap-dress', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Đầm midi nữ màu xanh rừng', 0),
  ('media-qtt', 'prd-wide-pants', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Quần nữ ống rộng màu kem', 0),
  ('media-smt', 'prd-resort-shirt', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Sơ mi nam resort màu than', 0),
  ('media-qcv', 'prd-chinos', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Quần chinos nam màu cát', 0),
  ('media-tdn', 'prd-crossbody', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Túi đeo chéo da nâu đậm', 0);
--> statement-breakpoint
INSERT OR IGNORE INTO warehouses (id, code, name, address, status) VALUES
  ('wh-hcm', 'HCM-01', 'Kho trung tâm TP.HCM', 'Thành phố Hồ Chí Minh', 'active');
--> statement-breakpoint
INSERT OR IGNORE INTO inventory_items (
  id, warehouse_id, variant_id, on_hand, reserved, safety_stock, reorder_point, version
)
SELECT 'inv-' || id, 'wh-hcm', id,
  CASE WHEN size = 'S' THEN 18 WHEN size = 'M' THEN 14 ELSE 10 END,
  0, 2, 5, 1
FROM product_variants;
--> statement-breakpoint
INSERT OR IGNORE INTO promotions (
  id, name, description, type, value, min_subtotal_cents, max_discount_cents,
  usage_limit, starts_at, ends_at, status
) VALUES
  ('promo-welcome', 'Chào NÉT', 'Giảm 10% cho đơn đầu tiên', 'percentage', 10, 599000, 150000, 1000, unixepoch('now', '-30 day') * 1000, unixepoch('now', '+365 day') * 1000, 'active');
--> statement-breakpoint
INSERT OR IGNORE INTO coupons (
  id, promotion_id, code, usage_limit, usage_limit_per_customer, status
) VALUES ('coupon-welcome', 'promo-welcome', 'CHAONET', 1000, 1, 'active');
--> statement-breakpoint
PRAGMA optimize;
