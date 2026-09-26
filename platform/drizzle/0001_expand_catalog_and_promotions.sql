PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO products (
  id, slug, name, subtitle, description, material, status, featured, published_at
) VALUES
  ('prd-overshirt-am', 'ao-khoac-overshirt-am', 'Overshirt dạ Ấm', 'Lớp khoác nhẹ cho những ngày chuyển mùa', 'Áo khoác overshirt phom thẳng với túi hộp cân đối.', 'Dạ wool pha tái chế 320gsm', 'active', 1, unixepoch() * 1000),
  ('prd-knit-polo-khoi', 'polo-det-kim-khoi', 'Polo dệt kim Khôi', 'Mềm, thoáng và lịch thiệp không gắng gượng', 'Polo cổ mở dệt kim mịn với độ rũ tự nhiên.', 'Cotton compact pha modal', 'active', 1, unixepoch() * 1000),
  ('prd-silk-blouse-vang', 'so-mi-lua-vang', 'Sơ mi lụa Vang', 'Bề mặt óng nhẹ, chuyển động thanh lịch', 'Sơ mi cổ mềm với hàng nút giấu tinh giản.', 'Lụa tơ tằm pha Tencel', 'active', 0, unixepoch() * 1000),
  ('prd-trench-sa', 'trench-coat-sa', 'Trench coat Sa', 'Cấu trúc cổ điển, tỷ lệ dành cho vóc dáng Việt', 'Trench coat hai hàng nút và đai eo linh hoạt.', 'Cotton gabardine chống thấm nhẹ', 'active', 1, unixepoch() * 1000),
  ('prd-pleated-skirt-reu', 'chan-vay-xep-ly-reu', 'Chân váy xếp ly Rêu', 'Nhịp chuyển động mềm và gọn', 'Chân váy midi xếp ly nhỏ với cạp tăng chỉnh.', 'Poly tái chế chống nhăn', 'active', 0, unixepoch() * 1000),
  ('prd-tapered-jeans-lam', 'jeans-ong-con-lam', 'Jeans ống côn Lam', 'Denim đứng phom, mềm dần theo thời gian', 'Quần jeans cạp vừa với ống côn nhẹ.', 'Denim cotton 12oz', 'active', 0, unixepoch() * 1000),
  ('prd-cardigan-moc', 'cardigan-det-moc', 'Cardigan dệt Mộc', 'Lớp dệt êm cho điều hòa và chiều muộn', 'Cardigan cổ V với bo dệt giữ phom.', 'Cotton Supima pha wool mịn', 'active', 1, unixepoch() * 1000),
  ('prd-satin-dress-hoang-hon', 'dam-satin-hoang-hon', 'Đầm satin Hoàng Hôn', 'Độ rủ vừa đủ cho những dịp đặc biệt', 'Đầm hai dây midi cắt xéo, dây vai tăng chỉnh.', 'Satin Tencel có lớp lót', 'active', 0, unixepoch() * 1000),
  ('prd-bomber-toi-gian', 'bomber-toi-gian', 'Bomber Tối Giản', 'Gọn, nhẹ và linh hoạt trong mọi lịch trình', 'Bomber không logo với khóa hai chiều và túi ẩn.', 'Nylon tái chế phủ mờ', 'active', 1, unixepoch() * 1000),
  ('prd-oxford-thanh', 'so-mi-oxford-thanh', 'Sơ mi Oxford Thanh', 'Chỉn chu mỗi ngày, không cần cầu kỳ', 'Sơ mi button-down với cổ áo cân đối.', 'Oxford cotton chải mềm', 'active', 0, unixepoch() * 1000),
  ('prd-linen-blazer-hien', 'blazer-linen-hien', 'Blazer linen Hiên', 'Cấu trúc mềm cho ngày làm việc dài', 'Blazer một hàng nút với vai không đệm.', 'Linen pha Tencel có lót bán phần', 'active', 1, unixepoch() * 1000),
  ('prd-cargo-moc', 'quan-cargo-moc', 'Quần cargo Mộc', 'Tiện dụng được tiết chế để vẫn gọn gàng', 'Cargo dáng thẳng với túi hộp phẳng.', 'Cotton ripstop mềm', 'active', 0, unixepoch() * 1000),
  ('prd-tote-doanh', 'tui-tote-da-doanh', 'Túi tote da Doanh', 'Đủ chỗ cho laptop và một ngày bận rộn', 'Tote da dáng đứng với ngăn laptop 14 inch.', 'Da bò hạt tự nhiên', 'active', 1, unixepoch() * 1000),
  ('prd-loafer-tram', 'loafer-da-tram', 'Loafer da Trầm', 'Đế êm, phom gọn cho nhiều hoàn cảnh', 'Loafer penny may viền với đế cao su mảnh.', 'Da bò full-grain', 'active', 0, unixepoch() * 1000),
  ('prd-silk-scarf-tho', 'khan-lua-tho', 'Khăn lụa Thổ', 'Một điểm màu, nhiều cách phối', 'Khăn vuông 70 cm với mép cuốn tay.', '100% lụa tơ tằm', 'active', 0, unixepoch() * 1000),
  ('prd-cap-rung', 'mu-luoi-trai-rung', 'Mũ lưỡi trai Rừng', 'Điểm hoàn thiện giản dị cho ngày ngoài trời', 'Mũ sáu múi không logo với khóa tăng chỉnh.', 'Cotton twill hữu cơ', 'active', 0, unixepoch() * 1000);

