-- Additive migration only: creates ONE new table. Does not alter any existing tables.
-- Safe to run in Supabase SQL Editor (no DROP statements).

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

-- Policies (created only if missing — no DROP)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'curated_collections'
      AND policyname = 'curated_collections_public_read'
  ) THEN
    CREATE POLICY "curated_collections_public_read"
      ON curated_collections
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'curated_collections'
      AND policyname = 'curated_collections_service_write'
  ) THEN
    CREATE POLICY "curated_collections_service_write"
      ON curated_collections
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE curated_collections IS 'Monthly Kurator curated collections for /featured';
