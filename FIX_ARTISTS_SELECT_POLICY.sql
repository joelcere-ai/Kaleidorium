-- FIX: Ensure users can SELECT their own Artists record
-- This is needed for gallery/artist detection on profile page

-- Check existing SELECT policies
SELECT 
  policyname,
  cmd,
  roles,
  qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Drop existing SELECT policies that might be blocking
DROP POLICY IF EXISTS "artists_select_own" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_own_data_read" ON "public"."Artists";
DROP POLICY IF EXISTS "galleries_read_managed_artists" ON "public"."Artists";

-- Create a simple SELECT policy that allows users to read their own record
-- This is the base policy needed for gallery/artist detection
CREATE POLICY "artists_select_own"
ON "public"."Artists"
FOR SELECT
TO authenticated
USING (
  -- Allow if user is viewing their own record
  auth.uid() = id
);

-- Now add the gallery managed artists SELECT policy (if it doesn't exist)
-- This allows galleries to also see artists they manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'Artists'
    AND policyname = 'galleries_select_managed_artists'
  ) THEN
    CREATE POLICY "galleries_select_managed_artists"
    ON "public"."Artists"
    FOR SELECT
    TO authenticated
    USING (
      -- Allow if user is viewing their own record
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
  END IF;
END $$;

-- Verify the policies were created
SELECT 
  policyname,
  cmd,
  roles,
  qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND cmd = 'SELECT'
ORDER BY policyname;

