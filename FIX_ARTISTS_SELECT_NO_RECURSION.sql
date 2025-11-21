-- FIX: Remove infinite recursion from Artists SELECT policies
-- The issue: galleries_select_managed_artists policy queries Artists table, causing recursion
-- Solution: Drop all SELECT policies and create simple ones without recursion

-- Step 1: Drop ALL existing SELECT policies on Artists table
DROP POLICY IF EXISTS "artists_select_own" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_own_data_read" ON "public"."Artists";
DROP POLICY IF EXISTS "galleries_read_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "galleries_select_managed_artists" ON "public"."Artists";

-- Step 2: Create the SIMPLEST possible SELECT policy
-- This ONLY checks auth.uid() = id - NO table queries, NO recursion possible
CREATE POLICY "artists_select_own"
ON "public"."Artists"
FOR SELECT
TO authenticated
USING (
  -- ONLY check: user is viewing their own record
  -- This never queries the Artists table, so NO recursion possible!
  auth.uid() = id
);

-- Step 3: Verify the policy was created
SELECT 
  policyname,
  cmd,
  roles,
  qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'SELECT'
ORDER BY policyname;

-- NOTE: For now, we're only allowing users to SELECT their own Artists record
-- This is sufficient for gallery/artist detection on the profile page
-- The galleries_select_managed_artists policy can be added later with a different approach
-- (e.g., using a security definer function) to avoid recursion

