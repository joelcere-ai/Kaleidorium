-- Add RLS policies to allow galleries to manage their artists
-- Run this in Supabase SQL Editor

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

-- 5. Also need to allow galleries to upload artwork for their managed artists
-- Update the artwork_insert_artists policy to also allow galleries
DROP POLICY IF EXISTS "artwork_insert_artists" ON "public"."Artwork";

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

-- 6. Update artwork update policy to allow galleries
DROP POLICY IF EXISTS "artwork_update_artists" ON "public"."Artwork";

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

-- Verify policies were created
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

