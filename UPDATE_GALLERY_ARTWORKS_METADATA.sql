-- Update existing artworks uploaded by galleries (specifically spencegallery) 
-- to extract and populate style, genre, subject, and colour from tags and description
-- This script uses pattern matching to extract metadata from existing data

-- Step 1: Find artworks uploaded by galleries that are missing style/genre/subject/colour
SELECT 
  id,
  artwork_title,
  artist,
  style,
  genre,
  subject,
  colour,
  tags,
  description,
  uploaded_by_gallery_id
FROM "public"."Artwork"
WHERE uploaded_by_gallery_id IS NOT NULL
AND (style IS NULL OR genre IS NULL OR subject IS NULL OR colour IS NULL)
ORDER BY created_at DESC;

-- Step 2: Update style field from tags/description
-- Extract style keywords from tags or description
UPDATE "public"."Artwork"
SET style = CASE
  -- Check tags first (array contains)
  WHEN tags::text ILIKE '%abstract%' OR tags::text ILIKE '%abstraction%' THEN 'Abstract'
  WHEN tags::text ILIKE '%realism%' OR tags::text ILIKE '%realistic%' THEN 'Realism'
  WHEN tags::text ILIKE '%impressionism%' OR tags::text ILIKE '%impressionist%' THEN 'Impressionism'
  WHEN tags::text ILIKE '%expressionism%' OR tags::text ILIKE '%expressionist%' THEN 'Expressionism'
  WHEN tags::text ILIKE '%surrealism%' OR tags::text ILIKE '%surrealist%' THEN 'Surrealism'
  WHEN tags::text ILIKE '%pop art%' OR tags::text ILIKE '%popart%' THEN 'Pop Art'
  WHEN tags::text ILIKE '%minimalism%' OR tags::text ILIKE '%minimalist%' THEN 'Minimalism'
  WHEN tags::text ILIKE '%contemporary%' THEN 'Contemporary'
  WHEN tags::text ILIKE '%modern%' THEN 'Modern'
  WHEN tags::text ILIKE '%classical%' OR tags::text ILIKE '%classic%' THEN 'Classical'
  WHEN tags::text ILIKE '%baroque%' THEN 'Baroque'
  WHEN tags::text ILIKE '%renaissance%' THEN 'Renaissance'
  -- Check description as fallback
  WHEN description ILIKE '%abstract%' OR description ILIKE '%abstraction%' THEN 'Abstract'
  WHEN description ILIKE '%realism%' OR description ILIKE '%realistic%' THEN 'Realism'
  WHEN description ILIKE '%impressionism%' OR description ILIKE '%impressionist%' THEN 'Impressionism'
  WHEN description ILIKE '%expressionism%' OR description ILIKE '%expressionist%' THEN 'Expressionism'
  WHEN description ILIKE '%contemporary%' THEN 'Contemporary'
  WHEN description ILIKE '%modern%' THEN 'Modern'
  ELSE style -- Keep existing value if no match
END
WHERE uploaded_by_gallery_id IS NOT NULL
AND style IS NULL;

-- Step 3: Update genre field from tags/description
UPDATE "public"."Artwork"
SET genre = CASE
  WHEN tags::text ILIKE '%portrait%' THEN 'Portrait'
  WHEN tags::text ILIKE '%landscape%' THEN 'Landscape'
  WHEN tags::text ILIKE '%still life%' OR tags::text ILIKE '%stilllife%' THEN 'Still Life'
  WHEN tags::text ILIKE '%figure%' OR tags::text ILIKE '%figurative%' THEN 'Figure'
  WHEN tags::text ILIKE '%cityscape%' OR tags::text ILIKE '%urban%' THEN 'Cityscape'
  WHEN tags::text ILIKE '%seascape%' OR tags::text ILIKE '%sea%' THEN 'Seascape'
  WHEN tags::text ILIKE '%abstract%' THEN 'Abstract'
  WHEN tags::text ILIKE '%nude%' THEN 'Nude'
  WHEN description ILIKE '%portrait%' THEN 'Portrait'
  WHEN description ILIKE '%landscape%' THEN 'Landscape'
  WHEN description ILIKE '%still life%' OR description ILIKE '%stilllife%' THEN 'Still Life'
  WHEN description ILIKE '%cityscape%' OR description ILIKE '%urban%' THEN 'Cityscape'
  ELSE genre
END
WHERE uploaded_by_gallery_id IS NOT NULL
AND genre IS NULL;

