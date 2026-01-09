-- FIX: Gallery Registration Not Working - RLS Policy Issue
-- This fixes the issue where new gallery registrations are blocked by RLS policies
-- The problem: Multiple conflicting INSERT policies prevent new galleries from being inserted
-- Solution: Drop all INSERT policies and create a single, simple policy that allows:
--   1. Users to insert their own record (auth.uid() = id) - for registration
--   2. Galleries to insert managed artists (after they exist)

-- Step 1: Drop ALL existing INSERT policies on Artists table
DROP POLICY IF EXISTS "galleries_insert_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_gallery" ON "public"."Artists";

-- Step 2: Create a single, simple INSERT policy
-- This policy checks auth.uid() = id FIRST (no table query needed, no recursion!)
-- This allows new users to register as galleries
CREATE POLICY "artists_insert_own_or_managed"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- PRIMARY: Allow if user is inserting their own record (for registration)
  -- This check does NOT query the Artists table, so no recursion!
  auth.uid() = id
  OR
  -- SECONDARY: Allow if user is a gallery inserting a managed artist (after they exist)
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
    AND "is_gallery" = false
  )
);

-- Step 3: Also fix UPDATE policy to allow users to update their own record
-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "artists_update_own_or_managed" ON "public"."Artists";
DROP POLICY IF EXISTS "galleries_update_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_update_own" ON "public"."Artists";

-- Create a simple UPDATE policy
CREATE POLICY "artists_update_own_or_managed"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is updating their own record (no table query needed!)
  auth.uid() = id
  OR
  -- Allow if user is a gallery updating artists they manage
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
  )
)
WITH CHECK (
  -- Same conditions for the new values
  auth.uid() = id
  OR
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
  )
);

-- Step 4: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd IN ('INSERT', 'UPDATE')
ORDER BY cmd, policyname;

-- Step 5: Test query to verify the policy works
-- This should return the policy details
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname = 'artists_insert_own_or_managed';


