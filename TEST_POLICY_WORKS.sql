-- TEST: Verify the policy works by checking what it's actually checking
-- This will help us understand why it's not matching

-- Step 1: Show the exact policy condition (with proper formatting)
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as exact_with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public'
AND pc.relname = 'Artists'
AND pol.polname = 'artists_insert_final';

-- Step 2: Check if there are any other INSERT policies that might conflict
SELECT 
  'All INSERT Policies' as info,
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 3: Check for triggers on INSERT
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

-- Step 4: Check the table structure to ensure managed_by_gallery_id column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Artists'
AND column_name = 'managed_by_gallery_id';

-- Step 5: If policy still doesn't work, try recreating it with explicit column references
-- Drop and recreate with explicit quotes
DROP POLICY IF EXISTS "artists_insert_final" ON "public"."Artists";

CREATE POLICY "artists_insert_final"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Use explicit column references with quotes to ensure case sensitivity
  ("id" = auth.uid())
  OR
  ("managed_by_gallery_id" = auth.uid())
);

-- Step 6: Verify the new policy
SELECT 
  'Policy Recreated' as status,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname = 'artists_insert_final';

