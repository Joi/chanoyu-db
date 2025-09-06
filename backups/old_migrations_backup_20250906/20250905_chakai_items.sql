-- Add chakai-items links table for object associations
-- Links chakai (tea gatherings) to objects (tea utensils used)
-- Many-to-many linkage between chakai and objects
create table if not exists chakai_items (
    chakai_id uuid,
    object_id uuid,
    role text default 'used',
    created_at timestamptz not null default now(),
    primary key (chakai_id, object_id)
);

create index if not exists chakai_items_chakai_idx on chakai_items(chakai_id);

create index if not exists chakai_items_object_idx on chakai_items(object_id);

-- RLS policy for chakai_items - follow chakai visibility rules
alter table chakai_items enable row level security;

-- Allow reading chakai items based on chakai visibility
create policy chakai_items_read on chakai_items for select using (
    exists (
        select 1
        from chakai c
        where c.id = chakai_id
            and (
                c.visibility = 'open'
                or (
                    c.visibility = 'members'
                    and exists (
                        select 1
                        from chakai_attendees ca
                            join accounts a on a.id = ca.account_id
                        where ca.chakai_id = c.id
                            and a.email = current_setting('request.jwt.claims', true)::json->>'email'
                    )
                )
            )
    )
);

-- Allow admins to read all chakai items
create policy chakai_items_admin_read on chakai_items for select using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

-- Allow admins to insert, update, delete chakai items
create policy chakai_items_admin_write on chakai_items for all using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

-- Add foreign key constraints
do $$ begin 
    if not exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'chakai_items_chakai_id_fkey'
    ) then 
        alter table chakai_items add constraint chakai_items_chakai_id_fkey 
        foreign key (chakai_id) references chakai(id) on delete cascade;
    end if;
end $$;

do $$ begin 
    if not exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'chakai_items_object_id_fkey'
    ) then 
        alter table chakai_items add constraint chakai_items_object_id_fkey 
        foreign key (object_id) references objects(id) on delete cascade;
    end if;
end $$;