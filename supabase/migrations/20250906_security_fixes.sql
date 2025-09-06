-- Migration: Fix Supabase security issues
-- Created: 2025-09-06
-- Issue: https://github.com/Joi/chanoyu-db/issues/83
-- Description: Enable RLS on media table and fix function search_path vulnerabilities

-- 1. Enable RLS on media table
-- The media table has RLS policies defined but RLS is not enabled, creating a security gap
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- 2. Fix function search_path vulnerabilities
-- These functions need explicit schema qualification to prevent search_path injection attacks

-- Fix swap_local_class_sort_order function
CREATE OR REPLACE FUNCTION public.swap_local_class_sort_order(item1_id integer, item2_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    item1_order integer;
    item2_order integer;
BEGIN
    -- Get current sort_order values
    SELECT sort_order INTO item1_order FROM public.local_classes WHERE id = item1_id;
    SELECT sort_order INTO item2_order FROM public.local_classes WHERE id = item2_id;
    
    -- Swap the sort_order values
    UPDATE public.local_classes SET sort_order = item2_order WHERE id = item1_id;
    UPDATE public.local_classes SET sort_order = item1_order WHERE id = item2_id;
END;
$$;

-- Fix lc_after_insert function
CREATE OR REPLACE FUNCTION public.lc_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Update sort_order for new local_classes entries
    UPDATE public.local_classes 
    SET sort_order = (
        SELECT COALESCE(MAX(sort_order), 0) + 1 
        FROM public.local_classes 
        WHERE parent_id = NEW.parent_id
    )
    WHERE id = NEW.id AND sort_order IS NULL;
    
    RETURN NEW;
END;
$$;

-- Fix lc_before_update_parent function
CREATE OR REPLACE FUNCTION public.lc_before_update_parent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Handle parent_id changes in local_classes
    IF OLD.parent_id != NEW.parent_id THEN
        -- Reset sort_order when parent changes
        NEW.sort_order := NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix set_local_class_local_number function
CREATE OR REPLACE FUNCTION public.set_local_class_local_number(class_id integer, new_local_number text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.local_classes 
    SET local_number = new_local_number 
    WHERE id = class_id;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.media IS 'Media files with RLS enabled for security compliance';
COMMENT ON FUNCTION public.swap_local_class_sort_order(integer, integer) IS 'Swaps sort order between two local class items - secured against search_path attacks';
COMMENT ON FUNCTION public.lc_after_insert() IS 'Trigger function for local_classes after insert - secured against search_path attacks';
COMMENT ON FUNCTION public.lc_before_update_parent() IS 'Trigger function for local_classes before parent update - secured against search_path attacks';
COMMENT ON FUNCTION public.set_local_class_local_number(integer, text) IS 'Updates local number for local class - secured against search_path attacks';