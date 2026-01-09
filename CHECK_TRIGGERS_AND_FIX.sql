-- CHECK: Look for triggers or other issues, then create a test policy
-- The ultra-simple policy should work, so if it doesn't, something else is wrong

-- Step 1: Check for triggers on Artists table that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'Artists'
ORDER BY trigger_name;

-- Step 2: Check ALL policies on Artists table (not just INSERT)
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
ORDER BY cmd, policyname;

-- Step 3: Check if there are any functions that might be called
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%artist%'
ORDER BY routine_name;

-- Step 4: Drop the current policy and create a TEST policy that's very permissive
DROP POLICY IF EXISTS "artists_insert_gallery_only" ON "public"."Artists";

-- Step 5: Create a test policy that allows ANY authenticated user to insert
-- This is just for testing - we'll restrict it later
CREATE POLICY "artists_insert_test"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow ANY authenticated user to insert
  -- This is just to test if the policy system is working at all
  true
);

-- Step 6: Verify
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT';

-- NOTE: This test policy allows ANY authenticated user to insert ANY record
-- Try creating an artist now - if this works, the issue is with the policy condition
-- If this doesn't work, there's something else blocking (trigger, function, etc.)


