-- Fix foreign key constraint for uploaded_by_gallery_id in Artwork table
-- The constraint was pointing to Artists table, but galleries are now in Galleries table
-- This script finds and fixes ALL foreign key constraints on this column

-- Step 1: Find all foreign key constraints on uploaded_by_gallery_id
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
  AND tc.table_name = 'Artwork'
  AND kcu.column_name = 'uploaded_by_gallery_id';

-- Step 2: Drop ALL foreign key constraints on uploaded_by_gallery_id
-- (PostgreSQL might have created it with a different name)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'Artwork'
      AND kcu.column_name = 'uploaded_by_gallery_id'
  ) LOOP
    EXECUTE 'ALTER TABLE "public"."Artwork" DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    RAISE NOTICE 'Dropped constraint: %', r.constraint_name;
  END LOOP;
END $$;

-- Step 3: Create new foreign key constraint pointing to Galleries table
ALTER TABLE "public"."Artwork"
ADD CONSTRAINT "Artwork_uploaded_by_gallery_id_fkey"
FOREIGN KEY ("uploaded_by_gallery_id")
REFERENCES "public"."Galleries"("id")
ON DELETE SET NULL;

-- Step 4: Verify the new constraint was created correctly
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
  AND tc.table_name = 'Artwork'
  AND kcu.column_name = 'uploaded_by_gallery_id'
ORDER BY tc.constraint_name;


