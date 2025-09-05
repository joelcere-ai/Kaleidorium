-- 🚨 URGENT: Run these commands in Supabase SQL Editor immediately
-- Your database is currently UNSECURED - anyone can access all data

-- 1. Enable RLS on all main tables
ALTER TABLE "public"."Artwork" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ArtworkAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Artists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Collectors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Invitations" ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can read artwork" ON "public"."Artwork";
DROP POLICY IF EXISTS "Artists can manage their artwork" ON "public"."Artwork";
DROP POLICY IF EXISTS "Users can read their analytics" ON "public"."ArtworkAnalytics";

-- 3. Create secure policies for Artwork table
CREATE POLICY "Allow authenticated users to read artwork"
ON "public"."Artwork"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow artists to insert their artwork"
ON "public"."Artwork"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."Artists"
    WHERE "Artists"."id" = auth.uid()
  )
);

CREATE POLICY "Allow artists to update their artwork"
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

-- 4. Create policies for ArtworkAnalytics table
CREATE POLICY "Allow authenticated users to read analytics"
ON "public"."ArtworkAnalytics"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow system to manage analytics"
ON "public"."ArtworkAnalytics"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Create policies for Artists table
CREATE POLICY "Allow artists to read their own data"
ON "public"."Artists"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow artists to update their own data"
ON "public"."Artists"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Create policies for Collectors table
CREATE POLICY "Allow collectors to read their own data"
ON "public"."Collectors"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow collectors to update their own data"
ON "public"."Collectors"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow new user registration"
ON "public"."Collectors"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 7. Create policies for Invitations table (admin only)
CREATE POLICY "Allow admins to manage invitations"
ON "public"."Invitations"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."Collectors"
    WHERE "Collectors"."user_id" = auth.uid()
    AND "Collectors"."role" = 'admin'
  )
);

-- 8. Verify RLS is enabled (this should return all tables with RLS enabled)
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('Artwork', 'ArtworkAnalytics', 'Artists', 'Collectors', 'Invitations'); 