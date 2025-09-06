-- Add deterministic two-row swap function for local_classes reordering
-- This addresses issue #61 by replacing the race-condition prone Promise.all approach
CREATE OR REPLACE FUNCTION swap_local_class_sort_order(class_id_1 UUID, class_id_2 UUID) RETURNS TABLE (
        success BOOLEAN,
        error_message TEXT,
        class1_old_sort INTEGER,
        class1_new_sort INTEGER,
        class2_old_sort INTEGER,
        class2_new_sort INTEGER
    ) AS $$
DECLARE sort1 INTEGER;
sort2 INTEGER;
affected_rows INTEGER;
BEGIN -- Start transaction (function is atomic by default)
-- Get current sort_order values for both classes
SELECT sort_order INTO sort1
FROM local_classes
WHERE id = class_id_1
    AND parent_id IS NULL;
SELECT sort_order INTO sort2
FROM local_classes
WHERE id = class_id_2
    AND parent_id IS NULL;
-- Validate both classes exist and are top-level
IF sort1 IS NULL
OR sort2 IS NULL THEN RETURN QUERY
SELECT FALSE,
    'One or both classes not found or not top-level',
    sort1,
    sort2,
    sort2,
    sort1;
RETURN;
END IF;
-- Perform the atomic swap using a temporary negative value to avoid conflicts
-- Step 1: Set first class to negative temp value
UPDATE local_classes
SET sort_order = -999999
WHERE id = class_id_1;
GET DIAGNOSTICS affected_rows = ROW_COUNT;
IF affected_rows != 1 THEN RETURN QUERY
SELECT FALSE,
    'Failed to update first class',
    sort1,
    sort2,
    sort2,
    sort1;
RETURN;
END IF;
-- Step 2: Set second class to first class's original value
UPDATE local_classes
SET sort_order = sort1
WHERE id = class_id_2;
GET DIAGNOSTICS affected_rows = ROW_COUNT;
IF affected_rows != 1 THEN RETURN QUERY
SELECT FALSE,
    'Failed to update second class',
    sort1,
    sort2,
    sort2,
    sort1;
RETURN;
END IF;
-- Step 3: Set first class to second class's original value
UPDATE local_classes
SET sort_order = sort2
WHERE id = class_id_1;
GET DIAGNOSTICS affected_rows = ROW_COUNT;
IF affected_rows != 1 THEN RETURN QUERY
SELECT FALSE,
    'Failed to complete swap for first class',
    sort1,
    sort2,
    sort2,
    sort1;
RETURN;
END IF;
-- Return success with old and new values
RETURN QUERY
SELECT TRUE,
    'Swap completed successfully'::TEXT,
    sort1,
    sort2,
    -- class1's new sort_order (was sort2)
    sort2,
    sort1;
-- class2's new sort_order (was sort1)
EXCEPTION
WHEN OTHERS THEN -- Return error information
RETURN QUERY
SELECT FALSE,
    SQLERRM::TEXT,
    sort1,
    sort2,
    sort2,
    sort1;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION swap_local_class_sort_order IS 'Atomically swaps sort_order between two top-level local_classes. Used for reordering functionality in admin interface.';