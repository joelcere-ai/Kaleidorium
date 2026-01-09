-- VERIFY: Check the exact policy condition and test it
-- This will show us what the policy is actually checking

-- Step 1: Show the exact WITH CHECK expression
SELECT 
  pol.polname as policy_name,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as exact_condition
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public'
AND pc.relname = 'Artists'
AND pol.polname = 'artists_insert_simple';

-- Step 2: Show the policy from pg_policies view
SELECT 
  policyname,
  cmd,
  roles,
  with_check as condition_from_view
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname = 'artists_insert_simple';

-- Step 3: Check what your current user ID is (for testing)
SELECT 
  auth.uid() as current_user_id;

-- Step 4: Check if you have an Artists record as a gallery
SELECT 
  id,
  username,
  is_gallery,
  managed_by_gallery_id
FROM "public"."Artists"
WHERE id = auth.uid();


