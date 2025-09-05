-- 🔧 FIXED RLS SETUP - Run this in Supabase SQL Editor
-- This script handles existing policies and ensures proper RLS configuration

-- 1. Enable RLS on all main tables (safe to run multiple times)
ALTER TABLE "public"."Artwork" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ArtworkAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Artists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Collectors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Invitations" ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to read artwork" ON "public"."Artwork";
DROP POLICY IF EXISTS "Allow artists to insert their artwork" ON "public"."Artwork";
DROP POLICY IF EXISTS "Allow artists to update their artwork" ON "public"."Artwork";
DROP POLICY IF EXISTS "Artists can manage their artwork" ON "public"."Artwork";
DROP POLICY IF EXISTS "Authenticated users can read artwork" ON "public"."Artwork";

DROP POLICY IF EXISTS "Allow authenticated users to read analytics" ON "public"."ArtworkAnalytics";
DROP POLICY IF EXISTS "Allow system to manage analytics" ON "public"."ArtworkAnalytics";
DROP POLICY IF EXISTS "Users can read their analytics" ON "public"."ArtworkAnalytics";

DROP POLICY IF EXISTS "Allow artists to read their own data" ON "public"."Artists";
DROP POLICY IF EXISTS "Allow artists to update their own data" ON "public"."Artists";

DROP POLICY IF EXISTS "Allow collectors to read their own data" ON "public"."Collectors";
DROP POLICY IF EXISTS "Allow collectors to update their own data" ON "public"."Collectors";
DROP POLICY IF EXISTS "Allow new user registration" ON "public"."Collectors";

DROP POLICY IF EXISTS "Allow admins to manage invitations" ON "public"."Invitations";

-- 3. Create fresh, secure policies

-- ARTWORK TABLE POLICIES
CREATE POLICY "artwork_read_authenticated"
ON "public"."Artwork"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "artwork_insert_artists"
ON "public"."Artwork"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
  )
);

CREATE POLICY "artwork_update_artists"
ON "public"."Artwork"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
  )
);

-- ARTWORK ANALYTICS POLICIES
CREATE POLICY "analytics_read_authenticated"
ON "public"."ArtworkAnalytics"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "analytics_manage_system"
ON "public"."ArtworkAnalytics"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ARTISTS TABLE POLICIES
CREATE POLICY "artists_read_own"
ON "public"."Artists"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "artists_update_own"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- COLLECTORS TABLE POLICIES
CREATE POLICY "collectors_read_own"
ON "public"."Collectors"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "collectors_update_own"
ON "public"."Collectors"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "collectors_insert_new"
ON "public"."Collectors"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- INVITATIONS TABLE POLICIES (Admin only)
CREATE POLICY "invitations_admin_only"
ON "public"."Invitations"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."Collectors"
    WHERE "Collectors"."user_id" = auth.uid()
    AND "Collectors"."role" = 'admin'
  )
);

-- 4. Verify RLS is properly enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('Artwork', 'ArtworkAnalytics', 'Artists', 'Collectors', 'Invitations')
ORDER BY tablename; 