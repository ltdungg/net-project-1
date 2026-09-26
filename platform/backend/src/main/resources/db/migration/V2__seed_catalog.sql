insert into roles(id,code,name,description) values
 ('role-customer','customer','Khách hàng','Quản lý hồ sơ và đơn hàng của chính mình'),
 ('role-staff','staff','Nhân viên vận hành','Xử lý đơn, khách hàng và tồn kho'),
 ('role-manager','manager','Quản lý','Quản lý catalog, promotion và báo cáo'),
 ('role-admin','admin','Quản trị viên','Toàn quyền cấu hình hệ thống')
on conflict do nothing;

insert into categories(id,parent_id,slug,name,description,sort_order,status) values
 ('cat-women',null,'nu','Nữ','Thời trang nữ tối giản, dễ phối',10,'active'),
 ('cat-men',null,'nam','Nam','Thời trang nam hiện đại',20,'active'),
 ('cat-accessories',null,'phu-kien','Phụ kiện','Phụ kiện hoàn thiện trang phục',30,'active')
on conflict do nothing;

insert into products(id,slug,name,subtitle,description,material,status,featured,published_at) values
 ('prd-linen-blouse','ao-linen-co-v-moc','Áo linen cổ V Mộc','Nhẹ, thoáng và đứng phom vừa đủ','Thiết kế cổ V tối giản với đường vai thả tự nhiên.','100% linen đã xử lý mềm','active',true,now()),
 ('prd-wrap-dress','dam-midi-om-nhe-an','Đầm midi An','Chuyển động mềm, tôn dáng tự nhiên','Đầm midi cổ chéo với phần eo điều chỉnh linh hoạt.','Tencel pha linen','active',true,now()),
 ('prd-wide-pants','quan-ong-rong-thanh','Quần ống rộng Thanh','Đường ly gọn, tỷ lệ chân dài hơn','Quần cạp vừa, hai ly trước và ống suông rộng.','Cotton twill pha Tencel','active',true,now()),
 ('prd-resort-shirt','so-mi-resort-tram','Sơ mi resort Trầm','Thoải mái nhưng vẫn có cấu trúc','Sơ mi cổ camp, tay ngắn, đường vai cân đối.','Linen pha rayon','active',true,now()),
 ('prd-chinos','quan-chinos-vung','Quần chinos Vững','Gọn từ công sở, thoải mái đến cuối tuần','Quần chinos dáng tapered, cạp giữa và co giãn nhẹ.','Cotton stretch 245gsm','active',false,now()),
 ('prd-crossbody','tui-deo-cheo-net','Túi đeo chéo Nét','Gọn đồ cần thiết, bền qua nhiều mùa','Túi hộp có ngăn đệm, dây tăng chỉnh và khóa nam châm ẩn.','Da bò thuộc bán thực vật','active',false,now())
on conflict do nothing;

insert into product_categories(product_id,category_id,is_primary,sort_order) values
 ('prd-linen-blouse','cat-women',true,10),('prd-wrap-dress','cat-women',true,20),
 ('prd-wide-pants','cat-women',true,30),('prd-resort-shirt','cat-men',true,10),
 ('prd-chinos','cat-men',true,20),('prd-crossbody','cat-accessories',true,10)
on conflict do nothing;

