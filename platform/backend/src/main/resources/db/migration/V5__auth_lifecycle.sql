alter table users drop constraint if exists users_status_check;

alter table users
  add column if not exists email_verified_at timestamptz,
  add column if not exists locked_until timestamptz,
  add constraint users_status_check
    check (status in ('pending','active','locked','blocked','disabled','deleted')) not valid;

update users
set email_verified_at = coalesce(email_verified_at, created_at)
where status in ('active','locked','blocked','disabled');

alter table users validate constraint users_status_check;

create table auth_tokens (
  id varchar(64) primary key,
  user_id varchar(64) not null references users(id) on delete cascade,
  type varchar(32) not null check (type in ('verify_email','password_reset')),
  token_hash varchar(100) not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_auth_tokens_active
  on auth_tokens(user_id,type,expires_at desc)
  where consumed_at is null;
