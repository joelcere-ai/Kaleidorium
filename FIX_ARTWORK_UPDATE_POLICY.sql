-- Fix UPDATE policy for Artwork table to work with new Galleries table
-- This allows galleries to edit/update artworks they uploaded

-- Drop existing UPDATE policies that might conflict
DROP POLICY IF EXISTS "artwork_update_artists_and_galleries" ON "public"."Artwork";
DROP POLICY IF EXISTS "artwork_update_artists" ON "public"."Artwork";
DROP POLICY IF EXISTS "artwork_artists_update" ON "public"."Artwork";

-- Create new UPDATE policy that checks the Galleries table (no recursion)
CREATE POLICY "artwork_update_working"
ON "public"."Artwork"
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is an artist updating their own artwork
  EXISTS (
    SELECT 1 FROM "public"."Artists" AS a
    WHERE a."id" = auth.uid()
    AND a."id" = "Artwork"."artist_id"
  )
  OR
  -- Allow if user is a gallery updating artwork they uploaded
  -- This checks the Galleries table (different table, no recursion)
  (
    EXISTS (
      SELECT 1 FROM "public"."Galleries" AS g
      WHERE g."id" = auth.uid()
    )
    AND "uploaded_by_gallery_id" = auth.uid()
  )
)
WITH CHECK (
  -- Same conditions for the new values
  EXISTS (
    SELECT 1 FROM "public"."Artists" AS a
    WHERE a."id" = auth.uid()
    AND a."id" = "Artwork"."artist_id"
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM "public"."Galleries" AS g
      WHERE g."id" = auth.uid()
    )
    AND "uploaded_by_gallery_id" = auth.uid()
  )
);

-- Verify the policy was created
SELECT
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Artwork'
AND cmd = 'UPDATE'
ORDER BY policyname;