INSERT OR IGNORE INTO product_categories (product_id, category_id, is_primary, sort_order) VALUES
  ('prd-overshirt-am', 'cat-women', 1, 40),
  ('prd-silk-blouse-vang', 'cat-women', 1, 50),
  ('prd-trench-sa', 'cat-women', 1, 60),
  ('prd-pleated-skirt-reu', 'cat-women', 1, 70),
  ('prd-cardigan-moc', 'cat-women', 1, 80),
  ('prd-satin-dress-hoang-hon', 'cat-women', 1, 90),
  ('prd-linen-blazer-hien', 'cat-women', 1, 100),
  ('prd-knit-polo-khoi', 'cat-men', 1, 30),
  ('prd-tapered-jeans-lam', 'cat-men', 1, 40),
  ('prd-bomber-toi-gian', 'cat-men', 1, 50),
  ('prd-oxford-thanh', 'cat-men', 1, 60),
  ('prd-cargo-moc', 'cat-men', 1, 70),
  ('prd-tote-doanh', 'cat-accessories', 1, 20),
  ('prd-loafer-tram', 'cat-accessories', 1, 30),
  ('prd-silk-scarf-tho', 'cat-accessories', 1, 40),
  ('prd-cap-rung', 'cat-accessories', 1, 50);

INSERT OR IGNORE INTO product_variants (
  id, product_id, sku, size, color, color_hex, price_cents, compare_at_price_cents, status
) VALUES
  ('OSA-s', 'prd-overshirt-am', 'NET-OSA-S', 'S', 'Gạch nung', '#a34f32', 1490000, NULL, 'active'),
  ('OSA-m', 'prd-overshirt-am', 'NET-OSA-M', 'M', 'Gạch nung', '#a34f32', 1490000, NULL, 'active'),
  ('OSA-l', 'prd-overshirt-am', 'NET-OSA-L', 'L', 'Gạch nung', '#a34f32', 1490000, NULL, 'active'),
  ('PDK-s', 'prd-knit-polo-khoi', 'NET-PDK-S', 'S', 'Kem sữa', '#eee4d2', 750000, NULL, 'active'),
  ('PDK-m', 'prd-knit-polo-khoi', 'NET-PDK-M', 'M', 'Kem sữa', '#eee4d2', 750000, NULL, 'active'),
  ('PDK-l', 'prd-knit-polo-khoi', 'NET-PDK-L', 'L', 'Kem sữa', '#eee4d2', 750000, NULL, 'active'),
  ('SLV-s', 'prd-silk-blouse-vang', 'NET-SLV-S', 'S', 'Đỏ vang', '#6f2028', 890000, 1050000, 'active'),
  ('SLV-m', 'prd-silk-blouse-vang', 'NET-SLV-M', 'M', 'Đỏ vang', '#6f2028', 890000, 1050000, 'active'),
  ('SLV-l', 'prd-silk-blouse-vang', 'NET-SLV-L', 'L', 'Đỏ vang', '#6f2028', 890000, 1050000, 'active'),
  ('TCS-s', 'prd-trench-sa', 'NET-TCS-S', 'S', 'Cát', '#c9ad82', 1990000, NULL, 'active'),
  ('TCS-m', 'prd-trench-sa', 'NET-TCS-M', 'M', 'Cát', '#c9ad82', 1990000, NULL, 'active'),
  ('TCS-l', 'prd-trench-sa', 'NET-TCS-L', 'L', 'Cát', '#c9ad82', 1990000, NULL, 'active'),
  ('CVR-s', 'prd-pleated-skirt-reu', 'NET-CVR-S', 'S', 'Rêu ô-liu', '#6f7142', 850000, NULL, 'active'),
  ('CVR-m', 'prd-pleated-skirt-reu', 'NET-CVR-M', 'M', 'Rêu ô-liu', '#6f7142', 850000, NULL, 'active'),
  ('CVR-l', 'prd-pleated-skirt-reu', 'NET-CVR-L', 'L', 'Rêu ô-liu', '#6f7142', 850000, NULL, 'active'),
  ('JCL-s', 'prd-tapered-jeans-lam', 'NET-JCL-S', 'S', 'Indigo', '#24364d', 920000, NULL, 'active'),
  ('JCL-m', 'prd-tapered-jeans-lam', 'NET-JCL-M', 'M', 'Indigo', '#24364d', 920000, NULL, 'active'),
  ('JCL-l', 'prd-tapered-jeans-lam', 'NET-JCL-L', 'L', 'Indigo', '#24364d', 920000, NULL, 'active'),
  ('CDM-s', 'prd-cardigan-moc', 'NET-CDM-S', 'S', 'Xanh rừng', '#264934', 980000, NULL, 'active'),
  ('CDM-m', 'prd-cardigan-moc', 'NET-CDM-M', 'M', 'Xanh rừng', '#264934', 980000, NULL, 'active'),
  ('CDM-l', 'prd-cardigan-moc', 'NET-CDM-L', 'L', 'Xanh rừng', '#264934', 980000, NULL, 'active'),
  ('DSH-s', 'prd-satin-dress-hoang-hon', 'NET-DSH-S', 'S', 'Hoàng hôn', '#a54f38', 1450000, NULL, 'active'),
  ('DSH-m', 'prd-satin-dress-hoang-hon', 'NET-DSH-M', 'M', 'Hoàng hôn', '#a54f38', 1450000, NULL, 'active'),
  ('DSH-l', 'prd-satin-dress-hoang-hon', 'NET-DSH-L', 'L', 'Hoàng hôn', '#a54f38', 1450000, NULL, 'active'),
  ('BTG-s', 'prd-bomber-toi-gian', 'NET-BTG-S', 'S', 'Than', '#2f302e', 1350000, NULL, 'active'),
  ('BTG-m', 'prd-bomber-toi-gian', 'NET-BTG-M', 'M', 'Than', '#2f302e', 1350000, NULL, 'active'),
  ('BTG-l', 'prd-bomber-toi-gian', 'NET-BTG-L', 'L', 'Than', '#2f302e', 1350000, NULL, 'active'),
  ('SOT-s', 'prd-oxford-thanh', 'NET-SOT-S', 'S', 'Xanh trời', '#a9c3dd', 760000, NULL, 'active'),
  ('SOT-m', 'prd-oxford-thanh', 'NET-SOT-M', 'M', 'Xanh trời', '#a9c3dd', 760000, NULL, 'active'),
  ('SOT-l', 'prd-oxford-thanh', 'NET-SOT-L', 'L', 'Xanh trời', '#a9c3dd', 760000, NULL, 'active'),
  ('BLH-s', 'prd-linen-blazer-hien', 'NET-BLH-S', 'S', 'Be sương', '#d8c8ad', 1690000, NULL, 'active'),
  ('BLH-m', 'prd-linen-blazer-hien', 'NET-BLH-M', 'M', 'Be sương', '#d8c8ad', 1690000, NULL, 'active'),
  ('BLH-l', 'prd-linen-blazer-hien', 'NET-BLH-L', 'L', 'Be sương', '#d8c8ad', 1690000, NULL, 'active'),
  ('QCM-s', 'prd-cargo-moc', 'NET-QCM-S', 'S', 'Rêu', '#5b6345', 990000, NULL, 'active'),
  ('QCM-m', 'prd-cargo-moc', 'NET-QCM-M', 'M', 'Rêu', '#5b6345', 990000, NULL, 'active'),
  ('QCM-l', 'prd-cargo-moc', 'NET-QCM-L', 'L', 'Rêu', '#5b6345', 990000, NULL, 'active'),
  ('TTD-one-size', 'prd-tote-doanh', 'NET-TTD-ONE', 'One size', 'Cognac', '#9a4f22', 1890000, NULL, 'active'),
  ('LDT-39', 'prd-loafer-tram', 'NET-LDT-39', '39', 'Nâu trầm', '#3c281f', 1590000, NULL, 'active'),
  ('LDT-40', 'prd-loafer-tram', 'NET-LDT-40', '40', 'Nâu trầm', '#3c281f', 1590000, NULL, 'active'),
  ('LDT-41', 'prd-loafer-tram', 'NET-LDT-41', '41', 'Nâu trầm', '#3c281f', 1590000, NULL, 'active'),
  ('KLT-one-size', 'prd-silk-scarf-tho', 'NET-KLT-ONE', 'One size', 'Gạch / Kem', '#a45334', 590000, NULL, 'active'),
  ('MLR-one-size', 'prd-cap-rung', 'NET-MLR-ONE', 'One size', 'Xanh rừng', '#244632', 450000, NULL, 'active');

