-- 🚨 EMERGENCY POLICY CLEANUP - CRITICAL SECURITY FIX
-- Your database is currently COMPLETELY PUBLIC - run this immediately!

-- 1. DROP ALL DANGEROUS PUBLIC POLICIES
-- ARTWORK - Remove all public access policies
DROP POLICY IF EXISTS "Allow public to read artwork" ON "public"."Artwork";
DROP POLICY IF EXISTS "Allow insert for anyone" ON "public"."Artwork";
DROP POLICY IF EXISTS "Allow select for anyone" ON "public"."Artwork";
DROP POLICY IF EXISTS "Allow update for anyone" ON "public"."Artwork";
DROP POLICY IF EXISTS "Allow service role to delete artwork" ON "public"."Artwork";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."Artwork";
DROP POLICY IF EXISTS "Users can read their own data" ON "public"."Artwork";

-- COLLECTORS - Remove all public access policies
DROP POLICY IF EXISTS "Allow delete for all" ON "public"."Collectors";
DROP POLICY IF EXISTS "Allow insert for all" ON "public"."Collectors";
DROP POLICY IF EXISTS "Allow public read access" ON "public"."Collectors";
DROP POLICY IF EXISTS "Allow select for all" ON "public"."Collectors";
DROP POLICY IF EXISTS "Allow update for all" ON "public"."Collectors";
DROP POLICY IF EXISTS "Allow individual access" ON "public"."Collectors";

-- INVITATIONS - Remove all public access policies
DROP POLICY IF EXISTS "Allow delete for all" ON "public"."Invitations";
DROP POLICY IF EXISTS "Allow insert for all" ON "public"."Invitations";
DROP POLICY IF EXISTS "Allow select for all" ON "public"."Invitations";
DROP POLICY IF EXISTS "Allow update for all" ON "public"."Invitations";

-- ARTISTS - Clean up any problematic policies
DROP POLICY IF EXISTS "Allow public read access" ON "public"."Artists";
DROP POLICY IF EXISTS "Allow authenticated insert access" ON "public"."Artists";
DROP POLICY IF EXISTS "Allow individual update access" ON "public"."Artists";

-- ARTWORK ANALYTICS - Clean up
DROP POLICY IF EXISTS "Allow public read access" ON "public"."ArtworkAnalytics";

-- 2. DROP ALL EXISTING POLICIES (clean slate)
DROP POLICY IF EXISTS "artwork_authenticated_read_only" ON "public"."Artwork";
DROP POLICY IF EXISTS "artwork_artists_insert" ON "public"."Artwork";
DROP POLICY IF EXISTS "artwork_artists_update" ON "public"."Artwork";
DROP POLICY IF EXISTS "analytics_authenticated_only" ON "public"."ArtworkAnalytics";
DROP POLICY IF EXISTS "analytics_authenticated_modify" ON "public"."ArtworkAnalytics";
DROP POLICY IF EXISTS "artists_own_data_only" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_update_own_only" ON "public"."Artists";
DROP POLICY IF EXISTS "collectors_own_data_only" ON "public"."Collectors";
DROP POLICY IF EXISTS "collectors_update_own_only" ON "public"."Collectors";
DROP POLICY IF EXISTS "collectors_insert_authenticated" ON "public"."Collectors";
DROP POLICY IF EXISTS "invitations_admin_access_only" ON "public"."Invitations";

-- 3. CREATE SECURE POLICIES - NO PUBLIC ACCESS

-- ARTWORK TABLE - Only authenticated users can read
CREATE POLICY "secure_artwork_read"
ON "public"."Artwork"
FOR SELECT
TO authenticated
USING (true);

-- Only artists can insert/update artwork
CREATE POLICY "secure_artwork_modify"
ON "public"."Artwork"
FOR ALL
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

-- ARTWORK ANALYTICS - Only authenticated users
CREATE POLICY "secure_analytics"
ON "public"."ArtworkAnalytics"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ARTISTS - Only own data
CREATE POLICY "secure_artists"
ON "public"."Artists"
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- COLLECTORS - Only own data
CREATE POLICY "secure_collectors"
ON "public"."Collectors"
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- INVITATIONS - Admin only
CREATE POLICY "secure_invitations"
ON "public"."Invitations"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."Collectors"
    WHERE "Collectors"."user_id" = auth.uid()
    AND "Collectors"."role" = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."Collectors"
    WHERE "Collectors"."user_id" = auth.uid()
    AND "Collectors"."role" = 'admin'
  )
);

-- 4. VERIFY NO PUBLIC POLICIES REMAIN
SELECT 
  'SECURITY CHECK: These should show NO public policies' as warning,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('Artwork', 'ArtworkAnalytics', 'Artists', 'Collectors', 'Invitations')
AND 'public' = ANY(roles)
ORDER BY tablename, policyname;

-- 5. SHOW ALL CURRENT POLICIES (should only be authenticated)
SELECT 
  'FINAL POLICIES - should only show authenticated roles' as status,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('Artwork', 'ArtworkAnalytics', 'Artists', 'Collectors', 'Invitations')
ORDER BY tablename, policyname; 