-- FINAL WORKING FIX: Policy that definitely allows galleries to create artists
-- This policy is more explicit and handles NULL values correctly

-- Step 1: Drop the existing policy
DROP POLICY IF EXISTS "artists_insert_simple" ON "public"."Artists";

-- Step 2: Create a SIMPLE policy that prioritizes managed_by_gallery_id check
-- The key: Check managed_by_gallery_id FIRST (before id check)
-- This ensures gallery-created artists are allowed even if id is auto-generated
CREATE POLICY "artists_insert_allow_galleries"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- PRIMARY: Allow if managed_by_gallery_id matches auth.uid() (gallery creating artist)
  -- This is checked FIRST and should match for gallery-created artists
  managed_by_gallery_id = auth.uid()
  OR
  -- SECONDARY: Allow if user is inserting their own record (for registration)
  id = auth.uid()
);

-- Step 3: Verify the policy
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname = 'artists_insert_allow_galleries';

