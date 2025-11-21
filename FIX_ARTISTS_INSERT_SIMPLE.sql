-- FIX: Simple Artists INSERT Policy - No Recursion
-- This creates the simplest possible INSERT policy that allows new gallery registrations
-- without any risk of infinite recursion

-- Step 1: Drop ALL existing INSERT policies on Artists table
DROP POLICY IF EXISTS "galleries_insert_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_gallery" ON "public"."Artists";

-- Step 2: Create the SIMPLEST possible INSERT policy
-- This ONLY checks auth.uid() = id, which never queries the Artists table
-- This allows any authenticated user to insert their own record (for registration)
CREATE POLICY "artists_insert_own"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- ONLY check: user is inserting their own record
  -- This never queries the Artists table, so NO recursion possible!
  auth.uid() = id
);

-- Step 3: Also fix UPDATE policy to be simple (no recursion)
-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "artists_update_own_or_managed" ON "public"."Artists";
DROP POLICY IF EXISTS "galleries_update_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_update_own" ON "public"."Artists";

-- Create a simple UPDATE policy that only checks auth.uid() = id
-- This allows users to update their own record without recursion
CREATE POLICY "artists_update_own"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (
  -- ONLY check: user is updating their own record
  -- This never queries the Artists table, so NO recursion possible!
  auth.uid() = id
)
WITH CHECK (
  -- Same check for the new values
  auth.uid() = id
);

-- Step 4: Verify the policies were created
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname = 'artists_insert_own';

-- Step 5: Show all INSERT and UPDATE policies (should only be one of each now)
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

SELECT 
  'UPDATE Policies' as policy_type,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'UPDATE'
ORDER BY policyname;

