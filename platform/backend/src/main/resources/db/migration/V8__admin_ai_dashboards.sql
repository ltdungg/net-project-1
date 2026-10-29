create table admin_ai_dashboards (
  id varchar(64) primary key,
  user_id varchar(64) not null references users(id) on delete cascade,
  title varchar(100) not null,
  days integer not null check (days between 1 and 90),
  widgets jsonb not null check (jsonb_typeof(widgets) = 'array' and jsonb_array_length(widgets) between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_admin_ai_dashboards_user on admin_ai_dashboards(user_id, updated_at desc);
