-- FIX: Infinite Recursion in Artists INSERT Policy
-- This fixes the issue where gallery registration fails with "infinite recursion detected in policy"
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL existing INSERT policies on Artists table (if they exist)
DROP POLICY IF EXISTS "galleries_insert_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";

-- Step 2: Create a new policy that allows users to INSERT their own record during registration
-- This avoids the infinite recursion by checking auth.uid() = id first (no Artists table query needed)
CREATE POLICY "artists_insert_own_or_managed"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is inserting their own record (for registration - NO recursion!)
  auth.uid() = id
  OR
  -- Allow if user is a gallery inserting a managed artist (after they exist)
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
    AND "is_gallery" = false
  )
);

-- Step 3: Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

