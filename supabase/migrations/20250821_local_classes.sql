-- Local Classes (Metaclassification) schema for hierarchical, local-first classification
-- Idempotent creation. Safe to run multiple times.

-- Sequence for human-readable Local Class IDs: ITO-C-00001
create sequence if not exists local_class_local_seq;

-- Core table: local_classes
create table if not exists local_classes (
  id uuid primary key default gen_random_uuid(),
  token text unique,
  local_number text unique,
  label_en text,
  label_ja text,
  description text,
  parent_id uuid references local_classes(id) on delete set null,
  preferred_classification_id uuid references classifications(id) on delete set null,
  status text not null default 'active' check (status in ('active','draft','deprecated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness for human IDs when present
create unique index if not exists local_classes_local_number_ci on local_classes (lower(local_number)) where local_number is not null;

-- Auto-generate local_number if missing on insert: ITO-C-00001
create or replace function set_local_class_local_number() returns trigger as $$
begin
  if new.local_number is null then
    new.local_number := 'ITO-C-' || lpad(nextval('local_class_local_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_local_class_local_number'
  ) then
    create trigger trg_local_class_local_number
      before insert on local_classes
      for each row execute function set_local_class_local_number();
  end if;
end $$;

-- Closure table for hierarchy
create table if not exists local_class_hierarchy (
  ancestor_id uuid references local_classes(id) on delete cascade,
  descendant_id uuid references local_classes(id) on delete cascade,
  depth int not null,
  primary key (ancestor_id, descendant_id)
);

create index if not exists lch_ancestor_idx on local_class_hierarchy(ancestor_id);
create index if not exists lch_descendant_idx on local_class_hierarchy(descendant_id);

-- Maintain closure on insert
create or replace function lc_after_insert() returns trigger as $$
begin
  -- self link
  insert into local_class_hierarchy (ancestor_id, descendant_id, depth)
  values (new.id, new.id, 0)
  on conflict do nothing;

  if new.parent_id is not null then
    -- link all ancestors of parent (including parent) to the new node
    insert into local_class_hierarchy (ancestor_id, descendant_id, depth)
    select a.ancestor_id, new.id, a.depth + 1
    from local_class_hierarchy a
    where a.descendant_id = new.parent_id
    on conflict do nothing;
  end if;
  return null;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_lc_after_insert'
  ) then
    create trigger trg_lc_after_insert
      after insert on local_classes
      for each row execute function lc_after_insert();
  end if;
end $$;

-- Prevent cycles and maintain closure on parent change
create or replace function lc_before_update_parent() returns trigger as $$
declare
  has_cycle boolean;
begin
  if new.parent_id is distinct from old.parent_id then
    if new.parent_id is not null then
      if new.parent_id = new.id then
        raise exception 'local_classes: parent_id cannot equal id';
      end if;
      -- cycle check: new parent cannot be a descendant of the node
      select exists (
        select 1 from local_class_hierarchy
        where ancestor_id = new.id and descendant_id = new.parent_id
      ) into has_cycle;
      if has_cycle then
        raise exception 'local_classes: parent_id cannot create a cycle';
      end if;
    end if;

    -- Rewire closure for the subtree rooted at NEW.id
    -- 1) Delete links from former ancestors to the subtree
    delete from local_class_hierarchy h
    using (
      select descendant_id from local_class_hierarchy where ancestor_id = new.id
    ) d
    where h.descendant_id = d.descendant_id
      and h.ancestor_id not in (
        select descendant_id from local_class_hierarchy where ancestor_id = new.id
      );

    -- 2) Insert links from new ancestors to the subtree
    if new.parent_id is not null then
      insert into local_class_hierarchy (ancestor_id, descendant_id, depth)
      select a.ancestor_id, d.descendant_id, a.depth + 1 + d.depth
      from local_class_hierarchy a
      cross join local_class_hierarchy d
      where a.descendant_id = new.parent_id
        and d.ancestor_id = new.id
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_lc_before_update_parent'
  ) then
    create trigger trg_lc_before_update_parent
      before update of parent_id on local_classes
      for each row execute function lc_before_update_parent();
  end if;
end $$;

-- External links to existing classifications (AAT/Wikidata)
create table if not exists local_class_links (
  local_class_id uuid references local_classes(id) on delete cascade,
  classification_id uuid references classifications(id) on delete cascade,
  is_preferred boolean default false,
  confidence smallint,
  note text,
  primary key (local_class_id, classification_id)
);

create index if not exists lcl_class_idx on local_class_links(classification_id);

-- Objects → Local Class primary link (additive and nullable for safe backfill)
do $$ begin
  if not exists (
    select 1 from information_schema.columns where table_schema = 'public' and table_name = 'objects' and column_name = 'primary_local_class_id'
  ) then
    alter table objects add column primary_local_class_id uuid references local_classes(id);
  end if;
exception when others then
  null;
end $$;

-- Counts (all objects)
create or replace view local_class_object_counts_direct as
select primary_local_class_id as local_class_id, count(*)::bigint as object_count
from objects
where primary_local_class_id is not null
group by primary_local_class_id;

create or replace view local_class_object_counts_total as
select h.ancestor_id as local_class_id, count(o.id)::bigint as object_count
from objects o
join local_class_hierarchy h on h.descendant_id = o.primary_local_class_id
group by h.ancestor_id;

-- RLS policies: public read for class metadata and hierarchy
alter table local_classes enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'local_classes' and policyname = 'local_classes_public_read'
  ) then
    create policy local_classes_public_read on local_classes for select using (true);
  end if;
end $$;

alter table local_class_links enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'local_class_links' and policyname = 'local_class_links_public_read'
  ) then
    create policy local_class_links_public_read on local_class_links for select using (true);
  end if;
end $$;

alter table local_class_hierarchy enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'local_class_hierarchy' and policyname = 'local_class_hierarchy_public_read'
  ) then
    create policy local_class_hierarchy_public_read on local_class_hierarchy for select using (true);
  end if;
end $$;


