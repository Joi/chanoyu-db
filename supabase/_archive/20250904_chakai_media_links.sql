-- Add chakai-media links table for PDF and media attachments
-- Following pattern from object_media_links and location_media_links

-- Many-to-many linkage between chakai and media (supports PDF attachments)
create table if not exists chakai_media_links (
  chakai_id uuid references chakai(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  role text default 'attachment',
  created_at timestamptz not null default now(),
  primary key (chakai_id, media_id)
);

create index if not exists cml_media_idx on chakai_media_links(media_id);
create index if not exists cml_chakai_idx on chakai_media_links(chakai_id);

-- RLS policy for chakai_media_links - follow chakai visibility rules
alter table chakai_media_links enable row level security;

-- Allow reading chakai media links based on chakai visibility
create policy chakai_media_links_read on chakai_media_links for select using (
  exists (
    select 1 from chakai c 
    where c.id = chakai_id 
    and (
      c.visibility = 'open' 
      or (
        c.visibility = 'members' 
        and exists (
          select 1 from chakai_attendees ca 
          join accounts a on a.id = ca.account_id 
          where ca.chakai_id = c.id 
          and a.email = current_setting('request.jwt.claims', true)::json->>'email'
        )
      )
    )
  )
);

-- Allow public read of media when linked to chakai with appropriate visibility
create policy media_public_read_chakai on media for select using (
  exists (
    select 1 from chakai_media_links cml
    join chakai c on c.id = cml.chakai_id
    where cml.media_id = media.id 
    and c.visibility = 'open'
    and media.visibility = 'public'
  )
  or exists (
    select 1 from chakai_media_links cml
    join chakai c on c.id = cml.chakai_id
    join chakai_attendees ca on ca.chakai_id = c.id
    join accounts a on a.id = ca.account_id
    where cml.media_id = media.id 
    and c.visibility = 'members'
    and a.email = current_setting('request.jwt.claims', true)::json->>'email'
    and (media.visibility = 'public' or media.visibility = 'private')
  )
);

-- Update media table to support file types (if not already exists)
alter table media add column if not exists file_type text;
alter table media add column if not exists file_size bigint;
alter table media add column if not exists original_filename text;