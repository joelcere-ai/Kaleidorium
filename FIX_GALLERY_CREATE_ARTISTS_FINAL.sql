-- FINAL FIX: Allow galleries to create artist records (no auth required for artists)
-- The key insight: Artists created by galleries don't have auth.uid() = id because:
-- 1. The artist hasn't registered yet (no auth token)
-- 2. The id is auto-generated (not the gallery's auth.uid())
-- 3. The gallery is authenticated, but the new artist record isn't
-- Solution: Allow INSERT when managed_by_gallery_id = auth.uid() (gallery is authenticated)

-- Step 1: Check existing INSERT policies
SELECT 
  'Current Policies' as status,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 2: Drop ALL existing INSERT policies
DROP POLICY IF EXISTS "artists_insert_own" ON "public"."Artists";
DROP POLICY IF EXISTS "galleries_insert_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";

-- Step 3: Create a single policy that handles both cases
CREATE POLICY "artists_insert_own_or_managed"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Case 1: User is registering themselves (id = auth.uid() in the VALUES)
  -- This works when a user registers and sets id = their auth.uid()
  auth.uid() = id
  OR
  -- Case 2: Gallery is creating an artist profile (artist hasn't registered yet)
  -- The gallery is authenticated (auth.uid() = gallery's ID)
  -- The new artist record has managed_by_gallery_id = gallery's ID
  -- The id is auto-generated (NOT the gallery's ID, and NOT an auth user yet)
  -- We check the VALUES being inserted, NOT the table, so NO recursion!
  (
    "managed_by_gallery_id" = auth.uid()
    AND "is_gallery" = false
  )
);

-- Step 4: Verify the policy
SELECT 
  'New Policy' as status,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname = 'artists_insert_own_or_managed';

-- Step 5: Show all INSERT policies (should only be one now)
SELECT 
  'All INSERT Policies' as info,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;


