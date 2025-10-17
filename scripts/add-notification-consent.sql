-- Add notification consent field to Artists and Collectors tables
-- This field will track user consent for receiving notifications about new artwork

-- Add the column to Artists table if it doesn't exist
ALTER TABLE "public"."Artists" 
ADD COLUMN IF NOT EXISTS "notification_consent" BOOLEAN DEFAULT FALSE;

-- Add the column to Collectors table if it doesn't exist  
ALTER TABLE "public"."Collectors" 
ADD COLUMN IF NOT EXISTS "notification_consent" BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance when filtering by consent
CREATE INDEX IF NOT EXISTS "idx_artists_notification_consent" ON "public"."Artists" ("notification_consent");
CREATE INDEX IF NOT EXISTS "idx_collectors_notification_consent" ON "public"."Collectors" ("notification_consent");

-- Verify the columns were added successfully
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('Artists', 'Collectors') 
  AND column_name = 'notification_consent'
ORDER BY table_name;

-- Show sample data with the new column
SELECT 
  'Artists' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE notification_consent = TRUE) as consented_records,
  COUNT(*) FILTER (WHERE notification_consent = FALSE) as not_consented_records
FROM "public"."Artists"

UNION ALL

SELECT 
  'Collectors' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE notification_consent = TRUE) as consented_records,
  COUNT(*) FILTER (WHERE notification_consent = FALSE) as not_consented_records
FROM "public"."Collectors";
