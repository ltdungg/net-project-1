create table wishlist_items (
  user_id varchar(64) not null references users(id) on delete cascade,
  product_id varchar(64) not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, product_id)
);

create index idx_wishlist_items_product
  on wishlist_items(product_id, created_at desc);

create index idx_wishlist_items_user_created
  on wishlist_items(user_id, created_at desc, product_id);
