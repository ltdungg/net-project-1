alter table payments add column provider_metadata_json jsonb not null default '{}'::jsonb;
alter table payments add column last_checked_at timestamptz;
