-- Add a 'role' column to the Collectors table
ALTER TABLE "Collectors"
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'collector';

-- Optionally, add a check constraint for allowed values
ALTER TABLE "Collectors"
ADD CONSTRAINT collectors_role_check CHECK (role IN ('collector', 'artist')); 