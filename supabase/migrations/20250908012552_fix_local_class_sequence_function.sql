-- Fix local class sequence function to properly reference the sequence with full schema qualification
-- This fixes the "relation local_class_local_seq does not exist" error

create or replace function set_local_class_local_number() returns trigger as $$ 
begin 
    if new.local_number is null then 
        new.local_number := 'ITO-C-' || lpad(nextval('public.local_class_local_seq')::text, 5, '0');
    end if;
    return new;
end;
$$ language plpgsql security definer set search_path = '';