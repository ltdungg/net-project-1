with seed(id,slug,name,subtitle,description,material,category_id,featured,code,color,color_hex,price_cents,compare_at_price_cents) as (
  values
    ('prd-overshirt-am','ao-khoac-overshirt-am','Overshirt dạ Ấm','Lớp khoác nhẹ cho những ngày chuyển mùa','Áo khoác overshirt phom thẳng với túi hộp cân đối, đủ ấm khi sáng sớm nhưng vẫn nhẹ để mặc cả ngày.','Dạ wool pha tái chế 320gsm','cat-women',true,'OSA','Gạch nung','#a34f32',1490000,cast(null as bigint)),
    ('prd-knit-polo-khoi','polo-det-kim-khoi','Polo dệt kim Khôi','Mềm, thoáng và lịch thiệp không gắng gượng','Polo cổ mở dệt kim mịn, vai vừa và độ rũ tự nhiên. Dễ phối cùng chinos hoặc jeans.','Cotton compact pha modal','cat-men',true,'PDK','Kem sữa','#eee4d2',750000,null),
    ('prd-silk-blouse-vang','so-mi-lua-vang','Sơ mi lụa Vang','Bề mặt óng nhẹ, chuyển động thanh lịch','Sơ mi cổ mềm với hàng nút giấu tinh giản. Phom suông vừa giúp chất lụa rủ đẹp.','Lụa tơ tằm pha Tencel','cat-women',false,'SLV','Đỏ vang','#6f2028',890000,1050000),
    ('prd-trench-sa','trench-coat-sa','Trench coat Sa','Cấu trúc cổ điển, tỷ lệ dành cho vóc dáng Việt','Trench coat hai hàng nút, đai eo linh hoạt và chiều dài qua gối. Lớp vải chống thấm nhẹ.','Cotton gabardine chống thấm nhẹ','cat-women',true,'TCS','Cát','#c9ad82',1990000,null),
    ('prd-pleated-skirt-reu','chan-vay-xep-ly-reu','Chân váy xếp ly Rêu','Nhịp chuyển động mềm và gọn','Chân váy midi xếp ly nhỏ, cạp phẳng phía trước và chun ẩn phía sau.','Poly tái chế chống nhăn','cat-women',false,'CVR','Rêu ô-liu','#6f7142',850000,null),
    ('prd-tapered-jeans-lam','jeans-ong-con-lam','Jeans ống côn Lam','Denim đứng phom, mềm dần theo thời gian','Quần jeans cạp vừa với phần đùi thoải mái và ống côn nhẹ.','Denim cotton 12oz','cat-men',false,'JCL','Indigo','#24364d',920000,null),
    ('prd-cardigan-moc','cardigan-det-moc','Cardigan dệt Mộc','Lớp dệt êm cho điều hòa và chiều muộn','Cardigan cổ V, hàng nút sừng sinh học và bo dệt giữ phom.','Cotton Supima pha wool mịn','cat-women',true,'CDM','Xanh rừng','#264934',980000,null),
    ('prd-satin-dress-hoang-hon','dam-satin-hoang-hon','Đầm satin Hoàng Hôn','Độ rủ vừa đủ cho những dịp đặc biệt','Đầm hai dây midi cắt xéo giúp bề mặt satin đổ mềm tự nhiên.','Satin Tencel có lớp lót','cat-women',false,'DSH','Hoàng hôn','#a54f38',1450000,null),
    ('prd-bomber-toi-gian','bomber-toi-gian','Bomber Tối Giản','Gọn, nhẹ và linh hoạt trong mọi lịch trình','Bomber không logo với khóa hai chiều, túi ẩn và lớp lót thoáng.','Nylon tái chế phủ mờ','cat-men',true,'BTG','Than','#2f302e',1350000,null),
    ('prd-oxford-thanh','so-mi-oxford-thanh','Sơ mi Oxford Thanh','Chỉn chu mỗi ngày, không cần cầu kỳ','Sơ mi button-down với cổ áo cân đối, nẹp gọn và đường vai tự nhiên.','Oxford cotton chải mềm','cat-men',false,'SOT','Xanh trời','#a9c3dd',760000,null),
    ('prd-linen-blazer-hien','blazer-linen-hien','Blazer linen Hiên','Cấu trúc mềm cho ngày làm việc dài','Blazer một hàng nút, vai không đệm và lớp dựng bán phần.','Linen pha Tencel có lót bán phần','cat-women',true,'BLH','Be sương','#d8c8ad',1690000,null),
    ('prd-cargo-moc','quan-cargo-moc','Quần cargo Mộc','Tiện dụng được tiết chế để vẫn gọn gàng','Cargo dáng thẳng với túi hộp phẳng, cạp tăng chỉnh trong và gấu có khóa ẩn.','Cotton ripstop mềm','cat-men',false,'QCM','Rêu','#5b6345',990000,null),
    ('prd-tote-doanh','tui-tote-da-doanh','Túi tote da Doanh','Đủ chỗ cho laptop và một ngày bận rộn','Tote da dáng đứng, ngăn laptop 14 inch và túi khóa kéo.','Da bò hạt tự nhiên','cat-accessories',true,'TTD','Cognac','#9a4f22',1890000,null),
    ('prd-loafer-tram','loafer-da-tram','Loafer da Trầm','Đế êm, phom gọn cho nhiều hoàn cảnh','Loafer penny may viền thủ công, đế cao su mảnh và lót da thấm hút.','Da bò full-grain','cat-accessories',false,'LDT','Nâu trầm','#3c281f',1590000,null),
    ('prd-silk-scarf-tho','khan-lua-tho','Khăn lụa Thổ','Một điểm màu, nhiều cách phối','Khăn vuông 70 cm với họa tiết hình học tối giản và mép cuốn tay.','100% lụa tơ tằm','cat-accessories',false,'KLT','Gạch / Kem','#a45334',590000,null),
    ('prd-cap-rung','mu-luoi-trai-rung','Mũ lưỡi trai Rừng','Điểm hoàn thiện giản dị cho ngày ngoài trời','Mũ sáu múi không logo, vành cong vừa và khóa tăng chỉnh bằng kim loại mờ.','Cotton twill hữu cơ','cat-accessories',false,'MLR','Xanh rừng','#244632',450000,null)
)
insert into products(id,slug,name,subtitle,description,material,status,featured,published_at)
select id,slug,name,subtitle,description,material,'active',featured,now() from seed
on conflict do nothing;

