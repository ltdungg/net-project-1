-- Canonical customer segmentation and one fulfillment per order/warehouse.

create view admin_customer_segments as
with customer_metrics as (
  select u.id,u.email,u.full_name,u.phone,u.status,u.marketing_consent,
    u.last_login_at,u.created_at,u.updated_at,
    count(o.id) total_orders,
    count(o.id) filter (
      where o.payment_status='paid'
        and o.status not in ('cancelled','returned','refunded')
    ) paid_orders,
    count(o.id) filter (where o.status='delivered') delivered_orders,
    count(o.id) filter (where o.status='cancelled') cancelled_orders,
    coalesce(sum(o.grand_total_cents) filter (
      where o.payment_status='paid'
        and o.status not in ('cancelled','returned','refunded')
    ),0) total_revenue_cents,
    max(o.created_at) last_order_at,
    max(o.created_at) filter (
      where o.payment_status='paid'
        and o.status not in ('cancelled','returned','refunded')
    ) last_paid_order_at
  from users u
  left join customer_orders o on o.user_id=u.id
  where u.status<>'deleted'
    and exists (
      select 1 from user_roles ur join roles r on r.id=ur.role_id
      where ur.user_id=u.id and r.code='customer'
    )
  group by u.id
)
select customer_metrics.*,
  case
    when paid_orders>=1 and last_paid_order_at<now()-interval '90 days' then 'at_risk'
    when total_revenue_cents>=5000000 or paid_orders>=5 then 'vip'
    when paid_orders>=2 and last_paid_order_at>=now()-interval '90 days' then 'loyal'
    when created_at>=now()-interval '30 days' and paid_orders<=1 then 'new'
    when paid_orders=1 then 'potential'
    else 'prospect'
  end segment_code
from customer_metrics;

do $$
begin
  if exists(select 1 from order_items where quantity<=0) then
    raise exception 'V7 cannot migrate: legacy order_items contains non-positive quantity';
  end if;
end $$;

create table fulfillments (
  id varchar(64) primary key,
  shipment_number varchar(100) not null unique,
  order_id varchar(64) not null references customer_orders(id),
  warehouse_id varchar(64) references warehouses(id),
  status varchar(30) not null default 'pending' check (
    status in ('pending','processing','ready_to_ship','shipped','delivered','failed','returned','cancelled')
  ),
  carrier varchar(80),
  service_code varchar(80),
  tracking_number varchar(150),
  provider_reference varchar(150),
  shipping_cost_cents bigint not null default 0 check (shipping_cost_cents>=0),
  address_snapshot_json jsonb not null,
  estimated_delivery_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  delivery_attempts integer not null default 0 check (delivery_attempts>=0),
  last_failure_reason varchar(500),
  notes text,
  idempotency_key varchar(160) not null unique,
  version integer not null default 1 check (version>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tracking_number is null or carrier is not null),
  check (shipped_at is null or shipped_at>=created_at),
  check (delivered_at is null or (shipped_at is not null and delivered_at>=shipped_at))
);
create index idx_fulfillments_status_created on fulfillments(status,created_at desc);
create index idx_fulfillments_order_status on fulfillments(order_id,status);
create unique index ux_fulfillments_order_warehouse
  on fulfillments(order_id,coalesce(warehouse_id,''));
create unique index ux_fulfillments_tracking
  on fulfillments(lower(carrier),lower(tracking_number))
  where carrier is not null and tracking_number is not null;

create table fulfillment_items (
  id varchar(64) primary key,
  fulfillment_id varchar(64) not null references fulfillments(id) on delete cascade,
  order_item_id varchar(64) not null references order_items(id),
  reservation_id varchar(64) unique references inventory_reservations(id),
  quantity integer not null check (quantity>0),
  created_at timestamptz not null default now(),
  unique(fulfillment_id,order_item_id)
);
create index idx_fulfillment_items_order_item on fulfillment_items(order_item_id);

create table fulfillment_events (
  id varchar(64) primary key,
  fulfillment_id varchar(64) not null references fulfillments(id) on delete cascade,
  from_status varchar(30),
  to_status varchar(30) not null,
  reason varchar(500),
  actor_user_id varchar(64) references users(id) on delete set null,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);
create index idx_fulfillment_events_created
  on fulfillment_events(fulfillment_id,created_at,id);

