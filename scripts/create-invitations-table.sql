-- Create Invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."Invitations" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "email" text NOT NULL,
    "token" text NOT NULL UNIQUE,
    "created_at" timestamptz DEFAULT now(),
    "used" boolean DEFAULT false,
    "used_at" timestamptz
);

-- Enable RLS
ALTER TABLE "public"."Invitations" ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to Invitations table
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

-- Grant necessary permissions
GRANT ALL ON "public"."Invitations" TO authenticated;
GRANT ALL ON "public"."Invitations" TO service_role;



