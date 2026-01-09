-- ULTRA SIMPLE FIX: Remove ALL complexity from Artists INSERT policy
-- The issue: When a gallery creates an artist, the id is auto-generated (not auth.uid())
-- Solution: Just check managed_by_gallery_id = auth.uid() OR id = auth.uid()
-- NO EXISTS checks, NO table queries - just check the VALUES being inserted

-- Step 1: Drop ALL existing INSERT policies
DROP POLICY IF EXISTS "artists_insert_final" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_test" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_gallery_only" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_allow_galleries" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_simple" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_policy" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_simple_final" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_comprehensive" ON "public"."Artists";

-- Step 2: Create the ABSOLUTE SIMPLEST policy possible
-- This ONLY checks the VALUES being inserted - no table queries at all
CREATE POLICY "artists_insert_ultra_simple"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Case 1: User registering themselves (id matches their auth.uid())
  id = auth.uid()
  OR
  -- Case 2: Gallery creating an artist (managed_by_gallery_id matches gallery's auth.uid())
  -- Note: id will be auto-generated, so we don't check it
  -- We just check that managed_by_gallery_id = auth.uid()
  -- This is safe because we're only checking the VALUES, not querying the table
  managed_by_gallery_id = auth.uid()
);

-- Step 3: Verify the policy was created
SELECT 
  'Policy Created' as status,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;


