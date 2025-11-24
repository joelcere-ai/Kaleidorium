-- Fix foreign key constraint for uploaded_by_gallery_id in Artwork table
-- The constraint was pointing to Artists table, but galleries are now in Galleries table

-- Step 1: Drop the old foreign key constraint
ALTER TABLE "public"."Artwork"
DROP CONSTRAINT IF EXISTS "Artwork_uploaded_by_gallery_id_fkey";

-- Step 2: Create new foreign key constraint pointing to Galleries table
ALTER TABLE "public"."Artwork"
ADD CONSTRAINT "Artwork_uploaded_by_gallery_id_fkey"
FOREIGN KEY ("uploaded_by_gallery_id")
REFERENCES "public"."Galleries"("id")
ON DELETE SET NULL;

-- Step 3: Verify the constraint was created
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