insert into product_categories(product_id,category_id,is_primary,sort_order)
select p.id,
  case when p.id in ('prd-knit-polo-khoi','prd-tapered-jeans-lam','prd-bomber-toi-gian','prd-oxford-thanh','prd-cargo-moc') then 'cat-men'
       when p.id in ('prd-tote-doanh','prd-loafer-tram','prd-silk-scarf-tho','prd-cap-rung') then 'cat-accessories'
       else 'cat-women' end,
  true,100
from products p
where p.id in (
  'prd-overshirt-am','prd-knit-polo-khoi','prd-silk-blouse-vang','prd-trench-sa',
  'prd-pleated-skirt-reu','prd-tapered-jeans-lam','prd-cardigan-moc','prd-satin-dress-hoang-hon',
  'prd-bomber-toi-gian','prd-oxford-thanh','prd-linen-blazer-hien','prd-cargo-moc',
  'prd-tote-doanh','prd-loafer-tram','prd-silk-scarf-tho','prd-cap-rung'
)
on conflict do nothing;

with seed(product_id,code,color,color_hex,price_cents,compare_at_price_cents) as (
  values
    ('prd-overshirt-am','OSA','Gạch nung','#a34f32',1490000,cast(null as bigint)),
    ('prd-knit-polo-khoi','PDK','Kem sữa','#eee4d2',750000,null),
    ('prd-silk-blouse-vang','SLV','Đỏ vang','#6f2028',890000,1050000),
    ('prd-trench-sa','TCS','Cát','#c9ad82',1990000,null),
    ('prd-pleated-skirt-reu','CVR','Rêu ô-liu','#6f7142',850000,null),
    ('prd-tapered-jeans-lam','JCL','Indigo','#24364d',920000,null),
    ('prd-cardigan-moc','CDM','Xanh rừng','#264934',980000,null),
    ('prd-satin-dress-hoang-hon','DSH','Hoàng hôn','#a54f38',1450000,null),
    ('prd-bomber-toi-gian','BTG','Than','#2f302e',1350000,null),
    ('prd-oxford-thanh','SOT','Xanh trời','#a9c3dd',760000,null),
    ('prd-linen-blazer-hien','BLH','Be sương','#d8c8ad',1690000,null),
    ('prd-cargo-moc','QCM','Rêu','#5b6345',990000,null),
    ('prd-tote-doanh','TTD','Cognac','#9a4f22',1890000,null),
    ('prd-loafer-tram','LDT','Nâu trầm','#3c281f',1590000,null),
    ('prd-silk-scarf-tho','KLT','Gạch / Kem','#a45334',590000,null),
    ('prd-cap-rung','MLR','Xanh rừng','#244632',450000,null)
), expanded as (
  select seed.*,size
  from seed
  cross join lateral unnest(
    case
      when product_id in ('prd-tote-doanh','prd-silk-scarf-tho','prd-cap-rung') then array['One size']
      when product_id='prd-loafer-tram' then array['39','40','41']
      else array['S','M','L']
    end
  ) size
)
insert into product_variants(id,product_id,sku,size,color,color_hex,price_cents,compare_at_price_cents,status)
select code || '-' || lower(replace(size,' ','-')),product_id,
  'NET-' || code || '-' || case when size='One size' then 'ONE' else upper(size) end,
  size,color,color_hex,price_cents,compare_at_price_cents,'active'
