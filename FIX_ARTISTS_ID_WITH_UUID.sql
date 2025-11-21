-- FIX: Allow gallery-managed artists to have UUID id without auth.users reference
-- Since id is a primary key, it must be NOT NULL
-- Solution: Remove foreign key constraint, generate UUIDs for gallery-managed artists

-- Step 1: Check current constraints on id
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name = 'Artists'
AND kcu.column_name = 'id';

-- Step 2: Drop the foreign key constraint (if it exists)
-- This allows id to be any UUID, not just from auth.users
ALTER TABLE "public"."Artists"
DROP CONSTRAINT IF EXISTS "Artists_id_fkey";

-- Step 3: Verify id column is still NOT NULL (required for primary key)
SELECT 
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Artists'
AND column_name = 'id';

-- Note: 
-- - id remains NOT NULL (required for primary key)
-- - id can now be any UUID (not just from auth.users)
-- - Artists who register themselves will set id = auth.uid()
-- - Gallery-managed artists will have a generated UUID (not linked to auth.users)

