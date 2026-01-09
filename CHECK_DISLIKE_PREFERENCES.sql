-- Diagnostic query to check if dislike preferences are being saved correctly
-- Run this in Supabase SQL Editor to verify the preferences are being updated

-- 1. Check all users' preferences (most recent first)
SELECT 
  id,
  user_id,
  preferences->>'viewed_artworks' as viewed_artworks_json,
  json_array_length((preferences->'viewed_artworks')::json) as viewed_artworks_count,
  preferences->'interactionCount' as interaction_count,
  last_interaction,
  created_at
FROM "public"."Collectors"
ORDER BY last_interaction DESC
LIMIT 10;

-- 1b. Check a specific user's preferences (replace the UUID below with your actual user ID)
-- To find your user ID, check the auth.users table or use the query above to see recent users
-- SELECT 
--   id,
--   user_id,
--   preferences->>'viewed_artworks' as viewed_artworks_json,
--   json_array_length((preferences->'viewed_artworks')::json) as viewed_artworks_count,
--   preferences->'interactionCount' as interaction_count,
--   last_interaction,
--   created_at
-- FROM "public"."Collectors"
-- WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid  -- Replace with your user ID
-- ORDER BY last_interaction DESC;

-- 2. Check if preferences column is being updated (check recent updates)
SELECT 
  id,
  user_id,
  preferences,
  last_interaction,
  created_at
FROM "public"."Collectors"
WHERE last_interaction > NOW() - INTERVAL '1 hour'
ORDER BY last_interaction DESC
LIMIT 10;

-- 3. Check RLS policies on Collectors table
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'Collectors'
ORDER BY cmd, policyname;

-- 4. Test if you can update preferences (replace with your user_id)
-- This should work if RLS policies are correct
-- Uncomment and replace the UUID below with your actual user ID
-- UPDATE "public"."Collectors"
-- SET 
--   preferences = jsonb_set(
--     COALESCE(preferences, '{}'::jsonb),
--     '{viewed_artworks}',
--     COALESCE(preferences->'viewed_artworks', '[]'::jsonb) || '["test-artwork-id"]'::jsonb
--   ),
--   last_interaction = NOW()
-- WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid  -- Replace with your user ID
-- RETURNING id, user_id, preferences->'viewed_artworks' as updated_viewed_artworks;

