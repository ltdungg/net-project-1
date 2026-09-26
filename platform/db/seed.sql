PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO roles (id, code, name, description) VALUES
  ('role-customer', 'customer', 'Khách hàng', 'Quản lý hồ sơ và đơn hàng của chính mình'),
  ('role-staff', 'staff', 'Nhân viên vận hành', 'Xử lý đơn, khách hàng và tồn kho'),
  ('role-manager', 'manager', 'Quản lý', 'Quản lý catalog, promotion và báo cáo'),
  ('role-admin', 'admin', 'Quản trị viên', 'Toàn quyền cấu hình hệ thống');

INSERT OR IGNORE INTO categories (id, parent_id, slug, name, description, sort_order, status) VALUES
  ('cat-women', NULL, 'nu', 'Nữ', 'Thời trang nữ tối giản, dễ phối', 10, 'active'),
  ('cat-men', NULL, 'nam', 'Nam', 'Thời trang nam hiện đại', 20, 'active'),
  ('cat-accessories', NULL, 'phu-kien', 'Phụ kiện', 'Phụ kiện hoàn thiện trang phục', 30, 'active');

INSERT OR IGNORE INTO products (
  id, slug, name, subtitle, description, material, status, featured, published_at
) VALUES
  ('prd-linen-blouse', 'ao-linen-co-v-moc', 'Áo linen cổ V Mộc', 'Nhẹ, thoáng và đứng phom vừa đủ', 'Thiết kế cổ V tối giản với đường vai thả tự nhiên.', '100% linen đã xử lý mềm', 'active', 1, unixepoch() * 1000),
  ('prd-wrap-dress', 'dam-midi-om-nhe-an', 'Đầm midi An', 'Chuyển động mềm, tôn dáng tự nhiên', 'Đầm midi cổ chéo với phần eo điều chỉnh linh hoạt.', 'Tencel pha linen', 'active', 1, unixepoch() * 1000),
  ('prd-wide-pants', 'quan-ong-rong-thanh', 'Quần ống rộng Thanh', 'Đường ly gọn, tỷ lệ chân dài hơn', 'Quần cạp vừa, hai ly trước và ống suông rộng.', 'Cotton twill pha Tencel', 'active', 1, unixepoch() * 1000),
  ('prd-resort-shirt', 'so-mi-resort-tram', 'Sơ mi resort Trầm', 'Thoải mái nhưng vẫn có cấu trúc', 'Sơ mi cổ camp, tay ngắn, đường vai cân đối.', 'Linen pha rayon', 'active', 1, unixepoch() * 1000),
  ('prd-chinos', 'quan-chinos-vung', 'Quần chinos Vững', 'Gọn từ công sở, thoải mái đến cuối tuần', 'Quần chinos dáng tapered, cạp giữa và co giãn nhẹ.', 'Cotton stretch 245gsm', 'active', 0, unixepoch() * 1000),
  ('prd-crossbody', 'tui-deo-cheo-net', 'Túi đeo chéo Nét', 'Gọn đồ cần thiết, bền qua nhiều mùa', 'Túi hộp có ngăn đệm, dây tăng chỉnh và khóa nam châm ẩn.', 'Da bò thuộc bán thực vật', 'active', 0, unixepoch() * 1000);

INSERT OR IGNORE INTO product_categories (product_id, category_id, is_primary, sort_order) VALUES
  ('prd-linen-blouse', 'cat-women', 1, 10),
  ('prd-wrap-dress', 'cat-women', 1, 20),
  ('prd-wide-pants', 'cat-women', 1, 30),
  ('prd-resort-shirt', 'cat-men', 1, 10),
  ('prd-chinos', 'cat-men', 1, 20),
  ('prd-crossbody', 'cat-accessories', 1, 10);

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

INSERT OR IGNORE INTO product_media (
  id, product_id, storage_key, public_url, media_type, alt_text, sort_order
) VALUES
  ('media-alm', 'prd-linen-blouse', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Áo linen nữ màu đất nung', 0),
  ('media-dma', 'prd-wrap-dress', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Đầm midi nữ màu xanh rừng', 0),
  ('media-qtt', 'prd-wide-pants', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Quần nữ ống rộng màu kem', 0),
  ('media-smt', 'prd-resort-shirt', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Sơ mi nam resort màu than', 0),
  ('media-qcv', 'prd-chinos', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Quần chinos nam màu cát', 0),
  ('media-tdn', 'prd-crossbody', 'seed/product-atlas.png', '/product-atlas.png', 'image', 'Túi đeo chéo da nâu đậm', 0);

INSERT OR IGNORE INTO warehouses (id, code, name, address, status) VALUES
  ('wh-hcm', 'HCM-01', 'Kho trung tâm TP.HCM', 'Thành phố Hồ Chí Minh', 'active');

INSERT OR IGNORE INTO inventory_items (
  id, warehouse_id, variant_id, on_hand, reserved, safety_stock, reorder_point, version
)
SELECT 'inv-' || id, 'wh-hcm', id,
  CASE WHEN size = 'S' THEN 18 WHEN size = 'M' THEN 14 ELSE 10 END,
  0, 2, 5, 1
FROM product_variants;

INSERT OR IGNORE INTO promotions (
  id, name, description, type, value, min_subtotal_cents, max_discount_cents,
  usage_limit, starts_at, ends_at, status
) VALUES
  ('promo-welcome', 'Chào NÉT', 'Giảm 10% cho đơn đầu tiên', 'percentage', 10, 599000, 150000, 1000, unixepoch('now', '-30 day') * 1000, unixepoch('now', '+365 day') * 1000, 'active');

INSERT OR IGNORE INTO coupons (
  id, promotion_id, code, usage_limit, usage_limit_per_customer, status
) VALUES ('coupon-welcome', 'promo-welcome', 'CHAONET', 1000, 1, 'active');

PRAGMA optimize;
