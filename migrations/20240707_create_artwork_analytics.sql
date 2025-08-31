-- Migration: Create ArtworkAnalytics table for tracking artwork performance
-- This table tracks views, leads, and other interactions for each artwork

CREATE TABLE IF NOT EXISTS "ArtworkAnalytics" (
    id SERIAL PRIMARY KEY,
    artwork_id INTEGER NOT NULL,
    views INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    adds_to_collection INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Create unique constraint on artwork_id
    UNIQUE(artwork_id),
    
    -- Foreign key constraint (assuming Artwork table exists)
    FOREIGN KEY (artwork_id) REFERENCES "Artwork"(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artwork_analytics_artwork_id ON "ArtworkAnalytics"(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_analytics_views ON "ArtworkAnalytics"(views);
CREATE INDEX IF NOT EXISTS idx_artwork_analytics_leads ON "ArtworkAnalytics"(leads);

-- Add comments for documentation
COMMENT ON TABLE "ArtworkAnalytics" IS 'Tracks performance metrics for artworks including views, leads, and interactions';
COMMENT ON COLUMN "ArtworkAnalytics".views IS 'Number of times artwork was displayed to collectors in discovery';
COMMENT ON COLUMN "ArtworkAnalytics".leads IS 'Number of times "View Artwork Page" button was clicked';
COMMENT ON COLUMN "ArtworkAnalytics".likes IS 'Number of likes received';
COMMENT ON COLUMN "ArtworkAnalytics".dislikes IS 'Number of dislikes received';
COMMENT ON COLUMN "ArtworkAnalytics".adds_to_collection IS 'Number of times added to collections'; 