INSERT OR IGNORE INTO product_media (
  id, product_id, storage_key, public_url, media_type, alt_text, sort_order
)
SELECT 'media-v2-' || id, id, 'seed/catalog-atlas-v2.png', '/catalog-atlas-v2.png', 'image', name, 0
FROM products
WHERE id IN (
  'prd-overshirt-am', 'prd-knit-polo-khoi', 'prd-silk-blouse-vang', 'prd-trench-sa',
  'prd-pleated-skirt-reu', 'prd-tapered-jeans-lam', 'prd-cardigan-moc',
  'prd-satin-dress-hoang-hon', 'prd-bomber-toi-gian', 'prd-oxford-thanh',
  'prd-linen-blazer-hien', 'prd-cargo-moc', 'prd-tote-doanh', 'prd-loafer-tram',
  'prd-silk-scarf-tho', 'prd-cap-rung'
);

INSERT OR IGNORE INTO inventory_items (
  id, warehouse_id, variant_id, on_hand, reserved, safety_stock, reorder_point, version
)
SELECT 'inv-' || id, 'wh-hcm', id,
  CASE WHEN size IN ('One size', '39', '40', '41') THEN 12 WHEN size = 'S' THEN 16 WHEN size = 'M' THEN 14 ELSE 10 END,
  0, 2, 5, 1
