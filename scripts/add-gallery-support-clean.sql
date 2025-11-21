ALTER TABLE "public"."Artists" 
ADD COLUMN IF NOT EXISTS "is_gallery" BOOLEAN DEFAULT FALSE;

ALTER TABLE "public"."Artists" 
ADD COLUMN IF NOT EXISTS "managed_by_gallery_id" UUID REFERENCES "public"."Artists"("id") ON DELETE SET NULL;

ALTER TABLE "public"."Artwork" 
ADD COLUMN IF NOT EXISTS "uploaded_by_gallery_id" UUID REFERENCES "public"."Artists"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_artists_is_gallery" ON "public"."Artists" ("is_gallery");

CREATE INDEX IF NOT EXISTS "idx_artists_managed_by_gallery" ON "public"."Artists" ("managed_by_gallery_id");

CREATE INDEX IF NOT EXISTS "idx_artwork_uploaded_by_gallery" ON "public"."Artwork" ("uploaded_by_gallery_id");