-- Step 4: Update subject field from tags/description
UPDATE "public"."Artwork"
SET subject = CASE
  WHEN tags::text ILIKE '%portrait%' OR tags::text ILIKE '%person%' OR tags::text ILIKE '%human%' THEN 'Portrait'
  WHEN tags::text ILIKE '%landscape%' OR tags::text ILIKE '%nature%' OR tags::text ILIKE '%mountain%' OR tags::text ILIKE '%forest%' THEN 'Nature'
  WHEN tags::text ILIKE '%cityscape%' OR tags::text ILIKE '%urban%' OR tags::text ILIKE '%city%' OR tags::text ILIKE '%building%' THEN 'Urban'
  WHEN tags::text ILIKE '%still life%' OR tags::text ILIKE '%stilllife%' OR tags::text ILIKE '%object%' THEN 'Still Life'
  WHEN tags::text ILIKE '%animal%' OR tags::text ILIKE '%bird%' OR tags::text ILIKE '%dog%' OR tags::text ILIKE '%cat%' THEN 'Animal'
  WHEN tags::text ILIKE '%flower%' OR tags::text ILIKE '%floral%' THEN 'Flower'
  WHEN tags::text ILIKE '%abstract%' THEN 'Abstract'
  WHEN description ILIKE '%portrait%' OR description ILIKE '%person%' OR description ILIKE '%human%' THEN 'Portrait'
  WHEN description ILIKE '%landscape%' OR description ILIKE '%nature%' THEN 'Nature'
  WHEN description ILIKE '%cityscape%' OR description ILIKE '%urban%' THEN 'Urban'
  ELSE subject
END
WHERE uploaded_by_gallery_id IS NOT NULL
AND subject IS NULL;

-- Step 5: Update colour field from tags/description
UPDATE "public"."Artwork"
SET colour = CASE
  WHEN tags::text ILIKE '%red%' AND tags::text NOT ILIKE '%orange%' THEN 'Red'
  WHEN tags::text ILIKE '%blue%' THEN 'Blue'
  WHEN tags::text ILIKE '%green%' THEN 'Green'
  WHEN tags::text ILIKE '%yellow%' THEN 'Yellow'
  WHEN tags::text ILIKE '%orange%' THEN 'Orange'
  WHEN tags::text ILIKE '%purple%' OR tags::text ILIKE '%violet%' THEN 'Purple'
  WHEN tags::text ILIKE '%pink%' THEN 'Pink'
  WHEN tags::text ILIKE '%black%' AND tags::text ILIKE '%white%' THEN 'Monochrome'
  WHEN tags::text ILIKE '%black%' THEN 'Black'
  WHEN tags::text ILIKE '%white%' THEN 'White'
  WHEN tags::text ILIKE '%brown%' THEN 'Brown'
  WHEN tags::text ILIKE '%grey%' OR tags::text ILIKE '%gray%' THEN 'Grey'
  WHEN tags::text ILIKE '%gold%' OR tags::text ILIKE '%golden%' THEN 'Gold'
  WHEN tags::text ILIKE '%silver%' THEN 'Silver'
  WHEN tags::text ILIKE '%warm%' OR tags::text ILIKE '%warm tones%' THEN 'Warm tones'
  WHEN tags::text ILIKE '%cool%' OR tags::text ILIKE '%cool tones%' THEN 'Cool tones'
  WHEN tags::text ILIKE '%monochrome%' OR tags::text ILIKE '%monochromatic%' THEN 'Monochrome'
  WHEN tags::text ILIKE '%colorful%' OR tags::text ILIKE '%vibrant%' OR tags::text ILIKE '%bright%' THEN 'Colorful'
  WHEN description ILIKE '%red%' AND description NOT ILIKE '%orange%' THEN 'Red'
  WHEN description ILIKE '%blue%' THEN 'Blue'
  WHEN description ILIKE '%green%' THEN 'Green'
  WHEN description ILIKE '%warm tones%' THEN 'Warm tones'
  WHEN description ILIKE '%cool tones%' THEN 'Cool tones'
  WHEN description ILIKE '%monochrome%' OR description ILIKE '%monochromatic%' THEN 'Monochrome'
  WHEN description ILIKE '%colorful%' OR description ILIKE '%vibrant%' THEN 'Colorful'
  ELSE colour
END
WHERE uploaded_by_gallery_id IS NOT NULL
AND colour IS NULL;

-- Step 6: Verify the updates
SELECT 
  id,
  artwork_title,
  artist,
  style,
  genre,
  subject,
  colour,
  uploaded_by_gallery_id
FROM "public"."Artwork"
WHERE uploaded_by_gallery_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Step 7: Count how many artworks were updated
SELECT 
  COUNT(*) as total_gallery_artworks,
  COUNT(style) as artworks_with_style,
  COUNT(genre) as artworks_with_genre,
  COUNT(subject) as artworks_with_subject,
  COUNT(colour) as artworks_with_colour,
  COUNT(*) FILTER (WHERE style IS NOT NULL AND genre IS NOT NULL AND subject IS NOT NULL AND colour IS NOT NULL) as complete_metadata
FROM "public"."Artwork"
WHERE uploaded_by_gallery_id IS NOT NULL;