FROM product_variants
WHERE product_id IN (
  'prd-overshirt-am', 'prd-knit-polo-khoi', 'prd-silk-blouse-vang', 'prd-trench-sa',
  'prd-pleated-skirt-reu', 'prd-tapered-jeans-lam', 'prd-cardigan-moc',
  'prd-satin-dress-hoang-hon', 'prd-bomber-toi-gian', 'prd-oxford-thanh',
  'prd-linen-blazer-hien', 'prd-cargo-moc', 'prd-tote-doanh', 'prd-loafer-tram',
  'prd-silk-scarf-tho', 'prd-cap-rung'
);

INSERT OR IGNORE INTO promotions (
  id, name, description, type, value, min_subtotal_cents, max_discount_cents,
  usage_limit, starts_at, ends_at, status
) VALUES
  ('promo-net20', 'NÉT 20', 'Giảm 20% cho đơn từ 1.500.000đ', 'percentage', 20, 1500000, 300000, 500, unixepoch('now', '-1 day') * 1000, unixepoch('now', '+180 day') * 1000, 'active'),
  ('promo-freeship', 'Giao hàng 0đ', 'Miễn phí giao hàng cho đơn từ 399.000đ', 'free_shipping', 35000, 399000, 35000, 2000, unixepoch('now', '-1 day') * 1000, unixepoch('now', '+180 day') * 1000, 'active');

INSERT OR IGNORE INTO coupons (
  id, promotion_id, code, usage_limit, usage_limit_per_customer, status
) VALUES
  ('coupon-net20', 'promo-net20', 'NET20', 500, 1, 'active'),
  ('coupon-freeship', 'promo-freeship', 'FREESHIP', 2000, 5, 'active');

PRAGMA optimize;
