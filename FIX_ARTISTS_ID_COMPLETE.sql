-- COMPLETE FIX: Allow gallery-managed artists to have UUID id
-- This removes the foreign key constraint and ensures id can be any UUID

-- Step 1: Drop the foreign key constraint (if it exists)
-- This allows id to be any UUID, not just from auth.users
ALTER TABLE "public"."Artists"
DROP CONSTRAINT IF EXISTS "Artists_id_fkey";

-- Step 2: Verify id column properties
SELECT 
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Artists'
AND column_name = 'id';

-- Step 3: Check for any triggers that might override id
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'Artists'
AND action_statement LIKE '%id%';

-- Step 4: Verify no foreign key constraint remains
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name = 'Artists'
AND kcu.column_name = 'id';

-- Expected result: No rows (foreign key should be dropped)
-- If rows are returned, the constraint still exists and needs to be dropped manually


