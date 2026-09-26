CREATE TABLE `inventory_operation_items` (
	`id` text PRIMARY KEY NOT NULL,
	`operation_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`source_inventory_item_id` text,
	`destination_inventory_item_id` text,
	`quantity` integer NOT NULL,
	`expected_quantity` integer,
	`actual_quantity` integer,
	`variance` integer,
	`unit_cost_cents` integer,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`operation_id`) REFERENCES `inventory_operations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`source_inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`destination_inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_operation_items_operation` ON `inventory_operation_items` (`operation_id`);--> statement-breakpoint
CREATE INDEX `idx_inventory_operation_items_variant` ON `inventory_operation_items` (`variant_id`);--> statement-breakpoint
CREATE TABLE `inventory_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`operation_number` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`source_warehouse_id` text,
	`destination_warehouse_id` text,
	`reference_number` text,
	`reason` text NOT NULL,
	`notes` text,
	`created_by` text,
	`posted_by` text,
	`posted_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`source_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`destination_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_inventory_operations_number` ON `inventory_operations` (`operation_number`);--> statement-breakpoint
CREATE INDEX `idx_inventory_operations_type_status_created` ON `inventory_operations` (`type`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_inventory_operations_source_created` ON `inventory_operations` (`source_warehouse_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_inventory_operations_destination_created` ON `inventory_operations` (`destination_warehouse_id`,`created_at`);