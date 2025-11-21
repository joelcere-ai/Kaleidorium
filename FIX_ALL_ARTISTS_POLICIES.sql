-- FIX: All Artists Table RLS Policies to Prevent Infinite Recursion
-- This fixes both INSERT and UPDATE policies that cause infinite recursion
-- Run this in your Supabase SQL Editor

-- ============================================
-- PART 1: FIX INSERT POLICY
-- ============================================

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "galleries_insert_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_insert_own_or_managed" ON "public"."Artists";

-- Create new INSERT policy that allows users to insert their own record (NO recursion!)
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

-- ============================================
-- PART 2: FIX UPDATE POLICY
-- ============================================

-- Drop existing UPDATE policies that might cause recursion
DROP POLICY IF EXISTS "galleries_update_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_update_own" ON "public"."Artists";

-- Create new UPDATE policy that allows users to update their own record (NO recursion!)
CREATE POLICY "artists_update_own_or_managed"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is updating their own record (NO recursion!)
  auth.uid() = id
  OR
  -- Allow if user is a gallery updating artists they manage
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
  )
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  auth.uid() = id
  OR
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
  )
);

-- ============================================
-- PART 3: VERIFY POLICIES
-- ============================================

-- Show all INSERT policies
SELECT 
  'INSERT Policies' as policy_type,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Show all UPDATE policies
SELECT 
  'UPDATE Policies' as policy_type,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'UPDATE'
ORDER BY policyname;

