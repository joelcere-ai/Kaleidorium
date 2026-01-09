-- CHECK: Verify the exact policy condition and test it
-- This will show us what the policy is actually checking

-- Step 1: Show the exact WITH CHECK expression for the INSERT policy
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public'
AND pc.relname = 'Artists'
AND pol.polname = 'artists_insert_policy';

-- Step 2: Show all INSERT policies with their full definitions
SELECT 
  policyname,
  cmd,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 3: Check if RLS is enabled on the Artists table
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'Artists';


