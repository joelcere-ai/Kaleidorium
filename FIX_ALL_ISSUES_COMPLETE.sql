-- COMPLETE FIX: Address all RLS issues and verify the test policy
-- If the test policy (WITH CHECK true) doesn't work, there's a trigger or function blocking

-- Step 1: Check current INSERT policy
SELECT 
  'Current Policy' as status,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT';

-- Step 2: Check for triggers that might block INSERT
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'Artists'
AND event_manipulation = 'INSERT'
ORDER BY trigger_name;

-- Step 3: Check ALL policies (might be a conflict)
SELECT 
  'All Policies' as info,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
ORDER BY cmd, policyname;

-- Step 4: If test policy exists, verify it allows everything
-- If test policy doesn't work, we need to check triggers/functions
SELECT 
  'Test Policy Check' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'Artists'
      AND policyname = 'artists_insert_test'
      AND with_check = 'true'
    ) THEN 'Test policy exists with WITH CHECK (true)'
    ELSE 'Test policy does not exist or has different condition'
  END as test_policy_status;

-- Step 5: Drop ALL INSERT policies and create a single working one
DROP POLICY IF EXISTS "artists_insert_test" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_gallery_only" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_allow_galleries" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_simple" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_policy" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";

-- Step 6: Create the final working policy
-- This policy allows both user registration AND gallery-created artists
CREATE POLICY "artists_insert_final"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is inserting their own record (id = auth.uid())
  id = auth.uid()
  OR
  -- Allow if gallery is creating an artist (managed_by_gallery_id = auth.uid())
  managed_by_gallery_id = auth.uid()
);

-- Step 7: Verify
SELECT 
  'Final Policy' as status,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname = 'artists_insert_final';

