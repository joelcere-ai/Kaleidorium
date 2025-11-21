-- Add gallery support to Artists and Artwork tables
-- This allows galleries to register and upload artwork for multiple artists

-- 1. Add is_gallery flag to Artists table
ALTER TABLE "public"."Artists" 
ADD COLUMN IF NOT EXISTS "is_gallery" BOOLEAN DEFAULT FALSE;

-- 2. Add managed_by_gallery_id to Artists table (links artist profiles to galleries)
ALTER TABLE "public"."Artists" 
ADD COLUMN IF NOT EXISTS "managed_by_gallery_id" UUID REFERENCES "public"."Artists"("id") ON DELETE SET NULL;

-- 3. Add uploaded_by_gallery_id to Artwork table (tracks which gallery uploaded the artwork)
ALTER TABLE "public"."Artwork" 
ADD COLUMN IF NOT EXISTS "uploaded_by_gallery_id" UUID REFERENCES "public"."Artists"("id") ON DELETE SET NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_artists_is_gallery" ON "public"."Artists" ("is_gallery");
CREATE INDEX IF NOT EXISTS "idx_artists_managed_by_gallery" ON "public"."Artists" ("managed_by_gallery_id");
CREATE INDEX IF NOT EXISTS "idx_artwork_uploaded_by_gallery" ON "public"."Artwork" ("uploaded_by_gallery_id");

-- 5. Add comments for documentation
COMMENT ON COLUMN "public"."Artists"."is_gallery" IS 'True if this is a gallery account, false if individual artist';
COMMENT ON COLUMN "public"."Artists"."managed_by_gallery_id" IS 'If this artist profile is managed by a gallery, this links to the gallery Artists record';
COMMENT ON COLUMN "public"."Artwork"."uploaded_by_gallery_id" IS 'If artwork was uploaded by a gallery, this tracks which gallery uploaded it';

