-- Add founding_artist field to Artists table
-- This field will be true for the first 100 artists who registered

-- Add the column if it doesn't exist
ALTER TABLE "public"."Artists" 
ADD COLUMN IF NOT EXISTS "founding_artist" BOOLEAN DEFAULT FALSE;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS "idx_artists_founding_artist" ON "public"."Artists" ("founding_artist");

-- Update the first 100 artists to be founding artists
-- This query uses ROW_NUMBER() to identify the first 100 artists by created_at timestamp
UPDATE "public"."Artists" 
SET "founding_artist" = TRUE
WHERE "id" IN (
  SELECT "id" 
  FROM (
    SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at" ASC) as rn
    FROM "public"."Artists"
  ) ranked
  WHERE rn <= 100
);

-- Verify the update
SELECT 
  COUNT(*) as total_founding_artists,
  COUNT(*) FILTER (WHERE "founding_artist" = TRUE) as marked_founding_artists
FROM "public"."Artists";

-- Show the first 10 founding artists as a sample
SELECT 
  "username", 
  "firstname", 
  "surname", 
  "created_at",
  "founding_artist"
FROM "public"."Artists" 
WHERE "founding_artist" = TRUE 
ORDER BY "created_at" ASC 
LIMIT 10;
