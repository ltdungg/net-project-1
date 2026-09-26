PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO warehouses (
  id, code, name, address, status, created_at, updated_at
) VALUES (
  'wh-hn',
  'HN-01',
  'Kho phân phối Hà Nội',
  'Quận Long Biên, Hà Nội',
  'active',
  unixepoch() * 1000,
  unixepoch() * 1000
);

PRAGMA optimize;
