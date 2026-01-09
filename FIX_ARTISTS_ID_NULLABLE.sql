-- FIX: Allow NULL id for gallery-managed artists
-- Gallery-managed artists don't have auth users yet, so id should be nullable
-- Only artists who register themselves need id = auth.uid()

-- Step 1: Check current id column constraints
SELECT 
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Artists'
AND column_name = 'id';

-- Step 2: Check foreign key constraints on id
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'Artists'
AND kcu.column_name = 'id';

-- Step 3: Drop the foreign key constraint if it exists
ALTER TABLE "public"."Artists"
DROP CONSTRAINT IF EXISTS "Artists_id_fkey";

-- Step 4: Make id column nullable
ALTER TABLE "public"."Artists"
ALTER COLUMN "id" DROP NOT NULL;

-- Step 5: Re-add the foreign key constraint, but allow NULL
-- This allows id to be NULL for gallery-managed artists
ALTER TABLE "public"."Artists"
ADD CONSTRAINT "Artists_id_fkey" 
FOREIGN KEY ("id") 
REFERENCES "auth"."users"("id") 
ON DELETE CASCADE;

-- Note: PostgreSQL foreign keys allow NULL by default, so this should work
-- Gallery-managed artists will have id = NULL until they register

-- Step 6: Verify the change
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Artists'
AND column_name = 'id';


