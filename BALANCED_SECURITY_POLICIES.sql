-- 🎯 BALANCED SECURITY POLICIES
-- Allow public artwork viewing while protecting user data and write operations

-- 1. Drop current restrictive policies
DROP POLICY IF EXISTS "secure_artwork_read" ON "public"."Artwork";
DROP POLICY IF EXISTS "secure_artwork_modify" ON "public"."Artwork";
DROP POLICY IF EXISTS "secure_analytics" ON "public"."ArtworkAnalytics";
DROP POLICY IF EXISTS "secure_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "secure_collectors" ON "public"."Collectors";
DROP POLICY IF EXISTS "secure_invitations" ON "public"."Invitations";

-- 2. ARTWORK TABLE - Allow public read (safe for discovery), restrict writes
CREATE POLICY "artwork_public_read"
ON "public"."Artwork"
FOR SELECT
TO public  -- Anyone can view artwork for discovery
USING (true);

CREATE POLICY "artwork_artists_only_write"
ON "public"."Artwork"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
  )
);

CREATE POLICY "artwork_artists_only_update"
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

CREATE POLICY "artwork_artists_only_delete"
ON "public"."Artwork"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
  )
);

-- 3. ARTWORK ANALYTICS - Allow public read (for like counts), restrict writes
CREATE POLICY "analytics_public_read"
ON "public"."ArtworkAnalytics"
FOR SELECT
TO public  -- Anyone can see analytics (views, likes)
USING (true);

CREATE POLICY "analytics_authenticated_write"
ON "public"."ArtworkAnalytics"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "analytics_authenticated_update"
ON "public"."ArtworkAnalytics"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. ARTISTS TABLE - Only authenticated artists can see their own data
CREATE POLICY "artists_own_data_read"
ON "public"."Artists"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "artists_own_data_write"
ON "public"."Artists"
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. COLLECTORS TABLE - Only authenticated users can see their own data
CREATE POLICY "collectors_own_data_read"
ON "public"."Collectors"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "collectors_own_data_write"
ON "public"."Collectors"
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. INVITATIONS TABLE - Admin only (keep secure)
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
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."Collectors"
    WHERE "Collectors"."user_id" = auth.uid()
    AND "Collectors"."role" = 'admin'
  )
);

-- 7. Verify policies are correctly set
SELECT 
  'ARTWORK POLICIES - should allow public SELECT' as check_type,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artwork'
ORDER BY cmd, policyname;

SELECT 
  'USER DATA POLICIES - should only show authenticated' as check_type,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('Artists', 'Collectors', 'Invitations')
ORDER BY tablename, cmd, policyname; 