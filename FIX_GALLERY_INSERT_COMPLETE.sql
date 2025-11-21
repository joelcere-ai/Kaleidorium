-- COMPLETE FIX: Allow galleries to INSERT managed artists
-- This ensures galleries can add artists without RLS blocking

-- Step 1: Check ALL existing INSERT policies
SELECT 
  'Before Fix' as status,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 2: Drop ALL existing INSERT policies to start fresh
DROP POLICY IF EXISTS "artists_insert_own" ON "public"."Artists";
DROP POLICY IF EXISTS "galleries_insert_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";

-- Step 3: Create a single comprehensive INSERT policy
-- This policy allows:
-- 1. Users to insert their own record (auth.uid() = id) - for registration
-- 2. Galleries to insert managed artists (managed_by_gallery_id = auth.uid() AND is_gallery = false)
CREATE POLICY "artists_insert_own_or_managed"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Case 1: User is inserting their own record (for registration)
  -- This matches when id = auth.uid() in the VALUES being inserted
  auth.uid() = id
  OR
  -- Case 2: Gallery is inserting a managed artist
  -- This matches when managed_by_gallery_id = auth.uid() AND is_gallery = false
  -- We check the VALUES being inserted, not the table, so NO recursion!
  (
    "managed_by_gallery_id" = auth.uid()
    AND "is_gallery" = false
  )
);

-- Step 4: Verify the policy was created
SELECT 
  'After Fix' as status,
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 5: Show final INSERT policy details
SELECT 
  'Final INSERT Policy' as info,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname = 'artists_insert_own_or_managed';

