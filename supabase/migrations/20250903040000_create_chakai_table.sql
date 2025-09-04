-- Create chakai table for tea gathering events
-- This table was missing from migrations but exists in production

create table if not exists chakai (
  id uuid primary key default gen_random_uuid(),
  local_number text not null,
  event_date date not null,
  start_time time without time zone,
  location_id uuid,
  visibility text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name_en text,
  name_ja text,
  token text
);

-- Add indexes for performance
create unique index if not exists chakai_local_number_key on chakai (local_number);
create unique index if not exists chakai_token_unique on chakai (token);
create index if not exists idx_chakai_event_date on chakai (event_date);
create index if not exists idx_chakai_visibility on chakai (visibility);

-- Create chakai_attendees table (many-to-many between chakai and accounts)
create table if not exists chakai_attendees (
  chakai_id uuid not null references chakai(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (chakai_id, account_id)
);

-- Add foreign key constraint to location if locations table exists
-- (using conditional approach since table creation order may vary)
do $$
begin
  if exists (select from information_schema.tables where table_name = 'locations') then
    if not exists (select from information_schema.table_constraints where constraint_name = 'chakai_location_id_fkey') then
      execute 'alter table chakai add constraint chakai_location_id_fkey foreign key (location_id) references locations(id) on delete cascade';
    end if;
  end if;
end $$;