insert into product_variants(id,product_id,sku,size,color,color_hex,price_cents,compare_at_price_cents,status) values
 ('ALM-s','prd-linen-blouse','NET-ALM-S','S','Đất nung','#a65f48',790000,890000,'active'),
 ('ALM-m','prd-linen-blouse','NET-ALM-M','M','Đất nung','#a65f48',790000,890000,'active'),
 ('ALM-l','prd-linen-blouse','NET-ALM-L','L','Đất nung','#a65f48',790000,890000,'active'),
 ('DMA-s','prd-wrap-dress','NET-DMA-S','S','Xanh rừng','#243e34',1290000,null,'active'),
 ('DMA-m','prd-wrap-dress','NET-DMA-M','M','Xanh rừng','#243e34',1290000,null,'active'),
 ('DMA-l','prd-wrap-dress','NET-DMA-L','L','Xanh rừng','#243e34',1290000,null,'active'),
 ('QTT-s','prd-wide-pants','NET-QTT-S','S','Kem ngà','#e8dfcf',890000,null,'active'),
 ('QTT-m','prd-wide-pants','NET-QTT-M','M','Kem ngà','#e8dfcf',890000,null,'active'),
 ('QTT-l','prd-wide-pants','NET-QTT-L','L','Kem ngà','#e8dfcf',890000,null,'active'),
 ('SMT-s','prd-resort-shirt','NET-SMT-S','S','Than','#303331',690000,null,'active'),
 ('SMT-m','prd-resort-shirt','NET-SMT-M','M','Than','#303331',690000,null,'active'),
 ('SMT-l','prd-resort-shirt','NET-SMT-L','L','Than','#303331',690000,null,'active'),
 ('QCV-s','prd-chinos','NET-QCV-S','S','Cát','#cdb58f',850000,null,'active'),
 ('QCV-m','prd-chinos','NET-QCV-M','M','Cát','#cdb58f',850000,null,'active'),
 ('QCV-l','prd-chinos','NET-QCV-L','L','Cát','#cdb58f',850000,null,'active'),
 ('TDN-s','prd-crossbody','NET-TDN-S','One size','Nâu đậm','#49362c',1490000,null,'active')
on conflict do nothing;

insert into product_media(id,product_id,storage_key,public_url,media_type,alt_text,sort_order) values
 ('media-alm','prd-linen-blouse','seed/product-atlas.png','/product-atlas.png','image','Áo linen nữ màu đất nung',0),
 ('media-dma','prd-wrap-dress','seed/product-atlas.png','/product-atlas.png','image','Đầm midi nữ màu xanh rừng',0),
 ('media-qtt','prd-wide-pants','seed/product-atlas.png','/product-atlas.png','image','Quần nữ ống rộng màu kem',0),
 ('media-smt','prd-resort-shirt','seed/product-atlas.png','/product-atlas.png','image','Sơ mi nam resort màu than',0),
 ('media-qcv','prd-chinos','seed/product-atlas.png','/product-atlas.png','image','Quần chinos nam màu cát',0),
 ('media-tdn','prd-crossbody','seed/product-atlas.png','/product-atlas.png','image','Túi đeo chéo da nâu đậm',0)
on conflict do nothing;

insert into warehouses(id,code,name,address,status) values
 ('wh-hcm','HCM-01','Kho trung tâm TP.HCM','Thành phố Hồ Chí Minh','active'),
 ('wh-hn','HN-01','Kho Hà Nội','Thành phố Hà Nội','active')
on conflict do nothing;

insert into inventory_items(id,warehouse_id,variant_id,on_hand,reserved,safety_stock,reorder_point,version)
select 'inv-hcm-' || id,'wh-hcm',id,case when size='S' then 18 when size='M' then 14 else 10 end,0,2,5,1
from product_variants on conflict do nothing;

insert into inventory_items(id,warehouse_id,variant_id,on_hand,reserved,safety_stock,reorder_point,version)
select 'inv-hn-' || id,'wh-hn',id,case when size='S' then 8 when size='M' then 6 else 4 end,0,1,3,1
from product_variants on conflict do nothing;

insert into promotions(id,name,description,type,value,min_subtotal_cents,max_discount_cents,usage_limit,starts_at,ends_at,status) values
 ('promo-welcome','Chào NÉT','Giảm 10% cho đơn đầu tiên','percentage',10,599000,150000,1000,now()-interval '30 days',now()+interval '365 days','active'),
 ('promo-freeship','Miễn phí giao hàng','Miễn phí giao hàng toàn quốc','free_shipping',0,399000,null,500,now()-interval '30 days',now()+interval '365 days','active'),
 ('promo-net20','NÉT 20','Giảm 20% tối đa 250.000đ','percentage',20,1499000,250000,300,now()-interval '30 days',now()+interval '180 days','active')
on conflict do nothing;

insert into coupons(id,promotion_id,code,usage_limit,usage_limit_per_customer,status) values
 ('coupon-welcome','promo-welcome','CHAONET',1000,1,'active'),
 ('coupon-freeship','promo-freeship','FREESHIP',500,3,'active'),
 ('coupon-net20','promo-net20','NET20',300,1,'active')
on conflict do nothing;
