-- SIMPLE EXPLICIT FIX: Create a policy that definitely works
-- The issue: The policy condition might not be matching correctly
-- Solution: Create the simplest possible policy that explicitly checks the values

-- Step 1: Show current policy condition
SELECT 
  pol.polname as policy_name,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as current_condition
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public'
AND pc.relname = 'Artists'
AND pol.polname = 'artists_insert_policy';

-- Step 2: Drop the existing policy
DROP POLICY IF EXISTS "artists_insert_policy" ON "public"."Artists";

-- Step 3: Create a VERY simple and explicit policy
-- This policy allows INSERT if:
-- 1. The id being inserted equals auth.uid() (user registering themselves)
-- 2. OR managed_by_gallery_id equals auth.uid() AND is_gallery is false (gallery creating artist)
CREATE POLICY "artists_insert_simple"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if inserting own record (for registration)
  id = auth.uid()
  OR
  -- Allow if gallery is creating a managed artist
  (managed_by_gallery_id = auth.uid() AND is_gallery = false)
);

-- Step 4: Verify the new policy
SELECT 
  'Policy Created' as status,
  pol.polname as policy_name,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as policy_condition
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public'
AND pc.relname = 'Artists'
AND pol.polname = 'artists_insert_simple';

-- Step 5: Show all INSERT policies
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

