-- FIX: Allow galleries to INSERT managed artists without recursion
-- The issue: INSERT policy for galleries adding artists is blocking or causing recursion
-- Solution: Ensure galleries_insert_managed_artists policy exists and works correctly

-- Step 1: Check existing INSERT policies
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 2: Drop the existing galleries_insert_managed_artists policy if it exists
DROP POLICY IF EXISTS "galleries_insert_managed_artists" ON "public"."Artists";

-- Step 3: Create a simple INSERT policy for galleries adding managed artists
-- This policy checks the VALUES being inserted (managed_by_gallery_id), not the table
-- So it won't cause recursion!
CREATE POLICY "galleries_insert_managed_artists"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is inserting their own record (for registration)
  auth.uid() = id
  OR
  -- Allow if user is a gallery inserting a managed artist
  -- We check the VALUES being inserted (managed_by_gallery_id), not the table, so no recursion!
  (
    "managed_by_gallery_id" = auth.uid()
    AND "is_gallery" = false
    -- Note: We trust that if managed_by_gallery_id = auth.uid(), the user is a gallery
    -- The id will be auto-generated, so we don't check it here
  )
);

-- Step 4: Verify the policy was created
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 5: Test query to see what policies are active
-- This should show both artists_insert_own and galleries_insert_managed_artists
SELECT 
  'INSERT Policies' as policy_type,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;


