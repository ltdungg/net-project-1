ALTER TABLE `inventory_operations` ADD `idempotency_key` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_inventory_operations_idempotency` ON `inventory_operations` (`idempotency_key`);