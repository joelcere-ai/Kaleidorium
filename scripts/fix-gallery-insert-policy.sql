-- Fix infinite recursion in gallery INSERT policy
-- The issue: Gallery registration tries to INSERT into Artists, but the policy
-- checks if the gallery exists in Artists, which doesn't exist yet during registration.
-- Solution: Allow users to INSERT their own record, and separately allow galleries
-- to INSERT managed artists.

-- Drop the problematic policy
DROP POLICY IF EXISTS "galleries_insert_managed_artists" ON "public"."Artists";

-- Create a new policy that allows:
-- 1. Users to INSERT their own artist/gallery record (for registration)
-- 2. Galleries to INSERT managed artists (after they exist)
CREATE POLICY "artists_insert_own_or_managed"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is inserting their own record (for registration)
  auth.uid() = id
  OR
  -- Allow if user is a gallery inserting a managed artist
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

-- Verify the policy was created
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

