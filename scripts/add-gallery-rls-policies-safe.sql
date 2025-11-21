-- SAFE VERSION: Add RLS policies to allow galleries to manage their artists
-- This version creates new policies FIRST, then drops old ones to minimize risk
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: CREATE NEW POLICIES (Non-destructive)
-- ============================================

-- 1. Allow galleries to INSERT artists they manage
CREATE POLICY "galleries_insert_managed_artists"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the user is a gallery and setting managed_by_gallery_id to their own ID
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
    AND "Artists"."is_gallery" = true
  )
  AND "managed_by_gallery_id" = auth.uid()
  AND "is_gallery" = false
);

-- 2. Allow galleries to SELECT artists they manage
CREATE POLICY "galleries_read_managed_artists"
ON "public"."Artists"
FOR SELECT
TO authenticated
USING (
  -- Allow if user is viewing their own artist record
  auth.uid() = id
  OR
  -- Allow if user is a gallery viewing artists they manage
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
  )
);

-- 3. Allow galleries to UPDATE artists they manage
CREATE POLICY "galleries_update_managed_artists"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is updating their own artist record
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
  -- Allow if user is updating their own artist record
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
);

-- 4. Allow galleries to DELETE artists they manage
CREATE POLICY "galleries_delete_managed_artists"
ON "public"."Artists"
FOR DELETE
TO authenticated
USING (
  -- Allow if user is deleting their own artist record
  auth.uid() = id
  OR
  -- Allow if user is a gallery deleting artists they manage
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
  )
);

-- 5. Create NEW artwork insert policy (with gallery support) FIRST
-- This ensures functionality is maintained even if old policy drop fails
CREATE POLICY "artwork_insert_artists_and_galleries"
ON "public"."Artwork"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is an artist inserting their own artwork
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
    AND "Artists"."id" = "Artwork"."artist_id"
  )
  OR
  -- Allow if user is a gallery inserting artwork for artists they manage
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND EXISTS (
      SELECT 1 FROM "public"."Artists" AS managed_artist
      WHERE managed_artist."id" = "Artwork"."artist_id"
      AND managed_artist."managed_by_gallery_id" = auth.uid()
    )
  )
);

-- 6. Create NEW artwork update policy (with gallery support) FIRST
CREATE POLICY "artwork_update_artists_and_galleries"
ON "public"."Artwork"
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is an artist updating their own artwork
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
    AND "Artists"."id" = "Artwork"."artist_id"
  )
  OR
  -- Allow if user is a gallery updating artwork for artists they manage
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND EXISTS (
      SELECT 1 FROM "public"."Artists" AS managed_artist
      WHERE managed_artist."id" = "Artwork"."artist_id"
      AND managed_artist."managed_by_gallery_id" = auth.uid()
    )
  )
)
WITH CHECK (
  -- Allow if user is an artist updating their own artwork
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
    AND "Artists"."id" = "Artwork"."artist_id"
  )
  OR
  -- Allow if user is a gallery updating artwork for artists they manage
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND EXISTS (
      SELECT 1 FROM "public"."Artists" AS managed_artist
      WHERE managed_artist."id" = "Artwork"."artist_id"
      AND managed_artist."managed_by_gallery_id" = auth.uid()
    )
  )
);

-- ============================================
-- PART 2: DROP OLD POLICIES (Only if new ones exist)
-- ============================================
-- These are the "destructive" operations, but they're safe because:
-- 1. New policies are already created above
-- 2. IF EXISTS prevents errors if policies don't exist
-- 3. Both policies can coexist temporarily (PostgreSQL allows this)

-- Drop old artwork policies ONLY if they exist
-- Note: If these policies don't exist, the app might be using different policy names
-- In that case, you can skip this section or check your actual policy names first
DROP POLICY IF EXISTS "artwork_insert_artists" ON "public"."Artwork";
DROP POLICY IF EXISTS "artwork_update_artists" ON "public"."Artwork";
DROP POLICY IF EXISTS "artwork_artists_insert" ON "public"."Artwork";
DROP POLICY IF EXISTS "artwork_artists_update" ON "public"."Artwork";

-- ============================================
-- PART 3: VERIFY POLICIES WERE CREATED
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('Artists', 'Artwork')
ORDER BY tablename, cmd, policyname;

