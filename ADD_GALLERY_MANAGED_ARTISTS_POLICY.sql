-- ADD: Policy to allow galleries to insert managed artists
-- This allows galleries to add artists they manage without recursion
-- The key is to check managed_by_gallery_id = auth.uid() without querying Artists table

-- Add a policy that allows galleries to INSERT artists they manage
-- This policy checks the VALUES being inserted, not the existing table
-- Note: We trust that if managed_by_gallery_id = auth.uid(), the user is a gallery
-- Application-level validation or triggers can verify this if needed
CREATE POLICY "galleries_insert_managed_artists"
ON "public"."Artists"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is inserting their own record (for registration)
  auth.uid() = id
  OR
  -- Allow if user is a gallery inserting a managed artist
  -- We check the VALUES being inserted (managed_by_gallery_id), not the table, so no recursion!
  (
    "managed_by_gallery_id" = auth.uid()
    AND "is_gallery" = false
    -- Note: id will be auto-generated, so we don't check it here
  )
);

-- Also add policies for SELECT, UPDATE, and DELETE for managed artists
-- Allow galleries to SELECT artists they manage
CREATE POLICY "galleries_select_managed_artists"
ON "public"."Artists"
FOR SELECT
TO authenticated
USING (
  -- Allow if user is viewing their own record
  auth.uid() = id
  OR
  -- Allow if user is a gallery viewing artists they manage
  -- This checks existing records, but only for SELECT, not INSERT, so it's safe
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
  )
);

-- Allow galleries to UPDATE artists they manage
CREATE POLICY "galleries_update_managed_artists"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is updating their own record
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
  -- Same conditions for the new values
  auth.uid() = id
  OR
  (
    EXISTS (
      SELECT 1 FROM "public"."Artists" AS gallery
      WHERE gallery."id" = auth.uid()
      AND gallery."is_gallery" = true
    )
    AND "managed_by_gallery_id" = auth.uid()
  )
);

-- Allow galleries to DELETE artists they manage
CREATE POLICY "galleries_delete_managed_artists"
ON "public"."Artists"
FOR DELETE
TO authenticated
USING (
  -- Allow if user is deleting their own record
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

-- Verify the policies were created
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'Artists'
AND policyname LIKE '%managed%'
ORDER BY cmd, policyname;