from expanded
on conflict do nothing;

insert into product_media(id,product_id,storage_key,public_url,media_type,alt_text,sort_order)
select 'media-v2-' || id,id,'seed/catalog-atlas-v2.png','/catalog-atlas-v2.png','image',name,0
from products
where id in (
  'prd-overshirt-am','prd-knit-polo-khoi','prd-silk-blouse-vang','prd-trench-sa',
  'prd-pleated-skirt-reu','prd-tapered-jeans-lam','prd-cardigan-moc','prd-satin-dress-hoang-hon',
  'prd-bomber-toi-gian','prd-oxford-thanh','prd-linen-blazer-hien','prd-cargo-moc',
  'prd-tote-doanh','prd-loafer-tram','prd-silk-scarf-tho','prd-cap-rung'
)
on conflict do nothing;

insert into inventory_items(id,warehouse_id,variant_id,on_hand,reserved,safety_stock,reorder_point,version)
select 'inv-hcm-' || pv.id,'wh-hcm',pv.id,
  case when pv.size='S' then 18 when pv.size='M' then 14 when pv.size='L' then 10 else 12 end,
  0,2,5,1
from product_variants pv
where pv.product_id in (
  'prd-overshirt-am','prd-knit-polo-khoi','prd-silk-blouse-vang','prd-trench-sa',
  'prd-pleated-skirt-reu','prd-tapered-jeans-lam','prd-cardigan-moc','prd-satin-dress-hoang-hon',
  'prd-bomber-toi-gian','prd-oxford-thanh','prd-linen-blazer-hien','prd-cargo-moc',
  'prd-tote-doanh','prd-loafer-tram','prd-silk-scarf-tho','prd-cap-rung'
)
on conflict do nothing;

insert into inventory_items(id,warehouse_id,variant_id,on_hand,reserved,safety_stock,reorder_point,version)
select 'inv-hn-' || pv.id,'wh-hn',pv.id,
  case when pv.size='S' then 8 when pv.size='M' then 6 when pv.size='L' then 4 else 6 end,
  0,1,3,1
from product_variants pv
where pv.product_id in (
  'prd-overshirt-am','prd-knit-polo-khoi','prd-silk-blouse-vang','prd-trench-sa',
  'prd-pleated-skirt-reu','prd-tapered-jeans-lam','prd-cardigan-moc','prd-satin-dress-hoang-hon',
  'prd-bomber-toi-gian','prd-oxford-thanh','prd-linen-blazer-hien','prd-cargo-moc',
  'prd-tote-doanh','prd-loafer-tram','prd-silk-scarf-tho','prd-cap-rung'
)
on conflict do nothing;

insert into inventory_movements(
  id,inventory_item_id,type,quantity_delta,balance_after,
  reference_type,reference_id,reason,idempotency_key
)
select 'mov-v6-' || ii.id,ii.id,'opening',ii.on_hand,ii.on_hand,
  'migration','V6','Tồn đầu kỳ cho catalog đồ án','migration:v6:' || ii.id
from inventory_items ii
join product_variants pv on pv.id=ii.variant_id
where pv.product_id in (
  'prd-overshirt-am','prd-knit-polo-khoi','prd-silk-blouse-vang','prd-trench-sa',
  'prd-pleated-skirt-reu','prd-tapered-jeans-lam','prd-cardigan-moc','prd-satin-dress-hoang-hon',
  'prd-bomber-toi-gian','prd-oxford-thanh','prd-linen-blazer-hien','prd-cargo-moc',
  'prd-tote-doanh','prd-loafer-tram','prd-silk-scarf-tho','prd-cap-rung'
)
on conflict do nothing;