-- Backfill orders created before the fulfillment module was introduced.
with order_warehouses as (
  select o.id order_id,o.order_number,o.status,o.shipping_address_json,
    o.created_at,o.updated_at,ii.warehouse_id
  from customer_orders o
  left join inventory_reservations ir on ir.order_id=o.id
  left join inventory_items ii on ii.id=ir.inventory_item_id
  group by o.id,ii.warehouse_id
), numbered as (
  select order_warehouses.*,
    row_number() over(partition by order_id order by warehouse_id nulls last) shipment_index
  from order_warehouses
)
insert into fulfillments(
  id,shipment_number,order_id,warehouse_id,status,shipping_cost_cents,
  address_snapshot_json,estimated_delivery_at,shipped_at,delivered_at,
  idempotency_key,created_at,updated_at
)
select 'ful-'||md5(n.order_id||':'||coalesce(n.warehouse_id,'legacy')),
  'SHP-'||left(regexp_replace(n.order_number,'^NET-',''),56)||'-'||left(md5(n.order_id),10)||'-'||n.shipment_index::text,
  n.order_id,
  n.warehouse_id,
  case
    when n.status='processing' then 'processing'
    when n.status in ('ready_to_ship','packed') then 'ready_to_ship'
    when n.status='shipped' then 'shipped'
    when n.status='delivered' then 'delivered'
    when n.status='cancelled' then 'cancelled'
    when n.status in ('returned','refunded') then 'returned'
    else 'pending'
  end,
  0,
  n.shipping_address_json,
  case when n.status not in ('cancelled','returned','refunded') then n.created_at+interval '3 days' end,
  case when n.status in ('shipped','delivered','returned') then greatest(n.updated_at,n.created_at) end,
  case when n.status='delivered' then greatest(n.updated_at,n.created_at) end,
  'shipment:'||md5(n.order_id||':'||coalesce(n.warehouse_id,'legacy')),
  n.created_at,
  n.updated_at
from numbered n;

with ranked_order_items as (
  select oi.*,
    row_number() over(partition by oi.order_id,oi.variant_id order by oi.created_at,oi.id) item_rank
  from order_items oi
), ranked_reservations as (
  select ir.*,ii.variant_id,ii.warehouse_id,
    row_number() over(
      partition by ir.order_id,ii.variant_id
      order by case ir.status when 'active' then 0 when 'consumed' then 1 else 2 end,
        ir.created_at desc,ir.id
    ) reservation_rank
  from inventory_reservations ir
  join inventory_items ii on ii.id=ir.inventory_item_id
), mapped_items as (
  select oi.id order_item_id,oi.order_id,oi.quantity,oi.created_at,
    ir.id reservation_id,
    coalesce(ir.warehouse_id,fallback.warehouse_id) warehouse_id
  from ranked_order_items oi
  left join ranked_reservations ir
    on ir.order_id=oi.order_id
    and ir.variant_id=oi.variant_id
    and ir.reservation_rank=oi.item_rank
  left join lateral (
    select ii.warehouse_id
    from inventory_reservations ir2
    join inventory_items ii on ii.id=ir2.inventory_item_id
    where ir2.order_id=oi.order_id and ii.variant_id=oi.variant_id
    order by case ir2.status when 'active' then 0 when 'consumed' then 1 else 2 end,
      ir2.created_at desc,ir2.id
    limit 1
  ) fallback on true
)
insert into fulfillment_items(
  id,fulfillment_id,order_item_id,reservation_id,quantity,created_at
)
select 'fuli-'||md5(mi.order_item_id),f.id,mi.order_item_id,mi.reservation_id,mi.quantity,mi.created_at
from mapped_items mi
join fulfillments f
  on f.order_id=mi.order_id
  and f.warehouse_id is not distinct from mi.warehouse_id;

insert into fulfillment_events(id,fulfillment_id,from_status,to_status,reason,created_at)
select 'fule-'||left(md5(f.id),32),f.id,null,f.status,'Khởi tạo dữ liệu vận chuyển cho đơn hàng hiện có',f.created_at
from fulfillments f;

update customer_orders o
set fulfillment_status=case
    when o.status='shipped' then 'shipped'
    when o.status='delivered' then 'fulfilled'
    when o.status='cancelled' then 'cancelled'
    when o.status in ('returned','refunded') then 'returned'
    else 'reserved'
  end,
  updated_at=greatest(o.updated_at,o.created_at)
where exists(select 1 from fulfillments f where f.order_id=o.id);
