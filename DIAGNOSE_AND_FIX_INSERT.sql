-- DIAGNOSE AND FIX: Gallery INSERT issue
-- First diagnose what's wrong, then fix it

-- Step 1: Show ALL current INSERT policies with their exact conditions
SELECT 
  policyname,
  cmd,
  roles,
  with_check as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 2: Show the actual policy definition from pg_policy
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public'
AND pc.relname = 'Artists'
AND pol.polcmd = 'INSERT'
ORDER BY pol.polname;

-- Step 3: Drop ALL INSERT policies completely
DROP POLICY IF EXISTS "artists_insert_own" ON "public"."Artists";
DROP POLICY IF EXISTS "galleries_insert_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_gallery" ON "public"."Artists";

-- Step 4: Verify all policies are dropped
SELECT 
  'After Drop' as status,
  COUNT(*) as remaining_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT';

-- Step 5: Create a VERY explicit policy that definitely works
-- This policy explicitly allows:
-- 1. Users inserting their own record (id = auth.uid())
-- 2. Galleries inserting managed artists (managed_by_gallery_id = auth.uid() AND is_gallery = false)
CREATE POLICY "artists_insert_policy"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Condition 1: User is inserting their own record
  (auth.uid() = id)
  OR
  -- Condition 2: Gallery is inserting a managed artist
  -- Check that managed_by_gallery_id matches the authenticated user's ID
  -- AND that is_gallery is false (it's an artist, not another gallery)
  (
    (managed_by_gallery_id IS NOT NULL)
    AND (managed_by_gallery_id = auth.uid())
    AND (is_gallery = false)
  )
);

-- Step 6: Verify the new policy
SELECT 
  'New Policy Created' as status,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname = 'artists_insert_policy';

-- Step 7: Final check - show all INSERT policies
SELECT 
  'Final State' as status,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

