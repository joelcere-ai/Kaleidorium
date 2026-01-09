-- DIAGNOSE: Check all RLS policies and triggers on Artists table
-- Run this to see what's actually active

-- Step 1: Check if RLS is enabled on the Artists table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'Artists';

-- Step 2: List ALL policies on Artists table (INSERT, UPDATE, SELECT, DELETE)
SELECT 
  policyname,
  cmd as command,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
ORDER BY cmd, policyname;

-- Step 3: Check for any triggers on Artists table that might cause recursion
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'Artists'
ORDER BY trigger_name;

-- Step 4: Check the actual policy definitions from pg_policy
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public'
AND pc.relname = 'Artists'
ORDER BY pol.polcmd, pol.polname;


