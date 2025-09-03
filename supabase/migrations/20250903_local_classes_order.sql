-- Add sort_order column to local_classes and supporting index
-- Idempotent: only add if not exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'local_classes'
      AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE public.local_classes
      ADD COLUMN sort_order integer;
  END IF;
END $$;

-- Backfill default sort_order from local_number if possible, else 999
-- Note: best-effort; non-numeric local_number will get 999
UPDATE public.local_classes
SET sort_order = COALESCE(
  NULLIF(
    CASE WHEN local_number ~ '^[0-9]+$' THEN (local_number)::int ELSE NULL END,
    NULL
  ),
  999
)
WHERE sort_order IS NULL;

-- Helpful index for ordering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'local_classes_sort_order_idx'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX local_classes_sort_order_idx ON public.local_classes(sort_order NULLS LAST, local_number);
  END IF;
END $$;


