-- New table only — does not modify existing tables.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS curated_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_title TEXT NOT NULL,
  description TEXT NOT NULL,
  artwork_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT curated_collections_month_unique UNIQUE (month)
);

CREATE INDEX IF NOT EXISTS curated_collections_month_idx ON curated_collections (month DESC);

ALTER TABLE curated_collections ENABLE ROW LEVEL SECURITY;

-- Public read for the Featured page
DROP POLICY IF EXISTS "curated_collections_public_read" ON curated_collections;
CREATE POLICY "curated_collections_public_read"
  ON curated_collections
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role / edge function writes (no insert policy for anon)
DROP POLICY IF EXISTS "curated_collections_service_write" ON curated_collections;
CREATE POLICY "curated_collections_service_write"
  ON curated_collections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE curated_collections IS 'Monthly Kurator curated collections for /featured';
