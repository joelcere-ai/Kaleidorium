-- Fix UPDATE policy for Artists table to work with new Galleries table
-- This allows galleries to edit/update artists they manage

-- Drop existing UPDATE policies that might conflict
DROP POLICY IF EXISTS "galleries_update_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_update_own" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_update_own_or_managed" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_update_comprehensive" ON "public"."Artists";

-- Create new UPDATE policy that checks the Galleries table (no recursion)
CREATE POLICY "artists_update_working"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is updating their own record
  id = auth.uid()
  OR
  -- Allow if user is a gallery updating artists they manage
  -- This checks the Galleries table (different table, no recursion)
  (
    EXISTS (
      SELECT 1 FROM "public"."Galleries" AS g
      WHERE g."id" = auth.uid()
    )
    AND "managed_by_gallery_id" = auth.uid()
  )
)
WITH CHECK (
  -- Same conditions for the new values
  id = auth.uid()
  OR
  (
    EXISTS (
      SELECT 1 FROM "public"."Galleries" AS g
      WHERE g."id" = auth.uid()
    )
    AND "managed_by_gallery_id" = auth.uid()
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
AND tablename = 'Artists'
AND cmd = 'UPDATE'
ORDER BY policyname;

