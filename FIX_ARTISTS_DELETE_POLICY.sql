-- Fix DELETE policy for Artists table to work with new Galleries table
-- This allows galleries to delete artists they manage

-- Drop existing DELETE policies that might conflict
DROP POLICY IF EXISTS "galleries_delete_managed_artists" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_delete_own" ON "public"."Artists";
DROP POLICY IF EXISTS "artists_delete_comprehensive" ON "public"."Artists";

-- Create new DELETE policy that checks the Galleries table (no recursion)
CREATE POLICY "artists_delete_working"
ON "public"."Artists"
FOR DELETE
TO authenticated
USING (
  -- Allow if user is deleting their own record
  id = auth.uid()
  OR
  -- Allow if user is a gallery deleting artists they manage
  -- This checks the Galleries table (different table, no recursion)
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
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Artists'
AND cmd = 'DELETE'
ORDER BY policyname;


