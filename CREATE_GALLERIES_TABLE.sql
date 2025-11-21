-- CREATE: Separate Galleries table to simplify RLS and avoid conflicts
-- This is a cleaner architecture: Galleries and Artists are separate entities

-- Step 1: Create the Galleries table
CREATE TABLE IF NOT EXISTS "public"."Galleries" (
  "id" UUID PRIMARY KEY REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "username" TEXT NOT NULL,
  "firstname" TEXT,
  "surname" TEXT,
  "email" TEXT NOT NULL,
  "country" TEXT,
  "biog" TEXT,
  "website" TEXT,
  "profilepix" TEXT,
  "notification_consent" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_galleries_email" ON "public"."Galleries" ("email");
CREATE INDEX IF NOT EXISTS "idx_galleries_username" ON "public"."Galleries" ("username");

-- Step 3: Add comment for documentation
COMMENT ON TABLE "public"."Galleries" IS 'Gallery accounts - separate from Artists table for cleaner RLS policies';

-- Step 4: Migrate existing gallery data from Artists table to Galleries table
INSERT INTO "public"."Galleries" (
  "id",
  "username",
  "firstname",
  "surname",
  "email",
  "country",
  "biog",
  "website",
  "profilepix",
  "notification_consent",
  "created_at",
  "updated_at"
)
SELECT 
  "id",
  "username",
  "firstname",
  "surname",
  "email",
  "country",
  "biog",
  "website",
  "profilepix",
  "notification_consent",
  "created_at",
  "updated_at"
FROM "public"."Artists"
WHERE "is_gallery" = true
ON CONFLICT ("id") DO NOTHING;

-- Step 5: Update Artists table to reference Galleries instead of using is_gallery
-- Change managed_by_gallery_id to reference Galleries table
-- First, check if the foreign key constraint needs to be updated
ALTER TABLE "public"."Artists"
DROP CONSTRAINT IF EXISTS "Artists_managed_by_gallery_id_fkey";

-- Add new foreign key to Galleries table
ALTER TABLE "public"."Artists"
ADD CONSTRAINT "Artists_managed_by_gallery_id_fkey" 
FOREIGN KEY ("managed_by_gallery_id") 
REFERENCES "public"."Galleries"("id") 
ON DELETE SET NULL;

-- Step 6: Enable RLS on Galleries table
ALTER TABLE "public"."Galleries" ENABLE ROW LEVEL SECURITY;

-- Step 7: Create simple RLS policies for Galleries table
-- Allow users to read their own gallery record
CREATE POLICY "galleries_select_own"
ON "public"."Galleries"
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users to insert their own gallery record (for registration)
CREATE POLICY "galleries_insert_own"
ON "public"."Galleries"
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow users to update their own gallery record
CREATE POLICY "galleries_update_own"
ON "public"."Galleries"
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 8: Simplify Artists INSERT policy - now it only needs to check managed_by_gallery_id
-- Drop existing INSERT policies
DROP POLICY IF EXISTS "artists_insert_final" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_test" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_gallery_only" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_allow_galleries" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_simple" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_policy" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";

-- Create simple INSERT policy for Artists
CREATE POLICY "artists_insert_own_or_managed"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is inserting their own record (for artist registration)
  id = auth.uid()
  OR
  -- Allow if gallery is creating a managed artist
  -- Simply check: managed_by_gallery_id matches the authenticated user
  -- AND verify the user exists in Galleries table (safe - different table, no recursion!)
  (
    managed_by_gallery_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM "public"."Galleries"
      WHERE "Galleries"."id" = auth.uid()
    )
  )
);

-- Step 9: Verify tables and policies
SELECT 
  'Galleries Table' as info,
  COUNT(*) as gallery_count
FROM "public"."Galleries";

SELECT 
  'Galleries Policies' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Galleries'
ORDER BY cmd, policyname;

SELECT 
  'Artists INSERT Policy' as info,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
AND policyname = 'artists_insert_own_or_managed';

