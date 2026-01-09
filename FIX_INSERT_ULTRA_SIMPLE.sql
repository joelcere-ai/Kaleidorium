-- ULTRA SIMPLE FIX: The simplest possible policy that should work
-- If this doesn't work, there's something else blocking it (like a trigger or another policy)

-- Step 1: Drop ALL existing INSERT policies
DROP POLICY IF EXISTS "artists_insert_simple" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_allow_galleries" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_policy" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";

-- Step 2: Create the ABSOLUTE SIMPLEST policy
-- This ONLY checks managed_by_gallery_id - nothing else
CREATE POLICY "artists_insert_gallery_only"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- ONLY check: managed_by_gallery_id matches the authenticated user
  -- This should match when a gallery creates an artist
  managed_by_gallery_id = auth.uid()
);

-- Step 3: Verify
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT';

-- NOTE: This policy ONLY allows gallery-created artists
-- User registration will need a separate policy or this needs to be expanded
-- But let's test if this works first for gallery-created artists


