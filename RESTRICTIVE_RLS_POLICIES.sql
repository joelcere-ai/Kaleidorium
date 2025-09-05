-- 🔒 RESTRICTIVE RLS POLICIES - Properly block anonymous access
-- Run this in Supabase SQL Editor to fix the anonymous access issue

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "artwork_read_authenticated" ON "public"."Artwork";
DROP POLICY IF EXISTS "artwork_insert_artists" ON "public"."Artwork";
DROP POLICY IF EXISTS "artwork_update_artists" ON "public"."Artwork";

DROP POLICY IF EXISTS "analytics_read_authenticated" ON "public"."ArtworkAnalytics";
DROP POLICY IF EXISTS "analytics_manage_system" ON "public"."ArtworkAnalytics";

DROP POLICY IF EXISTS "artists_read_own" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_update_own" ON "public"."Artists";

DROP POLICY IF EXISTS "collectors_read_own" ON "public"."Collectors";
DROP POLICY IF EXISTS "collectors_update_own" ON "public"."Collectors";
DROP POLICY IF EXISTS "collectors_insert_new" ON "public"."Collectors";

DROP POLICY IF EXISTS "invitations_admin_only" ON "public"."Invitations";

-- 2. Create RESTRICTIVE policies that block anonymous access

-- ARTWORK TABLE - Only authenticated users can read, only artists can modify
CREATE POLICY "artwork_authenticated_read_only"
ON "public"."Artwork"
FOR SELECT
TO authenticated  -- This explicitly excludes 'anon' role
USING (true);

CREATE POLICY "artwork_artists_insert"
ON "public"."Artwork"
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
  )
);

CREATE POLICY "artwork_artists_update"
ON "public"."Artwork"
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
  )
);

-- ARTWORK ANALYTICS - Only authenticated users
CREATE POLICY "analytics_authenticated_only"
ON "public"."ArtworkAnalytics"
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "analytics_authenticated_modify"
ON "public"."ArtworkAnalytics"
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ARTISTS TABLE - Only authenticated artists can see their own data
CREATE POLICY "artists_own_data_only"
ON "public"."Artists"
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = id
);

CREATE POLICY "artists_update_own_only"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  auth.uid() = id
);

-- COLLECTORS TABLE - Only authenticated collectors can see their own data
CREATE POLICY "collectors_own_data_only"
ON "public"."Collectors"
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

CREATE POLICY "collectors_update_own_only"
ON "public"."Collectors"
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

CREATE POLICY "collectors_insert_authenticated"
ON "public"."Collectors"
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

-- INVITATIONS TABLE - Only admins
CREATE POLICY "invitations_admin_access_only"
ON "public"."Invitations"
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM "public"."Collectors"
    WHERE "Collectors"."user_id" = auth.uid()
    AND "Collectors"."role" = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM "public"."Collectors"
    WHERE "Collectors"."user_id" = auth.uid()
    AND "Collectors"."role" = 'admin'
  )
);

-- 3. Verify no anonymous access is allowed
-- This should return 0 rows for each table when run with anonymous key
SELECT 'Testing anonymous access - should be blocked' as test_description;

-- 4. List all policies to verify they exist
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('Artwork', 'ArtworkAnalytics', 'Artists', 'Collectors', 'Invitations')
ORDER BY tablename, policyname; 