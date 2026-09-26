PRAGMA foreign_keys = ON;

CREATE TRIGGER IF NOT EXISTS trg_inventory_items_balance_insert
BEFORE INSERT ON inventory_items
WHEN NEW.on_hand < 0
  OR NEW.reserved < 0
  OR NEW.reserved > NEW.on_hand
  OR NEW.safety_stock < 0
  OR NEW.reorder_point < 0
BEGIN
  SELECT RAISE(ABORT, 'INVENTORY_BALANCE_INVARIANT');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_items_balance_update
BEFORE UPDATE OF on_hand, reserved, safety_stock, reorder_point
ON inventory_items
WHEN NEW.on_hand < 0
  OR NEW.reserved < 0
  OR NEW.reserved > NEW.on_hand
  OR NEW.safety_stock < 0
  OR NEW.reorder_point < 0
BEGIN
  SELECT RAISE(ABORT, 'INVENTORY_BALANCE_INVARIANT');
END;

PRAGMA optimize;
