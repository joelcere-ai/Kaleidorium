-- COMPLETE FIX: Drop ALL policies and create a single simple one
-- This is the most aggressive fix to eliminate recursion

-- Step 1: Drop EVERY policy on Artists table (all commands)
-- This ensures we start with a clean slate
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'Artists'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON "public"."Artists"', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 2: Verify all policies are dropped
SELECT 
  'Policies after drop' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists';

-- Step 3: Create the SIMPLEST possible INSERT policy
-- This ONLY checks auth.uid() = id - NO table queries, NO recursion possible
CREATE POLICY "artists_insert_own"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

-- Step 4: Create the SIMPLEST possible UPDATE policy
CREATE POLICY "artists_update_own"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Step 5: Create the SIMPLEST possible SELECT policy
CREATE POLICY "artists_select_own"
ON "public"."Artists"
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Step 6: Create the SIMPLEST possible DELETE policy
CREATE POLICY "artists_delete_own"
ON "public"."Artists"
FOR DELETE
TO authenticated
USING (
  auth.uid() = id
);

-- Step 7: Verify the new policies
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
ORDER BY cmd, policyname;

-- Step 8: Check if RLS is enabled (it should be)
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'Artists';

