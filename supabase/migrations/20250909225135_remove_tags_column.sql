-- Remove tags column from objects table to match production schema
-- This column was never fully implemented and caused schema drift issues

alter table objects drop column if exists tags;